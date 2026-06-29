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
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
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
