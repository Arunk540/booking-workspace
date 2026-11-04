---
category: runtime
title: ready for planning and tms flow
summary: Booking signals load task lists from domain rules, then V2 routes ready-for-planning, send-to-tms, and confirmation/execution variants through AP persistence, TMS publish, and optional billing.
primary_for: [activity-plan-rfp-tms-runtime]
mentions: [activity-plan-billing-runtime, activity-plan-event-rules]
scenarios:
  - activity plan ready planning
  - activity plan send tms
  - tms booking confirmed
  - activity plan execution email
  - activity plan non sap billing
  - amendment ready for planning tms
  - amendment send to execution
capabilities: [ready-for-planning, tms-dispatch, booking-confirmation]
domains: [activity-plan, tms-dispatch, billing]
entities: [ActivityPlanWorkflowImplV2, EventRules, ReadyForPlanningActivityImpl, SendToTmsActivityImpl, BookingConfirmedActivityImpl, BookingCreatedActivityImpl, SendToExecutionActivityImpl, AmendmentReadyForPlanningActivityImpl, AmendmentSendToTmsImpl, AmendmentSendToExecutionImpl, AmendmentConfirmedActivityImpl, AmendmentReceivedActivityImpl]
sources:
  - workflow/src/main/resources/domain-rules.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/ReadyForPlanningActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendToTmsActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishTmsActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BookingConfirmedActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BookingCreatedActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendToExecutionActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/AmendmentReadyForPlanningActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/AmendmentSendToTmsImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/AmendmentSendToExecutionImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/AmendmentConfirmedActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/AmendmentReceivedActivityImpl.java
verified_against: d044d5272656542d0692b65413fa56497143a377
last_updated: 2026-11-04
related:
  - runtime/event-activity-matrix.md
  - integrations/tms.md
---

# Ready for planning and tms flow

| trigger | domain-rules tasks | runtime behavior | evidence |
|---|---|---|---|
| `Ready For Planning` | `bookingCreated`, `readyForPlanning` | Booking signal resolves tasks from `domain-rules.yml`, then `readyForPlanning` persists activity id `1001` as `Ready For Planning` with `CLOSED`. | (source: workflow/src/main/resources/domain-rules.yml:5) |
| `Amendment Ready For Planning` | `bookingAmendmentReceived`, `amendmentReadyForPlanning` | The same booking signal queue is used, but the amendment-specific task names are loaded from rules instead of the base RFP task. | (source: workflow/src/main/resources/domain-rules.yml:53) |
| `Send to TMS` | `sendToTms` | `processSendToTms` executes `SENDTOTMS`, publishes to TMS only when `eventType` is blank, and suppresses billing on ack flows. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:718) |
| `sendToTms` persistence | n/a | `SendToTmsActivityImpl` creates activity id `1013` using `HelperUtils.getStatus`, so a fresh outbound TMS call lands as `PENDING`. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendToTmsActivityImpl.java:52) |
| `sendToTms` publish | n/a | `PublishTmsActivityImpl` updates the TMS activity and the producer sends synchronously with `.get()` through `KafkaProducerServiceImpl`. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishTmsActivityImpl.java:41) |
| `Booking Confirmed` / `Send To Execution` | task plus `sendEmail` | `processEmailTasksInSignal` sends booking-confirmed and execution variants through email handling, then calls billing for configured non-SAP countries. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:522) |
| billing handoff | n/a | Billing is started with workflow id `bookingId + "_BILLING"` on `billingSecondTaskQueue` using `signalWithStart`. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:267) |
| `Booking Confirmed`/`Created`/`Send To Execution` persistence | n/a | `BookingConfirmedActivityImpl`/`BookingCreatedActivityImpl`/`SendToExecutionActivityImpl` write the matching AP milestone (`PENDING`, or `CLOSED` for booking-created once no entry exists yet). | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BookingConfirmedActivityImpl.java:37) |
| `Amendment Ready For Planning`/`Send to TMS`/`Send To Execution` | `bookingAmendmentReceived`, `amendmentReadyForPlanning`, `amendmentSendToTms`, `amendmentSendToExecution` | These are the amend-track mirrors of the base RFP/TMS/execution activities above — same create-or-reopen AP milestone pattern, keyed off `ActivityName.AMENDMENT_*`/`AMEND_*` instead of the base names. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/AmendmentSendToTmsImpl.java:36) |
| `Booking Amendment Confirmed`/received | n/a | `AmendmentConfirmedActivityImpl`/`AmendmentReceivedActivityImpl` reopen the existing AP entry (`updateEventHistoryForReopenedTasks`) if one already exists for the booking, else create a new one. | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/AmendmentConfirmedActivityImpl.java:36) |
