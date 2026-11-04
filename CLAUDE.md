# Key Account Planning for Claude Code: operating instructions

This system serves the account director and account managers of an owner-led B2B supplier. Keep customer objectives, relationship evidence, coverage gaps and promised actions current.

## Working rules

Read records before advising or writing. Use the CLI below; never invent a contact, buying role, estimate or completed conversation. Treat an unknown fact as unknown. Keep every currency separate. Estimates are not booked revenue. Synthetic demo records are not customer evidence.

Read docs/replace-demandfarm.md before importing. Use a temporary DATA_DIR for a demo and leave DATABASE_URL empty; never seed a real database. Run the test import, reconcile identifiers and counts, then import within the operator's authorised migration. Custom vendor objects need a reviewed mapping.

Every mutation needs the actual operator label in --actor. Labels are not authentication. Any sending, publishing, deletion or customer-facing action requires explicit authorization. This tool only drafts; it has no sending command. Generated reports and complete snapshots contain private records.

## One route per recurring job

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
| /customise | Read the recipe, write the next migration, test it and apply it within the operator's authorized change. |
| /new-view | Read the recipe and add a read-only branded report. |

Use npm run accounts -- help for exact arguments. Each recipe lives in .claude/commands/. Claude Code, Codex, OpenCode and Cursor share the same code and database. If a request does not fit a command, inspect the schema and propose a specific extension, then test the approved change. Do not invent unsupported command names.

## Data and documents

scripts/accounts.mjs is the one domain CLI. supabase/migrations/ contains versioned migrations. views.json and documents.json define read-only outputs. brand.json supplies branding. docs/compliance.md defines sourced checks and the local policy boundaries. Record corrections to immutable history through a reviewed migration or a new correction entry, never by silently rewriting the past.

Built and run by Enterprise DNA: https://enterprisedna.co/omni/instead-of/demandfarm
