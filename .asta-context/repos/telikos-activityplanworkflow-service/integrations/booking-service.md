---
category: integrations
title: booking service integration
summary: Booking service is both the main source of AP workflow signals and the sink for milestone, invoice, and revenue feedback.
primary_for: [activity-plan-booking-integration]
mentions: [activity-plan-entry-points, activity-plan-billing-runtime]
scenarios:
  - booking activity plan signal
  - activity plan booking feedback
  - booking invoice feedback
  - revenue update booking
  - booking workflow id
capabilities: [booking-signal-ingress, booking-feedback-egress]
domains: [booking, activity-plan]
entities: [ActivityPlanWorkflow, EventProcessorServiceImpl, BookingWorker]
peer_systems: [telikos-booking-service-1]
direction: bidirectional
protocol: temporal-signal
topic_or_endpoint: BOOKING_WORKER_TASK_QUEUE
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BookingWorker.java
  - service/src/main/resources/application.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BookingFeedbackActivityImpl.java
verified_against: da1e3f3e49ee4b21e574d717c688c0f3a0e4198d
last_updated: "2026-09-29"
related:
  - runtime/cancellation-email-flow.md
  - runtime/billing-flow.md
---

# Booking service integration

- Booking enters AP through workflow signal `booking_signal`, exposed as `signalFromBooking(ActivityPlanEventModel)` on `ActivityPlanWorkflow`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java:28)
- `BookingWorker` opens the outbound Temporal queue defined by `activityplan.bookingWorkerTaskQueue`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BookingWorker.java:17)
- Billing-derived feedback is sent back to booking with signal `bookingSignal` and either `ACTIVITYPLAN_FEEDBACK` or SCM invoice feedback signal types. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:354)
- Revenue updates use the same booking workflow id suffix `_BOOKINGEVENTS`, but switch the signal type to `UPDATE_REVENUE`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:495)
- Queue wiring comes from `activityplan.bookingWorkerTaskQueue: ${BOOKING_WORKER_TASK_QUEUE}`. (source: service/src/main/resources/application.yml:171)
- `BookingFeedbackActivityImpl` now always stamps `workProcessEndDateTime` with `Instant.now()` on FAILED-status feedback (previously two failure branches — TMS-cancelled-event failure and the generic catch-all — sent `null`); booking-service can now rely on every FAILED milestone feedback carrying an end time. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/BookingFeedbackActivityImpl.java:166)
- Outbound `Invoice` objects on `BookingActivity.invoices` (via `bookingSignal`) now also carry a `parties` list sourced from the billing response — see `runtime/billing-flow.md` for how it's mapped. (source: common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/entity/Invoice.java:34)
