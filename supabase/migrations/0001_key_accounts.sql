create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

create table accounts (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 owner text not null, currency text not null default 'NZD' check(currency ~ '^[A-Z]{3}$'),
 objective text not null default '', review_due date, status text not null default 'active' check(status in ('active','archived')),
 source_id text unique, raw jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table stakeholders (
 id uuid primary key default gen_random_uuid(), code text not null unique, account_id uuid not null references accounts,
 name text not null, title text not null default '', email text not null default '', owner text not null,
 influence text not null default 'unknown' check(influence in ('decision','influencer','user','unknown')),
 stance text not null default 'unknown' check(stance in ('champion','neutral','blocker','unknown')),
 status text not null default 'active' check(status in ('active','departed')),
 purpose text not null default '', source text not null default '', verified_on date, review_due date,
 source_id text unique, raw jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,account_id)
);
create table coverage (
 id uuid primary key default gen_random_uuid(), code text not null unique, account_id uuid not null references accounts,
 business_unit text not null, product text not null, status text not null check(status in ('ours','competitor','unserved','unknown')),
 competitor text not null default '', potential_cents bigint check(potential_cents between 0 and 9000000000000),
 evidence text not null, assessed_on date not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(account_id,business_unit,product), check(status <> 'competitor' or length(trim(competitor))>0)
);
create table plays (
 id uuid primary key default gen_random_uuid(), code text not null unique, account_id uuid not null references accounts,
 name text not null, owner text not null, success_measure text not null, due date not null,
 status text not null default 'open' check(status in ('open','complete','cancelled')), outcome text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,account_id),
 check(status='open' or length(trim(outcome))>0)
);
create table actions (
 id uuid primary key default gen_random_uuid(), code text not null unique, account_id uuid not null references accounts,
 play_id uuid not null, stakeholder_id uuid, name text not null, owner text not null, due date not null,
 status text not null default 'open' check(status in ('open','complete')), outcome text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(play_id,account_id) references plays(id,account_id), foreign key(stakeholder_id,account_id) references stakeholders(id,account_id),
 check(status='open' or length(trim(outcome))>0)
);
create table interactions (
 id uuid primary key default gen_random_uuid(), stakeholder_id uuid not null references stakeholders,
 happened_on date not null, note text not null, actor text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table reviews (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references accounts,
 note text not null, next_due date not null, actor text not null, snapshot jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table imports (
 id uuid primary key default gen_random_uuid(), digest text not null unique, actor text not null, files jsonb not null, counts jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), actor text not null, command text not null, record_id uuid, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function append_only() returns trigger language plpgsql as $$ begin raise exception 'Record is append-only'; end $$;
do $$ declare t text; begin
 foreach t in array array['accounts','stakeholders','coverage','plays','actions','interactions','reviews','imports','activity'] loop
 execute format('create trigger touch_updated before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
 foreach t in array array['interactions','reviews','imports','activity'] loop
 execute format('create trigger immutable before update or delete on %I for each row execute function append_only()',t);
 end loop;
end $$;
create index on stakeholders(account_id); create index on interactions(stakeholder_id,happened_on);
create index on actions(account_id,status,due); create index on coverage(account_id); create index on plays(account_id,status);

create view relationship_gaps as
select s.id,s.account_id,s.code,s.name,a.name as account,s.owner,s.title,s.influence,s.stance,s.status,
 max(i.happened_on) as last_contact,
 case when s.status='departed' then 'departed'
 when max(i.happened_on) is null then 'never contacted'
 when max(i.happened_on)<current_date-30 then 'quiet over 30 days' else 'current' end as attention
from stakeholders s join accounts a on a.id=s.account_id left join interactions i on i.stakeholder_id=s.id
group by s.id,a.name;

create view account_portfolio as
select a.id,a.code,a.name,a.owner,a.currency,a.objective,a.review_due,a.status,
 case when a.review_due is null then 'not scheduled' when a.review_due<current_date then 'overdue' else 'scheduled' end as review_status,
 (select count(*)::int from stakeholders s where s.account_id=a.id and s.status='active' and s.influence='decision') as decision_makers,
 (select count(*)::int from relationship_gaps r where r.account_id=a.id and r.status='active' and r.attention<>'current') as quiet_contacts,
 (select count(*)::int from actions x where x.account_id=a.id and x.status='open' and x.due<current_date) as overdue_actions,
 (select count(*)::int from plays p where p.account_id=a.id and p.status='open') as open_plays,
 (select count(*)::int from coverage c where c.account_id=a.id and c.status='unknown') as unknown_cells
from accounts a;

create view whitespace as
select c.id,c.account_id,c.code,a.name as account,c.business_unit,c.product,c.status,c.competitor,c.potential_cents,a.currency,c.evidence,c.assessed_on,
 case when c.assessed_on<current_date-90 then 'refresh evidence' else 'current evidence' end as attention
from coverage c join accounts a on a.id=c.account_id;

create view action_queue as
select x.id,x.account_id,x.code,a.name as account,p.name as play,x.name,x.owner,x.due,x.status,x.outcome,
 case when x.status='complete' then 'complete' when x.due<current_date then 'overdue' when x.due<=current_date+7 then 'this week' else 'later' end as attention
from actions x join accounts a on a.id=x.account_id join plays p on p.id=x.play_id;

create view compliance_findings as
select s.code,s.name,a.name as account,'NZ-IPP1' as rule,'Record purpose and source' as finding from stakeholders s join accounts a on a.id=s.account_id where s.purpose='' or s.source=''
union all
select s.code,s.name,a.name,'NZ-IPP8','Verify current role before use' from stakeholders s join accounts a on a.id=s.account_id where s.verified_on is null or s.verified_on<current_date-90
union all
select s.code,s.name,a.name,'NZ-IPP9','Review retention necessity' from stakeholders s join accounts a on a.id=s.account_id where s.review_due is null or s.review_due<current_date
union all
select s.code,s.name,a.name,'LOCAL-DEPARTED','Review departed contact and retained history' from stakeholders s join accounts a on a.id=s.account_id where s.status='departed';

revoke all on account_portfolio,relationship_gaps,whitespace,action_queue,compliance_findings from public;
