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
capabilities: [billing-feedback, invoice-dispatch, job-closure, revenue-update]
domains: [billing, activity-plan, invoicing]
entities: [ActivityPlanWorkflow, ActivityPlanWorkflowImplV2, BillingFeedbackActivityForV2Impl, JobClosureActivityImpl]
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BillingFeedbackActivityForV2Impl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/JobClosureActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - integrations/billing.md
  - integrations/booking-service.md
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
