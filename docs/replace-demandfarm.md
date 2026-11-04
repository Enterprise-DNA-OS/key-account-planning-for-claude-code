# Move owned records from DemandFarm

## Export the Salesforce-native records

DemandFarm describes account plans, relationship maps and whitespace as native Salesforce records in its [account-planning article](https://www.demandfarm.com/blog/best-quip-alternative-for-account-planning/). This guide is specifically for a Salesforce-native installation. Other deployments require a separate mapping.

An authorised Salesforce administrator can request a data export in Setup, Data Export. Salesforce documents [CSV backup exports](https://help.salesforce.com/s/articleView?id=admin_exportdata.htm&language=en_US&type=5), including edition-dependent timing and permission requirements. Exports can take time, so request yours before the switch day. Unzip the export locally and keep the original archive private. Use Account.csv and Contact.csv in UTF-8 for this import. Custom object exports remain part of your separate archive.

The [Salesforce Contact field reference](https://developer.salesforce.com/docs/platform/field-reference/references/field-reference/salesforce-field-reference-contact.html) documents Id, AccountId, FirstName and LastName. DemandFarm's [smart exports](https://www.demandfarm.com/blog/demandfarms-spring-release-omphalos/) are presentation reports. A presentation export is not the structured migration format used here.

## Test and import in one command

```sh
npm run accounts -- import demandfarm --accounts=imports/Account.csv --contacts=imports/Contact.csv --actor="Account owner" --dry-run
npm run accounts -- import demandfarm --accounts=imports/Account.csv --contacts=imports/Contact.csv --actor="Account owner"
```

Use a fresh migrated database, without demo seed data. If CurrencyIsoCode is absent, add --currency= with your actual organisation currency. The first command checks the complete import then rolls it back. The second commits the same records. Account records load first; contacts must reference an existing AccountId. Duplicate IDs, changed existing source rows, invalid emails, malformed CSV or an unknown account roll back the whole batch. Exact repeat files do not create duplicates. Dates and files remain local. Snapshots use npm run accounts -- export --out=exports/snapshot.json after you create the private exports folder.

## What maps

| Source | Destination |
|---|---|
| Account.Id | source_id and stable SF-prefixed code |
| Account.Name | account name |
| Account.OwnerId | owner label, kept as the source ID until mapped |
| Account.CurrencyIsoCode | account currency when exported; otherwise supply --currency=NZD (or the actual organisation currency), with no guessed default |
| Contact.Id and AccountId | stable stakeholder identity and account link |
| Contact.FirstName and LastName | professional contact name |
| Contact.Title, Email and OwnerId | title, email and relationship-owner label |
| Other columns | original raw row retained without interpreting its meaning |

The supplied fixtures are synthetic files with documented Salesforce fields. They are not a captured DemandFarm export. IDs must be 15 or 18 alphanumeric characters; keep their case. Person Accounts require a separate reviewed mapping and are rejected when IsPersonAccount is true.

## What needs a separate mapping

DemandFarm's custom objects, buying-role fields, account plans, coverage cells, actions, notes, attachments and review history are not automatically imported. Neither are opportunities, contact hierarchies, dashboards, permissions or live connections. Do not guess managed-package field names. Obtain the actual object definitions and sample exports, map them to the nine domain record types, test on a temporary copy and reconcile counts before extending the importer. Enterprise DNA handles this work for an installed version.

For the supported Account and Contact files, importing is one command after export. Moving a full account-planning history is not an unconditional one-day promise. Check an account, a contact and the source IDs against Salesforce, review purposes and roles, and test a quarterly review before deciding when to stop the old system. Keep the original archive and test restoring a native database backup.
