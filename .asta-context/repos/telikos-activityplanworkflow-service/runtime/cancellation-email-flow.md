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
  - amendment cancelled milestone
  - vendor cancellation email
  - email acknowledgement routing
capabilities: [cancellation-validation, email-dispatch, booking-feedback]
domains: [activity-plan, email-notification, booking-feedback]
entities: [ActivityPlanWorkflowImplV2, CancellationValidationActivityImpl, BookingCancelledActivityImpl, AmendmentCancelledActivityImpl, SendCancelToVendorActivityImpl, ReceiveEmailConfirmationActivityImpl]
sources:
  - workflow/src/main/resources/domain-rules.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/CancellationValidationActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BookingCancelledActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/AmendmentCancelledActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendCancelToVendorActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/ReceiveEmailConfirmationActivityImpl.java
verified_against: d044d5272656542d0692b65413fa56497143a377
last_updated: 2026-11-04
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
- `BookingCancelledActivityImpl`/`AmendmentCancelledActivityImpl` persist the `PENDING` cancellation milestone on non-ACK events, then flip it to `IN_PROGRESS`/final status on the matching `SAP_TMS_ACK*` event — the booking and amendment paths use the same ack-vs-non-ack branch. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BookingCancelledActivityImpl.java:49)
- `SendCancelToVendorActivityImpl.vendorEmail` creates a separate `BOOKING_CANCELLED_FOR_VENDOR` AP entry so vendor and customer cancellation emails are tracked as distinct milestones. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendCancelToVendorActivityImpl.java:20)
- `ReceiveEmailConfirmationActivityImpl.receiveEmail` is the activity behind the `receiveEmail` signal: it maps `EventName` to the target `ActivityName` and closes/reopens that AP entry on `SUCCESS`/`FAILED`, with a separate branch when the event is itself a vendor/customer cancellation-email ack. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/ReceiveEmailConfirmationActivityImpl.java:41)
