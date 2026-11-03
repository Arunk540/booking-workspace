---
category: runtime
title: billing and invoice runtime
summary: Billing-related workflow signals drive AP queueing, billing status projection, job closure milestones, invoice dispatch email, and booking feedback emission.
primary_for: [activity-plan-billing-runtime]
mentions: [activity-plan-booking-integration, activity-plan-retries]
scenarios:
  - activity plan billing signal
  - billing activity feedback
  - activity plan invoice dispatch
  - activity plan job closure
  - billing revenue update
  - qa test user billing intake
  - ata service date events
capabilities: [billing-feedback, invoice-dispatch, job-closure, revenue-update]
domains: [billing, activity-plan, invoicing]
entities: [ActivityPlanWorkflow, ActivityPlanWorkflowImplV2, BillingFeedbackActivityForV2Impl, JobClosureActivityImpl]
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BillingFeedbackActivityForV2Impl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/JobClosureActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PopulateBillingDataActivityImpl.java
  - booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/BillingServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PrepareBillingActivityImpl.java
  - common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/entity/Invoice.java
verified_against: 55f73f4df1c31b8892489af194e7b453774dd7e3
last_updated: "2026-11-03"
related:
  - integrations/billing.md
  - integrations/booking-service.md
  - integrations/decision-hub.md
---

# Billing and invoice runtime

| path | behavior | evidence |
|---|---|---|
| billing signal ingress | Workflow interface names billing signals `signalToActivityPlanFromBilling`, `invoiceDispatchSignalFromBilling`, `invoiceSentFeedbackFromBillingToActivityPlan`, and `signalFromBillingCostWorkflowToActivityPlan`. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java:31) |
| standard billing feedback | `signalFromBilling` maps billing event names to AP task names such as `billingResponseActivity` or `jobClosure` and pushes them into the AP queue. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:174) |
| invoice dispatch | Dispatched invoice signals enqueue `invoiceDispatched`, which maps billing data to `ActivityPlanInvoice`, sends email, and records invoice email feedback. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:299) |
| billingResponseActivity | V2 billing feedback closes or creates AP billing milestones and forwards feedback to booking; invoice data flips the outbound signal type to SCM invoice feedback. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BillingFeedbackActivityForV2Impl.java:45) |
| job closure | `JobClosureActivityImpl` writes `Job Soft Closed` or `Job Reopened` AP milestones and sends booking feedback for closed jobs. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/JobClosureActivityImpl.java:31) |
| outbound billing start | `startOrSignalToBilling` uses workflow id `bookingId + "_BILLING"` on `billingSecondTaskQueue` and picks start vs update signals with `signalWithStart`. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:267) |
| invoice dispatch feedback | AP sends invoice dispatch feedback to billing on workflow id `bookingId + "_INVOICEDISPATCH"` via signal `invoiceFeedbackFromActivityPlanToBilling`. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:304) |
| revenue update | Cost workflow signals become task `updateRevenue`, which executes `sendRevenueLineToBooking` in the AP workflow. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:261) |
| SCM vs finance routing | `PopulateBillingDataActivityImpl.isScmBooking` inspects the service plan's booking references for an `IS_SCM_BOOKING` reference; when present the billing event is emitted as `SEND_TO_SCM` (ActivityName/ActivityId), otherwise `SEND_TO_FINANCE` — so SCM bookings no longer carry send-to-finance in validation-failure feedback. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PopulateBillingDataActivityImpl.java) |
| document pouch references | Billing payload is enriched with PO number + Customer Reference Number from the service plan `DocumentPouch`, and chassis equipment references are filtered off any job line whose charge type ≠ `chassisRentalChargeCode`. | (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/BillingServiceImpl.java) |
| billing intake (new, gated) | When `billingIntakeEnabled` is true, `ActivityPlanWorkflowImplV2` skips the legacy send-to-finance calls and instead runs `PrepareBillingActivityImpl.prepareBilling` (same cancellation-charge/prior-SEND_TO_TMS suppression rules), then signals `BILLING_INTAKE_TASK_QUEUE`. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:879) |
| intake gate is per-run, not per-call | `billingIntakeEnabled` is resolved once via `Workflow.getVersion("billingIntakeRouting", ...)` + `Workflow.sideEffect` at workflow start — in-flight workflow runs keep the legacy path forever regardless of a later env-var flip; only new executions can pick up `BILLING_INTAKE_ENABLED=true`. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:116) |
| invoice parties forwarded to booking | `sendBillingfeedBackforV2ToBooking` maps `billingResponse.invoiceData[0].party` into `common.dto.Party` via `ObjectMapper.convertValue` (unmapped/renamed billing-side fields silently drop, no error) and sets it on `Invoice.parties` before forwarding to booking-service. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:596; common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/entity/Invoice.java:34) |
| intake gate: QA test user | `shouldSendToIntake` adds a QA-only exception on top of the per-run `billingIntakeEnabled` gate: when `ENV_NAME=qa`, intake runs only for `userId == Constants.QA_TEST_USER`, even with the flag on; every other QA user always takes the legacy path. Non-QA envs are unaffected. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:902) |
| ATA/ATD now map a wider event set to ServiceDates | `BillingServiceImpl.addActualServiceDates` maps `ATA_SERVICE_DATE_EVENTS` (the 6 raw TMS execution reference types plus `ATA`/`ATD`) to `financialJobWorkflow.ServiceDates` — previously only `ATA`/`ATD` references were mapped; a consumer checking only those two now misses dates sourced from the raw execution events. | (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/BillingServiceImpl.java:121) |
