---
category: runtime
title: domain rules event matrix
summary: Domain rules turn booking event names into task lists, and the V2 workflow binds those task names to concrete activity implementations and downstream side effects.
primary_for: [activity-plan-event-rules]
mentions: [activity-plan-rfp-tms-runtime, activity-plan-billing-runtime, activity-plan-customs-sde-runtime]
scenarios:
  - activity plan event rules
  - task to activity map
  - activity plan task matrix
  - booking event task list
  - runtime task handlers
capabilities: [event-rule-routing]
domains: [activity-plan, workflow-orchestration]
entities: [DomainRules, EventRules, ActivityPlanWorkflowImplV2]
sources:
  - workflow/src/main/resources/domain-rules.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/ReadyForPlanningActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendToTmsActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendToCustomsActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BillingFeedbackActivityForV2Impl.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - runtime/rfp-tms-flow.md
  - navigation/scenarios.md
---

# Domain rules event matrix

| task | source event examples | primary activity path | evidence |
|---|---|---|---|
| `readyForPlanning` | `Ready For Planning` | writes AP milestone `1001` through `ReadyForPlanningActivityImpl`. | (source: workflow/src/main/resources/domain-rules.yml:5) |
| `amendmentReadyForPlanning` | `Amendment Ready For Planning` | amendment-specific ready-for-planning persistence path. | (source: workflow/src/main/resources/domain-rules.yml:53) |
| `sendToTms` / `amendmentSendToTms` | `Send to TMS`, `Amendment Send to TMS` | persists AP rows, publishes TMS on fresh events, may call billing. | (source: workflow/src/main/resources/domain-rules.yml:11) |
| `bookingConfirmed` / `sendToExecution` | `Booking Confirmed`, `Send To Execution` | creates execution milestones, then email and optional non-SAP billing route. | (source: workflow/src/main/resources/domain-rules.yml:21) |
| `sendEmail` | cancellation, confirmation, send documents | uses queue-specific email dispatch and `receiveEmail` ack handling. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:1052) |
| `saveApCustomsEventInDB` | customs send and customs ack paths | persists and updates customs milestones, including execution status rows. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendToCustomsActivityImpl.java:33) |
| `serviceDeliveryExecution` | `Service Delivery Execution` | toggles `1017` between `PENDING`, `IN_PROGRESS`, and `CLOSED`. | (source: workflow/src/main/resources/domain-rules.yml:83) |
| `fsdCompletion` | `FSD Completion` | sends mapped cost payload to billing cost workflow. | (source: workflow/src/main/resources/domain-rules.yml:88) |
| `billingResponseActivity` | billing `Send To Finance`, `Invoice Triggered`, `Ready For Invoicing` | updates AP billing milestones and signals booking feedback. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BillingFeedbackActivityForV2Impl.java:45) |
| `jobClosure` / `invoiceDispatched` / `updateRevenue` | billing `job_closure`, invoice dispatch, cost updates | writes closure rows, sends invoice email feedback, or signals revenue line items to booking. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:214) |
