# Global Young Scholar - DPDP website and platform implementation checklist

**Prepared:** 29 July 2026  
**Scope:** India school-procured services  
**Target date:** Complete and test before 13 May 2027, when the principal DPDP operational provisions are scheduled to commence.

> This is an implementation checklist, not a legal certification. It assumes the participating school is the Data Fiduciary for school-selected student processing and Argus Futures, Inc. is its Data Processor. It does not cover direct student or family subscriptions, which require a separate notice, age gate, consent flow, and role analysis.

## Priority definitions

- **P0 - launch blocker:** Required before publishing the final notice or enabling the affected school workflow.
- **P1 - DPDP readiness:** Build, document, and test before the DPDP operational provisions commence.
- **Feature gate:** Do not enable the optional feature until every item in that section is complete.

## 1. Public privacy pages and contact information

- [ ] **P0:** Publish a permanent India school-services privacy-notice page, for example `/in/privacy/schools`.
  - Done when the final notice has an effective date, version number, and no `[TO COMPLETE]` text.
  - Done when the notice can be viewed without logging in.
- [ ] **P0:** Display the role-based contact prominently:
  - **GYS Privacy and Grievance Contact**
  - **globalyoungscholar@argus.ai**
  - Argus Futures, Inc., 2261 Market Street, Suite 4230, San Francisco, California 94114, USA.
- [ ] **P1:** Include `globalyoungscholar@argus.ai` in every response to a privacy-rights communication.
- [ ] **P0:** Publish a subprocessor page linked from the privacy notice.
  - Identify each provider, service, data categories, processing purpose, entity location, and processing countries.
- [ ] **P0:** Publish the actual countries and primary region in which student data is hosted, backed up, supported, or remotely accessed.
- [ ] **P0:** Publish the approved retention schedule for every data category.
- [ ] **P0:** Publish a cookie and similar-technology notice based on an actual technical scan.
- [ ] **P0:** Remove advertising pixels, cross-site trackers, and SDKs that are not necessary for the school service.
- [ ] **P1:** Create a language selector and translation architecture capable of presenting the notice and consent request in English and the applicable Eighth Schedule language option(s).
  - Legal/product must approve the languages offered for each school population.
  - The translated notice must have the same version number and substantive content as the English notice.
- [ ] **P1:** Make the privacy notice accessible on mobile, readable without horizontal scrolling, keyboard accessible, and compatible with screen readers.

## 2. School-specific notice configuration

- [ ] **P0:** Create a school privacy-settings record containing:
  - school legal name;
  - school privacy/grievance contact and contact method;
  - selected assessment modules;
  - selected optional features;
  - report recipients and access roles;
  - whether EducationWorld aggregate reporting is enabled;
  - whether Access USA scholarship matching is enabled;
  - approved retention periods; and
  - notice languages.
- [ ] **P0:** Generate a standalone school-specific student/parent notice from those settings.
  - Show only the data categories, modules, purposes, and recipients that actually apply.
  - Do not present every possible GYS feature as though it were active.
- [ ] **P0:** Include in each school-specific notice:
  - the school privacy/grievance contact;
  - the GYS processor contact;
  - the link or method for withdrawing consent;
  - the link or method for exercising privacy rights;
  - the school grievance route; and
  - the applicable route for a later complaint to the Data Protection Board of India.
- [ ] **P0:** Show or deliver that notice before the school uploads identifiable student data or asks for consent.
- [ ] **P0:** Require the school to attest that it delivered the displayed notice to the correct parent, guardian, or adult student.
- [ ] **P1:** Keep the public GYS privacy notice available as supplementary information, but do not use it as a substitute for the school-specific consent notice.
- [ ] **P1:** Store an immutable snapshot or hash of every notice version so the exact notice shown with a consent record can later be reproduced.
- [ ] **P1:** Notify the school before a material processing change takes effect.
  - Require a new notice and new consent before adding a purpose, data category, recipient, or optional module that is not covered by the existing consent.
- [ ] **P1:** Create a migration flow for consent obtained before the applicable DPDP provisions commence.
  - Deliver the required notice by email, in-app message, school channel, or another effective method.
  - Record when and how the updated notice was delivered.

## 3. Age status and student activation

- [ ] **P0:** Require one of these values for every student before roster processing or activation:
  - `UNDER_18`;
  - `AGE_18_OR_OVER`; or
  - `NOT_CONFIRMED`.
- [ ] **P0:** Treat `NOT_CONFIRMED` as `UNDER_18` for consent and feature-gating purposes.
- [ ] **P0:** Do not infer adulthood from grade level.
- [ ] **P0:** Do not collect a full date of birth, Aadhaar number, parent identity document, or government identifier in the standard school workflow.
- [ ] **P0:** Block processing or activation for a child or age-unconfirmed student until the school has recorded the required parental-consent evidence.
- [ ] **P0:** Block processing or activation for an adult student until the required adult-student consent is recorded.
- [ ] **P1:** Record the source of the age-status determination, such as a verified school record, without copying unnecessary identity data into GYS.
- [ ] **P1:** Prevent a school administrator from changing `UNDER_18` to `AGE_18_OR_OVER` without a reason, timestamp, and audit entry.
- [ ] **P0:** Keep any direct-to-family registration route disabled or clearly separated until its own DPDP flow is implemented.

## 4. Consent capture and evidence

- [ ] **P0:** Present consent in clear, plain language as a standalone affirmative action.
- [ ] **P0:** Display the applicable school privacy contact and the means for exercising rights on every consent request.
- [ ] **P0:** Do not use prechecked boxes, inactivity, continued browsing, or acceptance of general Terms as consent.
- [ ] **P0:** Do not make consent cover data that is unnecessary for the selected service.
- [ ] **P0:** Separate core-service consent from each optional feature that introduces additional data or processing, including:
  - AI proctoring using camera or microphone;
  - longitudinal profiles;
  - an identifiable leaderboard;
  - direct communications to a student or parent;
  - scholarship matching; and
  - another third-party opportunity.
- [ ] **P0:** Record sufficient evidence for every consent:
  - school and student identifier;
  - age status;
  - identity or authenticated account of the consenting person;
  - whether the person acted as adult student, parent, or lawful guardian;
  - school’s basis for confirming that the parent/guardian is an identifiable adult;
  - notice version and language;
  - selected purposes, modules, recipients, and data categories;
  - affirmative action used;
  - timestamp and source channel;
  - current status; and
  - withdrawal or replacement history.
- [ ] **P0:** If the school collects consent outside GYS, require a structured attestation with the same evidence fields and a school record reference.
- [ ] **P0:** Do not require the school to upload a parent’s identity document to prove its attestation.
- [ ] **P1:** Make consent records exportable for the relevant school and audit team.
- [ ] **P1:** Prevent edits to an existing consent record; store later changes as new events.

## 5. Consent withdrawal and purpose changes

- [ ] **P0:** Provide a withdrawal control that is as easy to access and use as the original consent control.
- [ ] **P0:** Provide both:
  - a school-admin withdrawal workflow; and
  - a parent/adult-student withdrawal route through the school-specific rights page.
- [ ] **P0:** On withdrawal:
  - stop future processing for the withdrawn purpose;
  - disable the affected optional feature;
  - revoke related access or sharing tokens;
  - notify the school;
  - send deletion or cessation instructions to relevant subprocessors;
  - queue deletion unless retention remains necessary for another active purpose or law; and
  - preserve an audit record of the withdrawal without continuing ordinary use of the withdrawn data.
- [ ] **P1:** Explain the direct service consequence before withdrawal, without discouraging or obstructing the user.
- [ ] **P1:** Require new consent before reactivating the withdrawn purpose.

## 6. Purpose limitation and data minimisation

- [ ] **P0:** Enforce the approved purpose limitation in application logic:
  - student personal data may be used only to provide, administer, secure, support, and report on the school-selected GYS services;
  - this includes individual, class, grade, cohort, and school analytics and reports;
  - the only current optional exception is the separately selected and consented Access USA scholarship flow; and
  - processing required by applicable law remains permitted.
- [ ] **P0:** Prevent identifiable student data from being used for:
  - targeted advertising;
  - unrelated marketing;
  - cross-site tracking;
  - data brokerage or sale;
  - a third-party opportunity without a specific opt-in; or
  - training a general-purpose AI model.
- [ ] **P0:** Make optional fields and collection endpoints unavailable when the corresponding module is disabled.
- [ ] **P0:** Avoid unrestricted free-text student fields where unnecessary.
- [ ] **P1:** Maintain a machine-readable mapping of each data field to:
  - purpose;
  - selected module;
  - authorised roles;
  - recipient;
  - retention rule; and
  - deletion trigger.
- [ ] **P1:** Reject or quarantine data fields that are not on the approved schema.
- [ ] **P1:** Use pseudonymous school-issued student or examination identifiers wherever a name is unnecessary.
- [ ] **P1:** Before personal data is used to make a decision affecting a student or disclosed to another Data Fiduciary:
  - validate required fields for completeness and consistency;
  - provide a correction route; and
  - propagate an accepted correction to affected reports and recipients where appropriate.

## 7. Child-safety feature gates

- [ ] **Feature gate:** Do not enable AI proctoring, longitudinal behavioural analysis, an identifiable leaderboard, or child scholarship profiling until Indian counsel confirms the precise activity is permitted.
- [ ] **Feature gate:** Document whether adaptive assessment events, progress monitoring, proctoring, or scholarship matching constitute tracking or behavioural monitoring of a child.
- [ ] **Feature gate:** Document whether the educational-institution exemption applies to the school-led activity and to Argus processing on the school’s behalf.
- [ ] **Feature gate:** Even if an exemption applies, test and document that the processing is not likely to cause a detrimental effect on a child’s well-being.
- [ ] **Feature gate:** For camera or microphone processing:
  - display a separate notice before device access;
  - request browser permission only when the proctored session begins;
  - show whether recording occurs;
  - identify who can review recordings or integrity flags;
  - publish a short retention period;
  - avoid biometric identification unless separately reviewed and approved; and
  - disclose whether a non-proctored alternative is available.

## 8. EducationWorld aggregate reporting

- [ ] **P0:** Do not create any EducationWorld user account or API permission that can access student-level data.
- [ ] **P0:** Export only aggregate school-wide participation and performance fields approved in the school agreement.
- [ ] **P0:** Exclude names, student identifiers, contact details, answers, individual scores, profiles, and individual reports.
- [ ] **P0:** Configure a legally approved minimum cohort size.
- [ ] **P0:** Suppress small cells, rare categories, and combinations that could reveal a student.
- [ ] **P0:** Apply rounding or banding where exact numbers could permit inference.
- [ ] **P1:** Run automated re-identification-risk tests before every export.
- [ ] **P1:** Log the school, aggregate fields, filters, recipient, legal instruction, timestamp, and export result.
- [ ] **P1:** Prevent EducationWorld or another recipient from drilling down from an aggregate to a student record.

## 9. Access USA scholarship workflow

- [ ] **Feature gate:** Keep all Access USA data access disabled by default.
- [ ] **Feature gate:** Store Access USA qualification criteria separately from student data and apply them inside GYS.
- [ ] **Feature gate:** Obtain the school/parent/adult-student consent required for internal scholarship matching before running it.
- [ ] **Feature gate:** Do not disclose that a student matched, or any student data, to Access USA during internal matching.
- [ ] **Feature gate:** Notify a potentially qualifying student or parent inside GYS without identifying the student to Access USA.
- [ ] **Feature gate:** After a potential match, present a second, separate, non-prechecked opt-in that:
  - identifies Access USA and its address;
  - identifies Access USA as a separate Data Fiduciary;
  - names the specific scholarship opportunity;
  - lists every exact field that will be disclosed;
  - explains why each field is needed;
  - links to Access USA’s privacy notice and privacy contact;
  - states Access USA’s applicable retention information; and
  - confirms that the student may decline without affecting the core GYS service.
- [ ] **Feature gate:** Require the parent/guardian to complete the second opt-in for a child unless counsel documents a lawful alternative.
- [ ] **Feature gate:** Technically permit transmission only when a valid second-step consent record exists.
- [ ] **Feature gate:** Transmit only the fields displayed in that consent screen.
- [ ] **Feature gate:** Log the consent version, fields, recipient, purpose, timestamp, transmission status, and withdrawal.
- [ ] **Feature gate:** Provide a withdrawal and rights route for data still controlled by GYS and direct the user to Access USA for data already received by Access USA.

## 10. Rights-request and grievance centre

- [ ] **P0:** Publish a prominent privacy-rights link on the website, platform, privacy notice, and school-specific notice.
- [ ] **P0:** Provide request types for:
  - access to a summary of personal data and processing activities;
  - identities of Data Fiduciaries and Data Processors with whom data was shared, together with a description of the shared data;
  - correction;
  - completion;
  - updating;
  - erasure;
  - withdrawal of consent;
  - grievance; and
  - nomination of another individual for death or incapacity.
- [ ] **P0:** Ask only for the identifier reasonably needed to authenticate the requester and locate the record.
- [ ] **P0:** Route school-controlled student requests to the correct school privacy contact while opening a linked GYS support ticket for processor assistance.
- [ ] **P0:** Route requests concerning Argus-controlled business-contact, support, security, or contract data to `globalyoungscholar@argus.ai`.
- [ ] **P0:** Publish the grievance-response period.
  - It must be reasonable and no longer than 90 days.
  - Recommended internal target: 30 days, subject to counsel and operational approval.
- [ ] **P1:** Add due dates, escalation rules, ownership, status tracking, and an immutable action log to each request.
- [ ] **P1:** Allow the requester to download or receive the final response through an authenticated or registered communication channel.
- [ ] **P1:** Include the GYS privacy contact in every rights response.
- [ ] **P1:** Explain that the applicable Data Fiduciary’s grievance process must be used before approaching the Data Protection Board of India.
- [ ] **P1:** Add the official Board complaint link when the Board’s public complaint facility is available for the applicable provisions.
- [ ] **P1:** Test that a school cannot view another school’s requests or student records.

## 11. Retention and deletion

- [x] **P0 design decision:** Record the following working maximum periods, subject to Indian counsel approval:
  - current roster details not needed for ongoing access or a selected longitudinal profile: academic-year end plus 90 days;
  - minimal identity mapping, scores, reports, and derived longitudinal profile where selected: 12 months after the school-recorded completion of Grade 12, normally capped at eight years after the first assessment, or up to nine years only if the school records a revised completion year;
  - raw answers and detailed assessment-event data: 24 months after result finalisation;
  - AI-proctoring recordings: 30 days after result finalisation or 30 days after an integrity review or appeal closes, with an absolute 180-day cap unless a legal hold applies;
  - proctoring flags and appeal records: rolling 12 months after resolution or appeal closure;
  - support communications: rolling 12 months after the support matter closes;
  - consent, notice-version, withdrawal, and deletion evidence: three years after the related profile is deleted, consent is withdrawn, or the school relationship ends;
  - security, access, and processing logs: rolling 12 months from the event, except for a documented incident, investigation, legal hold, or other legal requirement; and
  - backups: no more than 90 days after production deletion.
- [ ] **P0:** Obtain Indian counsel approval of the working retention schedule.
- [ ] **P0:** Implement a separate identity layer and longitudinal-record layer.
  - Use a randomly generated GYS longitudinal identifier.
  - Keep the identity-to-profile mapping separately protected.
  - Keep raw answers, detailed events, device data, and support records out of the long-term longitudinal profile.
- [ ] **P0:** If the school holds the identity crosswalk, provide a secure process for the school to associate a returning student with the existing GYS identifier without disclosing unnecessary identity data to GYS.
- [ ] **P0:** Do not promise access through Grade 12 unless the school maintains an active GYS agreement or documented longitudinal archive arrangement.
- [ ] **P0:** On termination of the entire school relationship, apply the DPA’s earlier export and deletion timetable even if a category’s ordinary maximum period has not expired.
- [ ] **P0:** Implement automated deletion jobs for active databases, search indexes, analytics stores, object storage, and caches.
- [ ] **P0:** Implement deletion propagation to subprocessors.
- [ ] **P0:** Enforce 90-day backup expiration after production deletion and prevent deleted data from returning to active use after a restore.
- [ ] **P0:** Implement school-contract termination workflows for export, return, and deletion.
- [ ] **P0:** Implement purpose-expiry and consent-withdrawal deletion triggers.
- [ ] **P0:** Build the anonymous analytics store separately from the pseudonymous longitudinal store.
  - Remove direct identifiers and student-level re-identification keys.
  - Apply minimum-cohort, rare-category, combination, rounding, and suppression controls.
  - Retain anonymous statistics without a fixed period only when no individual is reasonably identifiable.
  - Limit use to assessment validation, service benchmarking, security, improvement of GYS services, and analysis of longitudinal patterns and associations between educational programs and student outcomes.
- [ ] **P1:** Maintain a narrowly scoped legal-hold mechanism with reason, authority, owner, start date, and review date.
- [ ] **P1:** Segregate legally retained data from ordinary product use.
- [ ] **P1:** Implement a counsel-approved one-year retention class for security/processing logs and related data required by the DPDP Rules.
  - Do not automatically retain every student record for one year without mapping the precise rule and purpose.
- [ ] **P1:** Produce deletion reports showing record counts, systems, subprocessors, exceptions, and completion timestamps.

## 12. Security controls

- [ ] **P0:** Encrypt personal data in transit and at rest.
- [ ] **P0:** Apply role-based access and least privilege.
- [ ] **P0:** Require multi-factor authentication for school administrators, privileged staff, and support access.
- [ ] **P0:** Enforce tenant separation between schools.
- [ ] **P0:** Mask, obfuscate, pseudonymise, or tokenise student data where the full value is unnecessary.
- [ ] **P0:** Log access to student data, consent records, reports, exports, configuration changes, and administrative actions.
- [ ] **P0:** Monitor for unauthorised access and maintain an investigation trail.
- [ ] **P0:** Maintain tested backups, recovery procedures, and service-continuity controls.
- [ ] **P0:** Restrict production support access by approval, purpose, duration, and audit log.
- [ ] **P0:** Put contractual security and breach obligations in every subprocessor agreement.
- [ ] **P1:** Maintain vulnerability management, dependency patching, secure development review, secrets management, and incident-response testing.
- [ ] **P1:** Run periodic access reviews and promptly remove access no longer required.
- [ ] **P1:** Verify that every security statement in the published privacy notice is true in production.

## 13. Personal-data breach workflow

- [ ] **P0:** Provide a staffed channel for suspected privacy or security incidents at `globalyoungscholar@argus.ai`.
- [ ] **P0:** Create an incident record capable of capturing:
  - nature, extent, timing, and location of the breach;
  - affected schools and Data Principals;
  - affected data categories;
  - likely consequences;
  - mitigation completed and planned;
  - safety measures recommended to affected people;
  - root cause and responsible person, if known;
  - remediation to prevent recurrence; and
  - notifications and their timestamps.
- [ ] **P0:** For school-controlled data, notify the school without undue delay and provide the information needed for its statutory notices.
- [ ] **P1:** Support concise notice to every affected Data Principal without delay through the user account or a registered communication channel.
- [ ] **P1:** Support initial Board notification without delay.
- [ ] **P1:** Support the detailed Board report within 72 hours, unless the Board permits a longer period.
- [ ] **P1:** Include business contact information for privacy questions in each affected-person notice.
- [ ] **P1:** Keep evidence of notification content, recipients, delivery attempts, timestamps, and failures.
- [ ] **P1:** Test the workflow with the schools and subprocessors through a tabletop exercise.

## 14. International processing and subprocessor changes

- [ ] **P0:** Maintain a current data-flow inventory showing all hosting, backup, support, analytics, email, and remote-access countries.
- [ ] **P0:** Prevent a new subprocessor or processing country from being introduced without privacy/security review and contract approval.
- [ ] **P0:** Update the public subprocessor and location disclosures before or when required by the applicable school agreement.
- [ ] **P1:** Build configuration controls capable of enforcing a school-specific regional restriction.
- [ ] **P1:** Track and implement any Indian Government restriction on transfers or making data available to a foreign state or controlled entity.
- [ ] **P1:** Keep an audit trail of school notices, objections, approvals, and migration actions for subprocessor changes.

## 15. Analytics, AI, and de-identification

- [ ] **P0:** Inventory all analytics events and remove fields not needed to provide, secure, support, or report on the GYS service.
- [ ] **P0:** Do not send student names, answers, scores, profiles, or contact information to general website-analytics tools.
- [ ] **P0:** Do not use identifiable school-service student data to train a general-purpose AI model.
- [ ] **P0:** Do not use identifiable student data to validate or improve a GYS assessment or model. Use only effectively de-identified data under the approved de-identification standard.
- [ ] **P1:** Implement a de-identification standard that includes:
  - direct-identifier removal;
  - small-cell suppression;
  - rare-category treatment;
  - linkage and inference testing;
  - recipient re-identification prohibitions; and
  - periodic re-identification-risk review.
- [ ] **P1:** Keep effectively de-identified data separate from identifiable production data.
- [ ] **P1:** Prohibit attempts to re-identify de-identified data.

## 16. Required QA tests before release

- [ ] A student with `NOT_CONFIRMED` age status is treated as under 18.
- [ ] A child cannot be activated without the required consent evidence.
- [ ] No identifiable roster can be uploaded before the school notice/consent attestation.
- [ ] No optional module collects data until it is selected and consented.
- [ ] Consent boxes are empty by default and the consent version is recorded.
- [ ] Withdrawal disables the purpose and creates deletion/subprocessor tasks.
- [ ] A notice version shown at the time of consent can be reproduced exactly.
- [ ] The school-specific notice lists only enabled modules and actual recipients.
- [ ] A rights request reaches the correct school and cannot expose another school’s data.
- [ ] The access response includes processing information and applicable sharing recipients.
- [ ] EducationWorld receives no student-level field and cannot drill down.
- [ ] Access USA receives no student data during matching.
- [ ] Access USA receives only the exact fields listed after a valid second-step opt-in.
- [ ] Direct-to-family registration cannot bypass the separate age and consent flow.
- [ ] Retention jobs delete test records from every active data store and create verifiable reports.
- [ ] Backup restoration does not reactivate previously deleted data for ordinary use.
- [ ] Security logs capture privileged access, exports, consent changes, and deletion actions.
- [ ] Breach-notification templates can be populated with all fields required by the DPDP Rules.
- [ ] Privacy and consent pages work on mobile and with keyboard and screen-reader navigation.
- [ ] The selected translated notice matches the approved English notice version.

## 17. Decisions engineering needs from legal, privacy, and product

- [ ] Final school-specific data-field and purpose map.
- [ ] Indian counsel approval of the documented working retention schedule.
- [ ] Primary hosting region and every processing/access country.
- [ ] Complete subprocessor list and public URL.
- [ ] Grievance-response period.
- [ ] Languages required for each launch school.
- [ ] Minimum EducationWorld cohort size, rounding, and suppression rules.
- [ ] Exact Access USA fields, privacy-notice link, privacy contact, and retention information.
- [ ] Legal conclusion and permitted configuration for child proctoring, behavioural monitoring, adaptive analytics, and scholarship matching.
- [ ] Parent-verification and school-attestation standard.
- [ ] Whether a non-proctored assessment alternative will be offered.
- [ ] Direct-to-family launch decision and separate implementation scope.
- [ ] Final link to the Data Protection Board complaint facility when applicable.
- [ ] Security-control verification, incident owners, and school notification SLA.

## Official legal references

- [Digital Personal Data Protection Act, 2023 - India Code](https://www.indiacode.nic.in/handle/123456789/22037)
- [Digital Personal Data Protection Rules, 2025 - MeitY](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)
- [DPDP Act commencement timeline - India Code](https://www.indiacode.nic.in/show-data?abv=CEN&actid=AC_CEN_45_0_00003_2023-22_1763464807080&orderno=1&orgactid=AC_CEN_45_0_00003_2023-22_1763464807080&statehandle=123456789%2F1362)
