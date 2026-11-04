#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {page,table,writeOut} from './lib/render.mjs';
import {table as textTable} from './lib/format.mjs';

export const reads={
 'portfolio':"select code,name,owner,review_status,decision_makers,quiet_contacts,overdue_actions,open_plays,unknown_cells from account_portfolio where status='active' order by code",
 'reviews-due':"select code,name,owner,review_due,review_status from account_portfolio where status='active' and (review_due is null or review_due<=current_date+7) order by review_due nulls first,code",
 'stakeholders':"select code,name,account,title,owner,influence,stance,status,last_contact,attention from relationship_gaps order by account,code",
 'relationship-gaps':"select code,name,account,influence,stance,last_contact,attention from relationship_gaps where status='active' and (attention<>'current' or influence='unknown') order by account,code",
 'coverage':"select code,account,business_unit,product,status,competitor,potential_cents,currency,attention from whitespace order by account,code",
 'whitespace':"select code,account,business_unit,product,status,competitor,potential_cents,currency,attention from whitespace where status in ('unserved','competitor') order by account,code",
 'plays':"select p.code,a.name as account,p.name,p.owner,p.success_measure,p.due,p.status,p.outcome from plays p join accounts a on a.id=p.account_id order by p.due,p.code",
 'actions':"select code,account,play,name,owner,due,status,outcome,attention from action_queue order by due,code",
 'overdue':"select code,account,name,owner,due,attention from action_queue where attention='overdue' order by due,code",
 'compliance':"select * from compliance_findings order by account,code,rule",
 'activity':"select actor,command,record_id,detail,created_at from activity order by created_at,id"
};
export const usage={
 ...Object.fromEntries(Object.keys(reads).map(k=>[k,''])),
 'account':'<account>', 'stakeholder':'<stakeholder>',
 'add-account':'--code= --name= --owner= --currency= --objective= --review-due= --actor=',
 'add-stakeholder':'--code= --account= --name= --title= --owner= [--email=] --actor=',
 'review-stakeholder':'<stakeholder> --influence= --stance= --purpose= --source= --verified-on= --review-due= --actor=',
 'depart-stakeholder':'<stakeholder> --evidence= --actor=',
 'assess-coverage':'--code= --account= --unit= --product= --status= --evidence= --assessed-on= [--competitor=] [--potential=] --actor=',
 'add-play':'--code= --account= --name= --owner= --measure= --due= --actor=',
 'add-action':'--code= --play= --name= --owner= --due= [--stakeholder=] --actor=',
 'complete-action':'<action> --outcome= --actor=',
 'close-play':'<play> --status=complete|cancelled --outcome= --actor=',
 'log-contact':'<stakeholder> --date= --note= --actor=',
 'record-review':'<account> --note= --next-due= --actor=',
 'import':'demandfarm --accounts=Account.csv [--contacts=Contact.csv] [--currency=] [--dry-run] --actor=',
 'export':'--out=<new-file.json>',
 'draft-account-plan':'<account>', 'draft-review-agenda':'<account>', 'weekly-review':'', 'help':''
};
const tables=['accounts','stakeholders','coverage','plays','actions','interactions','reviews','imports','activity'];
const mutating=new Set(['add-account','add-stakeholder','review-stakeholder','depart-stakeholder','assess-coverage','add-play','add-action','complete-action','close-play','log-contact','record-review','import']);
const today=()=>new Date().toISOString().slice(0,10);
function need(v,label){if(typeof v!=='string'||!v.trim())throw Error(`${label} is required`);return v.trim();}
function date(v,label,{past=false,future=false}={}){v=need(v,label);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`${label} requires a real YYYY-MM-DD date`);if(past&&v>today())throw Error(`${label} cannot be in the future`);if(future&&v<today())throw Error(`${label} cannot be in the past`);return v;}
function one(v,values,label){if(!values.includes(v))throw Error(`${label} must be ${values.join(', ')}`);return v;}
function money(v){if(v===undefined||v==='unknown')return null;if(!/^\d+(\.\d{1,2})?$/.test(v))throw Error('potential must be a nonnegative amount with at most two decimals or unknown');const [whole,part='']=v.split('.');const n=BigInt(whole)*100n+BigInt(part.padEnd(2,'0'));if(n>9000000000000n)throw Error('potential exceeds limit');return Number(n);}
function parse(args){const pos=[],f={};for(const arg of args){if(!arg.startsWith('--')){pos.push(arg);continue;}const [key,...rest]=arg.slice(2).split('=');if(Object.hasOwn(f,key))throw Error(`Duplicate flag --${key}`);f[key]=rest.length?rest.join('='):true;}const cmd=pos.shift()||'help';if(!Object.hasOwn(usage,cmd))throw Error(`Unknown command ${cmd}`);const allowed=new Set(['json',...[...usage[cmd].matchAll(/--([a-z-]+)/g)].map(m=>m[1])]);for(const k of Object.keys(f)){if(!allowed.has(k))throw Error(`Unknown flag --${k}`);if(['json','dry-run'].includes(k)&&f[k]!==true)throw Error(`--${k} is a boolean flag`);if(!['json','dry-run'].includes(k)&&typeof f[k]!=='string')throw Error(`--${k} requires =value`);}const count=usage[cmd].startsWith('<')||cmd==='import'?1:0;if(pos.length!==count)throw Error(`Usage: ${cmd} ${usage[cmd]}`);return {cmd,pos,f};}
async function resolve(db,t,q){q=need(q,t);const rows=await db.query(`select * from ${t} order by code`);const exact=rows.filter(r=>[r.code,r.name,r.id].some(v=>String(v).toLowerCase()===q.toLowerCase()));const hits=exact.length?exact:rows.filter(r=>String(r.id).startsWith(q.toLowerCase())||String(r.code).toLowerCase().startsWith(q.toLowerCase())||String(r.name||'').toLowerCase().includes(q.toLowerCase()));if(hits.length!==1)throw Error(hits.length?`Ambiguous ${t}:\n${hits.map(r=>`${r.code} | ${r.name||r.product} | ${r.id}`).join('\n')}`:`No matching ${t}: ${q}`);return hits[0];}
async function activeAccount(db,q){const a=await resolve(db,'accounts',q);if(a.status!=='active')throw Error('Account is archived');return a;}
async function insert(db,t,obj){const keys=Object.keys(obj);return (await db.query(`insert into ${t} (${keys.join(',')}) values (${keys.map((_,i)=>`$${i+1}`).join(',')}) returning *`,Object.values(obj)))[0];}
async function accountDetail(db,q){const a=await resolve(db,'accounts',q);return {account:a,portfolio:(await db.query('select * from account_portfolio where id=$1',[a.id]))[0],stakeholders:await db.query('select * from relationship_gaps where account_id=$1 order by code',[a.id]),coverage:await db.query('select * from whitespace where account_id=$1 order by code',[a.id]),plays:await db.query('select * from plays where account_id=$1 order by code',[a.id]),actions:await db.query('select * from action_queue where account_id=$1 order by due,code',[a.id]),reviews:await db.query('select * from reviews where account_id=$1 order by created_at',[a.id])};}

async function importData(db,f){
 const accountFile=need(f.accounts,'accounts'),contactFile=f.contacts;
 const files={accounts:fs.readFileSync(accountFile,'utf8'),contacts:contactFile?fs.readFileSync(contactFile,'utf8'):''};
 const digest=createHash('sha256').update(JSON.stringify(files)).digest('hex');
 if((await db.query('select id from imports where digest=$1',[digest])).length)return {repeat:true,inserted_accounts:0,inserted_contacts:0};
 const accounts=parseCsv(files.accounts),contacts=contactFile?parseCsv(files.contacts):[];
 if(!accounts.length)throw Error('Account CSV is empty');
 if(contactFile&&!contacts.length)throw Error('Contact CSV is empty');
 const counts={inserted_accounts:0,inserted_contacts:0,unchanged:0};
 for(const [kind,rows] of [['accounts',accounts],['stakeholders',contacts]]){
  const seen=new Set();
  for(const row of rows){
   const sourceId=need(pick(row,'Id'),'Id');if(!/^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/.test(sourceId))throw Error('Id must be a 15 or 18 character Salesforce ID');
   if(seen.has(sourceId))throw Error(`Duplicate Id in ${kind}: ${sourceId}`);seen.add(sourceId);
   const old=(await db.query(`select * from ${kind} where source_id=$1`,[sourceId]))[0];
   if(old){if(JSON.stringify(Object.entries(old.raw).sort())!==JSON.stringify(Object.entries(row).sort()))throw Error(`Conflicting existing ${kind} ${sourceId}; review the mapping before updating`);counts.unchanged++;continue;}
   if(kind==='accounts'){
    if(pick(row,'IsPersonAccount').toLowerCase()==='true')throw Error('Person Accounts require a separate reviewed mapping');
    await insert(db,'accounts',{code:'SF-'+sourceId,name:need(pick(row,'Name'),'Name'),owner:pick(row,'OwnerId')||'Unassigned',currency:one(pick(row,'CurrencyIsoCode')||need(f.currency,'currency (required when CurrencyIsoCode is absent)'),['NZD','AUD','USD','GBP','EUR'],'CurrencyIsoCode'),source_id:sourceId,raw:row});counts.inserted_accounts++;
   }else{
    const accountId=need(pick(row,'AccountId'),'AccountId');const a=(await db.query('select * from accounts where source_id=$1',[accountId]))[0];if(!a)throw Error(`Unknown AccountId ${accountId}`);
    const email=pick(row,'Email').trim();if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid Email');
    await insert(db,'stakeholders',{code:'SF-'+sourceId,account_id:a.id,name:[pick(row,'FirstName'),need(pick(row,'LastName'),'LastName')].filter(Boolean).join(' '),title:pick(row,'Title'),email,owner:pick(row,'OwnerId')||a.owner,source:'Salesforce export for DemandFarm migration',source_id:sourceId,raw:row});counts.inserted_contacts++;
   }
  }
 }
 await insert(db,'imports',{digest,actor:f.actor,files,counts});return {...counts,dry_run:!!f['dry-run']};
}

async function execute(db,{cmd,pos,f}){
 if(cmd==='help')return Object.entries(usage).map(([command,args])=>({command,args}));
 if(reads[cmd])return db.query(reads[cmd]);
 if(cmd==='account')return accountDetail(db,pos[0]);
 if(cmd==='stakeholder'){const s=await resolve(db,'stakeholders',pos[0]);return {stakeholder:s,interactions:await db.query('select * from interactions where stakeholder_id=$1 order by happened_on,created_at',[s.id])};}
 if(cmd==='add-account')return insert(db,'accounts',{code:need(f.code,'code'),name:need(f.name,'name'),owner:need(f.owner,'owner'),currency:one(f.currency,['NZD','AUD','USD','GBP','EUR'],'currency'),objective:need(f.objective,'objective'),review_due:date(f['review-due'],'review-due')});
 if(cmd==='add-stakeholder'){
  const a=await activeAccount(db,f.account);const email=f.email||'';if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Invalid email');
  return insert(db,'stakeholders',{code:need(f.code,'code'),account_id:a.id,name:need(f.name,'name'),title:need(f.title,'title'),owner:need(f.owner,'owner'),email});
 }
 if(cmd==='review-stakeholder'){
  const s=await resolve(db,'stakeholders',pos[0]);if(s.status==='departed')throw Error('Departed contact requires a separate reviewed correction');
  return (await db.query('update stakeholders set influence=$2,stance=$3,purpose=$4,source=$5,verified_on=$6,review_due=$7 where id=$1 returning *',[s.id,one(f.influence,['decision','influencer','user','unknown'],'influence'),one(f.stance,['champion','neutral','blocker','unknown'],'stance'),need(f.purpose,'purpose'),need(f.source,'source'),date(f['verified-on'],'verified-on',{past:true}),date(f['review-due'],'review-due',{future:true})]))[0];
 }
 if(cmd==='depart-stakeholder'){
  const s=await resolve(db,'stakeholders',pos[0]);need(f.evidence,'evidence');return (await db.query("update stakeholders set status='departed' where id=$1 returning *",[s.id]))[0];
 }
 if(cmd==='assess-coverage'){
  const a=await activeAccount(db,f.account);const status=one(f.status,['ours','competitor','unserved','unknown'],'status');const competitor=status==='competitor'?need(f.competitor,'competitor'):'';
  const row={code:need(f.code,'code'),account_id:a.id,business_unit:need(f.unit,'unit'),product:need(f.product,'product'),status,competitor,potential_cents:money(f.potential),evidence:need(f.evidence,'evidence'),assessed_on:date(f['assessed-on'],'assessed-on',{past:true})};
  const old=(await db.query('select * from coverage where code=$1',[row.code]))[0];if(!old)return insert(db,'coverage',row);
  if(old.account_id!==a.id||old.business_unit!==row.business_unit||old.product!==row.product)throw Error('Coverage identity cannot change; use a new code');
  if(row.assessed_on<old.assessed_on)throw Error('Assessment cannot precede existing evidence');
  return (await db.query('update coverage set status=$2,competitor=$3,potential_cents=$4,evidence=$5,assessed_on=$6 where id=$1 returning *',[old.id,status,competitor,row.potential_cents,row.evidence,row.assessed_on]))[0];
 }
 if(cmd==='add-play'){
  const a=await activeAccount(db,f.account);return insert(db,'plays',{code:need(f.code,'code'),account_id:a.id,name:need(f.name,'name'),owner:need(f.owner,'owner'),success_measure:need(f.measure,'measure'),due:date(f.due,'due')});
 }
 if(cmd==='add-action'){
  const p=await resolve(db,'plays',f.play);if(p.status!=='open')throw Error('Play is closed');const s=f.stakeholder?await resolve(db,'stakeholders',f.stakeholder):null;
  if(s&&(s.account_id!==p.account_id||s.status!=='active'))throw Error('Stakeholder must be active and belong to the same account');
  return insert(db,'actions',{code:need(f.code,'code'),account_id:p.account_id,play_id:p.id,stakeholder_id:s?.id||null,name:need(f.name,'name'),owner:need(f.owner,'owner'),due:date(f.due,'due')});
 }
 if(cmd==='complete-action'){
  const a=await resolve(db,'actions',pos[0]);if(a.status!=='open')throw Error('Action already complete');return (await db.query("update actions set status='complete',outcome=$2 where id=$1 returning *",[a.id,need(f.outcome,'outcome')]))[0];
 }
 if(cmd==='close-play'){
  const p=await resolve(db,'plays',pos[0]);if(p.status!=='open')throw Error('Play already closed');if((await db.query("select id from actions where play_id=$1 and status='open'",[p.id])).length)throw Error('Complete outstanding actions before closing the play');return (await db.query('update plays set status=$2,outcome=$3 where id=$1 returning *',[p.id,one(f.status,['complete','cancelled'],'status'),need(f.outcome,'outcome')]))[0];
 }
 if(cmd==='log-contact'){
  const s=await resolve(db,'stakeholders',pos[0]);if(s.status!=='active')throw Error('Contact has departed');return insert(db,'interactions',{stakeholder_id:s.id,happened_on:date(f.date,'date',{past:true}),note:need(f.note,'note'),actor:f.actor});
 }
 if(cmd==='record-review'){
  const a=await activeAccount(db,pos[0]);const next=date(f['next-due'],'next-due',{future:true});const snapshot=await accountDetail(db,a.code);delete snapshot.reviews;
  const r=await insert(db,'reviews',{account_id:a.id,note:need(f.note,'note'),next_due:next,actor:f.actor,snapshot});await db.query('update accounts set review_due=$2 where id=$1',[a.id,next]);return r;
 }
 if(cmd==='import'){if(pos[0]!=='demandfarm')throw Error('Only import demandfarm is supported');return importData(db,f);}
 if(cmd==='export'){
  const file=path.resolve(need(f.out,'out'));const data={format:'key-account-planning-v1',exported_at:new Date().toISOString()};for(const t of tables)data[t]=await db.query(`select * from ${t} order by id`);
  fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});return {file,counts:Object.fromEntries(tables.map(t=>[t,data[t].length]))};
 }
 if(cmd==='weekly-review'){
  const sections=[];for(const name of ['reviews-due','relationship-gaps','overdue'])sections.push({title:name.replaceAll('-',' '),html:table(await db.query(reads[name]))});
  return {file:writeOut('drafts',`weekly-review-${randomUUID()}`,page({title:'Weekly key account review',subtitle:'Internal draft. Synthetic when using demo data.',sections}))};
 }
 if(cmd==='draft-account-plan'||cmd==='draft-review-agenda'){
  const d=await accountDetail(db,pos[0]);const sections=[{title:'Account objective',html:table([{account:d.account.name,owner:d.account.owner,objective:d.account.objective,review_due:d.account.review_due}])},{title:'Coverage and planning estimates',note:'Potential is an estimate, not a sales forecast. Blank means unknown.',html:table(d.coverage,['business_unit','product','status','potential_cents','currency','attention'])},{title:'Growth plays',html:table(d.plays,['name','owner','success_measure','due','status'])},{title:'Actions',html:table(d.actions,['name','owner','due','status','attention'])}];
  return {file:writeOut('drafts',`${cmd}-${randomUUID()}`,page({title:cmd==='draft-account-plan'?'Account growth plan':'Quarterly review agenda',subtitle:`${d.account.name}. Internal draft for review before sharing.`,sections}))};
 }
 throw Error('Command not implemented');
}

export async function run(db,args){
 const input=parse(args),{cmd,f}=input;const write=mutating.has(cmd);if(write)f.actor=need(f.actor,'actor');
 await db.exec(write?'BEGIN':'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 try{
  // Serialize owner-operated mutations so closure checks and their writes share one state.
  if(write)await db.exec('LOCK TABLE accounts IN SHARE ROW EXCLUSIVE MODE');
  const result=await execute(db,input);
  if(write)await insert(db,'activity',{actor:f.actor,command:cmd,record_id:result.id||null,detail:{arguments:input.pos,flags:Object.fromEntries(Object.entries(f).filter(([k])=>k!=='json')),result}});
  await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
export function format(value){
 if(!Array.isArray(value))return JSON.stringify(value,null,2);
 if(!value.length)return 'No records.';
 return textTable(value,Object.keys(value[0]).map(key=>({key,label:key.replaceAll('_',' '),width:55,format:v=>v===null?'unknown':typeof v==='object'?JSON.stringify(v):String(v)})));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{db=await getDb();const result=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):format(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{await db?.close();}}
