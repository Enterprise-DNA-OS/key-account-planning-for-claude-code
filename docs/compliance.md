# Record checks and privacy sources

Checked 2026-11-04. These checks support the record owner's review; they are not a compliance certificate or a substitute for applying the rules to the business. This is an operational account-planning tool, not regulated advice, payment processing or payroll.

| Rule | Check in this build | Source |
|---|---|---|
| NZ-IPP1 | Flag stakeholder records without a purpose or source. | [NZ Privacy Commissioner, principle 1](https://www.privacy.org.nz/privacy-principles/1/) |
| NZ-IPP8 | Flag roles never verified or last verified more than 90 days ago. | [NZ Privacy Commissioner, principle 8](https://www.privacy.org.nz/privacy-principles/8/) |
| NZ-IPP9 | Flag missing or overdue retention review dates. | [NZ Privacy Commissioner, principle 9](https://www.privacy.org.nz/privacy-principles/9/) |
| LOCAL-DEPARTED | Flag departed contacts for a review of retained personal information and history. | Local business policy, supporting purpose and retention review. |

Principle 1 concerns necessary collection for a lawful business purpose. Principle 8 concerns reasonable accuracy checks before personal information is used or disclosed. Principle 9 concerns keeping information only as long as needed for its lawful purpose. The 90-day verification window and chosen retention review dates are local workflow policies, not statutory deadlines. No law requires a contact every thirty days; that is the relationship-review policy. The 90-day coverage refresh is also a planning rule.

review-stakeholder records purpose, source, verified date and the operator's chosen next review. It does not infer consent, authority or lawful use. Imported contacts begin without verification or a recorded purpose. The compliance command reads all stakeholders, including departed ones, and never silently deletes or clears findings.

History and raw imports can also contain personal information. An approved retention correction must cover current records, raw imports, snapshots, drafts and backups; marking a contact departed does not erase them. The tool has no automatic erasure or access-request workflow. A database owner can bypass append-only rules, so this is operational history, not tamper-proof evidence.

For Australian deployment, review applicable Australian privacy obligations with the operator before use. This base does not claim an Australian compliance assessment. No sensitive personal profiling belongs in buying-role notes. Record factual professional roles and the source of the assessment.
