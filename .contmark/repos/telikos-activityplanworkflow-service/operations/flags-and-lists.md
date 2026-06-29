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
capabilities: [flag-audit]
domains: [operations, configuration]
entities: [ActivityPlanWorkflowImplV2, TemporalWorker, SendRevenueLineItemToBookingActivityImpl]
sources:
  - service/src/main/resources/application.yml
  - service/src/main/resources/application-local.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendRevenueLineItemToBookingActivityImpl.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - operations/monitoring.md
  - runtime/cancellation-email-flow.md
---

# Feature flags and country lists

- `spring.application.non-sap-countries-to-billing`, `disable-countries-to-billing`, and `nam-countries` externalize the main country routing lists. (source: service/src/main/resources/application.yml:8)
- Local defaults show `LIST_OF_NAM_COUNTRIES`, `LIST_OF_S4_COUNTRIES_TO_BILLING`, and `REVENUE_LINE_ITEM_FLAG`, which are the easiest values to inspect during debugging. (source: service/src/main/resources/application-local.yml:61)
- NAM countries bypass outbound email in `sendAndReceiveEmailEvent`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:941)
- `TemporalWorker` reads `activityplan.versioning.enabled` and `activityplan.versioning.name` to decide whether to register a build-id versioned worker on the V2 queue. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java:62)
- Revenue line item feedback is gated by `activityplan.revenueLineItem.enabled`, and the activity no-ops unless it is `true`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendRevenueLineItemToBookingActivityImpl.java:50)
