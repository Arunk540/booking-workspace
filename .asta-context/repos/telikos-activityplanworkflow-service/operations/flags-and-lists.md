---
category: operations
title: feature flags and country lists
summary: Country-driven routing and feature toggles decide email bypass, billing eligibility, customs billing paths, Temporal versioning, and revenue feedback behavior.
primary_for: [activity-plan-flags-lists]
mentions: [activity-plan-rfp-tms-runtime, activity-plan-customs-sde-runtime]
scenarios:
  - activity plan flags
  - nam country bypass
  - non sap billing list
  - activity plan country lists
  - revenue line flag
  - qa test user billing intake flag
  - non sap tms country fallback
capabilities: [flag-audit]
domains: [operations, configuration]
entities: [ActivityPlanWorkflowImplV2, TemporalWorker, SendRevenueLineItemToBookingActivityImpl, NonSapTmsCountryUtil]
sources:
  - service/src/main/resources/application.yml
  - service/src/main/resources/application-local.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendRevenueLineItemToBookingActivityImpl.java
  - common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/utility/NonSapTmsCountryUtil.java
verified_against: 55f73f4df1c31b8892489af194e7b453774dd7e3
last_updated: "2026-11-03"
related:
  - operations/monitoring.md
  - runtime/cancellation-email-flow.md
  - integrations/billing.md
  - integrations/decision-hub.md
---

# Feature flags and country lists

- `spring.application.non-sap-countries-to-billing`, `disable-countries-to-billing`, and `nam-countries` externalize the main country routing lists. (source: service/src/main/resources/application.yml:8)
- Local defaults show `LIST_OF_NAM_COUNTRIES`, `LIST_OF_S4_COUNTRIES_TO_BILLING`, and `REVENUE_LINE_ITEM_FLAG`, which are the easiest values to inspect during debugging. (source: service/src/main/resources/application-local.yml:61)
- NAM countries bypass outbound email in `sendAndReceiveEmailEvent`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:941)
- `TemporalWorker` reads `activityplan.versioning.enabled` and `activityplan.versioning.name` to decide whether to register a build-id versioned worker on the V2 queue. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java:62)
- Revenue line item feedback is gated by `activityplan.revenueLineItem.enabled`, and the activity no-ops unless it is `true`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendRevenueLineItemToBookingActivityImpl.java:50)
- `activityplan.billing.chassis-rental-charge-code` (env `CHASSIS_RENTAL_CHARGE_CODE`, default `100227`) identifies the chassis rental charge type; `BillingServiceImpl` keeps chassis equipment references only on job lines matching this code and filters them off all others. (source: service/src/main/resources/application.yml:13)
- `activityplan.billing.intakeEnabled` (env `BILLING_INTAKE_ENABLED`, default `false` in every env) routes billing forwarding through the new "billing intake" path (see `runtime/billing-flow.md`, `integrations/billing.md`) instead of the legacy send-to-finance signal. Like `activityplan.versioning.*`, it's paired with a `Workflow.getVersion("billingIntakeRouting", ...)` patch marker, so a workflow run already in flight never picks up a later flip of the env var. In `ENV_NAME=qa`, intake additionally requires `userId == Constants.QA_TEST_USER` (see `runtime/billing-flow.md`). (source: service/src/main/resources/application.yml:177)
- `activityplan.decision-hub.nam-billing-invoice-events.enabled` gates the Decision Hub NAM billing-events lookup; off (or a non-NAM booking) keeps the pre-existing behavior of sending every present TMS execution event. (source: service/src/main/resources/application.yml:199; see `integrations/decision-hub.md`)
- `NonSapTmsCountryUtil.fetchTmsCountryCode` now falls back to the booking's `BOOKING_COUNTRY` reference only when the port/terminal leg gives no country (e.g. a NAM one-way-empty leg starting at the empty pickup) — any booking whose leg does give a country is unaffected, matching booking-service's own SAP-TMS routing rule. (source: common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/utility/NonSapTmsCountryUtil.java:52)
