---
category: runtime
title: cancellation email flow
summary: Cancellation events branch through pre-validation, TMS or order-cancel paths, email dispatch, email acknowledgement, and finally booking feedback.
primary_for: [activity-plan-cancellation-email-runtime]
mentions: [activity-plan-rfp-tms-runtime, activity-plan-booking-integration]
scenarios:
  - activity plan cancellation email
  - cancellation email ack
  - activity plan cancel validation
  - tms cancellation email
  - booking cancellation feedback
capabilities: [cancellation-validation, email-dispatch, booking-feedback]
domains: [activity-plan, email-notification, booking-feedback]
entities: [ActivityPlanWorkflowImplV2, CancellationValidationActivityImpl]
sources:
  - workflow/src/main/resources/domain-rules.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/CancellationValidationActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - integrations/email-service.md
  - integrations/booking-service.md
---

# Cancellation email flow

- `Booking Cancelled` is configured with `bookingCreated`, `bookingCancelled`, `sendEmail`, and `sendBilling`, plus vendor and customer email waits in `domain-rules.yml`. (source: workflow/src/main/resources/domain-rules.yml:41)
- `processCancellation` first runs the validation activity and branches to order-cancel, TMS-cancel, or normal email dispatch depending on the returned flags. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:437)
- `CancellationValidationActivityImpl` marks `isSendOrderCancelled` when booking cancel follows a closed execution task, and marks `isSendTmsCancelled` when a send-to-tms activity already exists. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/CancellationValidationActivityImpl.java:33)
- For TMS-cancel cases, the workflow republishes TMS unless the event type is `SAP_TMS_ACK` or `SAP_TMS_ACK_AUTO_CORRECTION`, then invokes the TMS-specific email path. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:462)
- Standard email dispatch uses `sendEventForEmail`, `RECEIVE_EMAIL_ACTIVITY`, and the `receiveEmail` workflow signal/query pair before calling `sendBookingFeedback`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:935)
- Email acks arrive through workflow signal `receiveEmail(ActivityPlanEventModel, traceId, activityPlanFromQuery)` on the workflow interface. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java:19)
- NAM countries skip outbound email entirely; the workflow sets email status to `SUCCESS` and still executes feedback logic. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:941)
