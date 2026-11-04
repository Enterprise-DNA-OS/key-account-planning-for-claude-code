# Key Account Planning for Claude Code

Keep account growth plans, stakeholder coverage, product gaps and quarterly reviews in a database you own.

## Three ways to own it

- **Do it yourself:** this MIT-licensed base runs with Claude Code, Codex, OpenCode or Cursor. Agent subscriptions and hosting are separate.
- **We customise it:** Enterprise DNA maps the agreed DemandFarm history, adapts your account rules and builds the connections, web front end or different stack you need. One setup fee, then a retainer for ongoing work.
- **We run it for you:** Omni by Enterprise DNA installs your version, manages access and backups and prepares the weekly account review. One setup fee, then a retainer.

[Book a 30-minute call with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=demandfarm).

## Run the synthetic demo

Node 20 or newer. No cloud account is needed.

```sh
npm install
npm test
npm run demo
npm run accounts -- portfolio
npm run accounts -- whitespace --json
npm run accounts -- relationship-gaps
npm run view
npm run docs
```

The fictional accounts include an overdue review, a quiet champion, missing decision-maker coverage, unserved units, unknown estimates and missed actions. Seeding is idempotent and preserves existing records. Use a fresh DATA_DIR for real work and never seed the working database. DATABASE_URL selects PostgreSQL; without it the local PGlite database lives in .data/db.

## What the base does

Nine record types and five views support the weekly account-planning cycle. A product's position in each business unit is ours, competitor, unserved or unknown. Potential is an optional planning estimate in the account's currency, never pipeline or booked revenue. Unknown does not become zero. The system does not add currencies together.

Growth plays have owners, dates and success measures. Actions must belong to an open play and any linked stakeholder must belong to the same account. A play cannot close with outstanding actions. A quarterly review preserves the plan as it stood and sets the next review date. Departed contacts stop counting towards active decision-maker coverage. Every mutation records the supplied operator label and its result. Reviews, interactions, imports and the activity record are append-only through ordinary writes.

The five recurring rituals are review preparation, relationship coverage, whitespace review, growth-play follow-through and the weekly account review. This is an independent implementation of those owned-record workflows. DemandFarm also provides interactive mapping, connected recommendations and Salesforce workflows. This base has no live CRM sync, external account research, drag-and-drop org chart, email delivery or licensed prospect data. It is useful with owned records and exports; it does not claim to reproduce every vendor dashboard.

## Recurring jobs

| Command | Purpose |
|---|---|
| /portfolio | Compare account reviews, decision-maker coverage and overdue actions. |
| /reviews-due | Prepare the accounts whose quarterly review is due. |
| /stakeholders | Read stakeholder roles, stances and contact history. |
| /relationship-gaps | Find quiet relationships and unknown decision roles. |
| /coverage | Read each business unit and product, including unknown coverage. |
| /whitespace | Review unserved or competitor-held business units and their evidence. |
| /plays | Read the growth plays and measurable customer outcomes. |
| /actions | Read assigned account actions and their outcomes. |
| /overdue | Find missed actions and the accountable owner. |
| /compliance | Check purpose, accuracy and retention review evidence. |
| /activity | Read the append-only operator activity log. |
| /account | Read one account and all its planning records. |
| /stakeholder | Read one stakeholder and the recorded interactions. |
| /add-account | Open an owned account plan with its objective and review date. |
| /add-stakeholder | Add a stakeholder with unverified influence and stance. |
| /review-stakeholder | Record verified influence, stance, purpose and retention review. |
| /depart-stakeholder | Mark a contact as departed and retain the reason. |
| /assess-coverage | Record or revise evidence for one product and business unit. |
| /add-play | Start a growth play with an owner and success measure. |
| /add-action | Assign a dated action to an open play. |
| /complete-action | Record the outcome of an action. |
| /close-play | Close a play after every action is complete. |
| /log-contact | Record a conversation that happened. |
| /record-review | Save the review findings, a snapshot and next review date. |
| /import | Validate and import Salesforce Account and Contact exports used by DemandFarm. |
| /export | Save a complete private snapshot to a new file. |
| /draft-account-plan | Prepare an internal account growth plan. |
| /draft-review-agenda | Prepare an internal quarterly review agenda. |
| /weekly-review | Draft the weekly review from review dates, relationship gaps and overdue actions. |
| /help | List supported commands and arguments. |
| /customise | Change fields or rules through a tested migration. |
| /new-view | Add a branded read-only report from your own records. |

All 30 CLI commands support --json. The two agent recipes bring the total to 32 slash commands. Run npm run accounts -- help for arguments. Flags use --name=value. Names match without case sensitivity; partial IDs and names are accepted only when they identify one record. Ambiguous requests list candidates and exit with code 1. Dates use YYYY-MM-DD in UTC.

## Ten questions your own records answer

1. Which accounts have overdue actions and no recorded decision-maker? (`portfolio`)
2. Which reviews are overdue or have never been scheduled? (`reviews-due`)
3. Which influential contacts have been quiet for more than thirty days? (`relationship-gaps`)
4. Which business units are still marked unknown rather than unserved? (`coverage`)
5. Which unserved units rely on an assessment older than ninety days? (`whitespace`)
6. Which competitor-held units have a named product and supporting evidence? (`whitespace`)
7. Which growth plays have a measurable outcome and an accountable owner? (`plays`)
8. Which actions are overdue and who owns each one? (`overdue`)
9. Which stakeholder records lack a purpose, current verification or retention review? (`compliance`)
10. What did the account plan say at the last quarterly review? (`account A-001`)

These are implemented questions, not a claim that DemandFarm cannot answer them. Owning the queries lets your team join evidence and change its own review rules.

## Your first hour: ten things to ask for

1. Put our business name and colours in brand.json.
2. Show accounts with no recorded decision-maker.
3. Show quiet champions before the next review.
4. Show missed actions and the responsible owner.
5. Separate unknown coverage from confirmed gaps.
6. Show the evidence behind one expansion estimate.
7. Prepare a quarterly review agenda.
8. Test our Account and Contact exports and reconcile identifiers.
9. Add our account tier through a tested migration.
10. Export a private snapshot before changing the review policy.

## Move from DemandFarm

[The replace guide](docs/replace-demandfarm.md) documents the one-command import of Salesforce Account.csv and Contact.csv for a Salesforce-native DemandFarm installation. Custom DemandFarm account plans, relationship attributes and coverage objects need a reviewed mapping, not a guessed file format. The fixtures are synthetic examples of the documented Salesforce fields, not a captured vendor export. Run a test import before committing to a switch.

Exact repeat imports are harmless. Changed existing source rows stop the whole import, as do duplicate identifiers and orphan contacts. The complete import rolls back on a failed row. Original columns and original CSV text are retained for reconciliation, so treat the database and snapshots as private. Imported contacts remain unverified; an imported title is not evidence of buying authority. Owner IDs stay IDs until mapped to people.

## Documents and views

npm run docs produces account growth plans and quarterly review agendas as branded HTML. npm run view produces the weekly review, relationship coverage and whitespace reports. Edit brand.json to use your name, colours and logo. Reports are read-only, can be printed to PDF and remain local. Draft commands write to drafts/. They never send. Review content and recipients before sharing.

[Compliance](docs/compliance.md) records the sourced privacy checks and their limits. [Why no front end](docs/why-no-front-end.md) describes mobile, offline and collaboration limitations. [Research](docs/research.md) records the selection evidence.

## Validation and deployment

npm test creates a temporary database, migrates twice, seeds twice and exercises every CLI command. It checks atomic imports, repeat and conflicting files, date validation, account boundaries, lifecycle closure, append-only history, snapshots, escaped HTML and CLI exit codes. CI is configured for Ubuntu and Windows on Node 20 and 22, plus PostgreSQL 17. Configuration is not proof of a hosted run; see the build report for executed checks. TEST_DATABASE_URL must point at an empty disposable database.

This is a trusted-operator tool, not a multi-user application. Row-level security is enabled and PUBLIC privileges revoked on domain records and views. The database owner can bypass these restrictions. Supplied actor names are labels, not authenticated identities. Protect the host and credentials, restrict database access and choose a backup and retention policy before importing real records. Export writes a new complete JSON snapshot; restore is not automated. Use native backups too. Concurrency is serialized for CLI mutations; code or database-owner access can bypass application rules.

## Licence

MIT. Copyright 2026 Enterprise DNA. DemandFarm and Salesforce belong to their respective owners. No vendor code, customer records or licensed datasets are included.
