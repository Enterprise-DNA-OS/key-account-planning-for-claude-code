---
description: Validate and import Salesforce Account and Contact exports used by DemandFarm.
---

Read CLAUDE.md. Validate and import Salesforce Account and Contact exports used by DemandFarm.

Run `npm run accounts -- import demandfarm --accounts=Account.csv [--contacts=Contact.csv] [--currency=] [--dry-run] --actor=`. Flags use `--name=value`; quote values containing spaces. Add `--json` for structured results. Substitute the operator's actual values and omit optional brackets. Never run literal placeholders.

Read the affected account or stakeholder before a mutation. Record the actual operator in --actor. If a name is ambiguous, show the candidates and ask which record they mean. Present findings with the account, owner, date and next action. Unknown evidence stays unknown. Planning estimates are not booked revenue; keep currencies separate.

Read docs/replace-demandfarm.md first. Run with --dry-run, reconcile counts and source identifiers, then import within the operator's authorised migration. This imports Account and Contact CSV files only. Custom planning objects require a reviewed mapping. Never invent vendor column names.
