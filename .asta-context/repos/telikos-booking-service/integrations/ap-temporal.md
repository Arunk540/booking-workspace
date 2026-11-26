---
category: integrations
title: activity plan temporal dispatch
summary: "Outbound handoff from booking workflows into the activity-plan workflow service through the Temporal activity-plan task queue."
primary_for: [activity-plan-dispatch]
mentions: [activity-plan-retry-storage, activity-plan-metrics, service-plan-audit-payload]
scenarios: [activity plan dispatch, activity plan task queue, activity plan retry, service plan to ap, activity plan temporal]
capabilities: [peer-workflow-dispatch, audit-payload-mapping]
domains: [booking, activity-plan]
entities: [BookingActivityPlanDispatcher, ActivityPlan, SendToActivityPlanActivityImpl, RfpMandatoryFieldValidator]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingActivityPlanDispatcher.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/router/EventRouterService.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SendToActivityPlanActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/validation/RfpMandatoryFieldValidator.java
verified_against: 658219d7b0d44dcec2883faeecbe4409128c72d5
last_updated: "2026-11-26"
related:
  - runtime/event-activity-matrix.md
  - operations/retries.md
  - integrations/iom.md
peer_systems:
  - telikos-activityplanworkflow-service_02
direction: outbound
protocol: temporal-signal
topic_or_endpoint: "TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE"
---

# Activity plan temporal dispatch

- Booking workflows fan out to the activity-plan peer through `${TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE}` configured under `audit.temporal.taskQueue.activity-plan`. (source: service/src/main/resources/application.yml:249)
- `BookingActivityPlanDispatcher` maps a booking service-plan into an `ActivityPlan` payload carrying booking id, service-plan number (as `orderId`), event name, event type, user, status, and the serialized service-plan domain data. Its `publishActivityPlan` delegates to the shared audit client library. [gap] the library's transport is not in this repo; `EventRouterService` logs the failure path as "sending event to temporal". (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingActivityPlanDispatcher.java:31, :96)
- The dispatcher is reached through `sendServicePlanDetailsToAP`, which appears in 10 event definitions under `booking.events` (e.g. READY_FOR_PLANNING, BOOKING_CONFIRMED, EDIT_AMEND_READY_FOR_PLANNING, SEND_TO_TMS, BOOKING_CANCELLATION, SEND_DOCUMENTS). (source: service/src/main/resources/application.yml:340-430)
- `EventRouterService` stores a failed activity-plan dispatch in the retry collection when `audit.kafka.retry.enabled` (env `EVENT_ROUTER_RETRY_ENABLED`, default `true`) is on and the failure is a Temporal `StatusRuntimeException`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/router/EventRouterService.java:296; service/src/main/resources/application.yml:237)
- AP dispatch increments `METRICS_ACTIVITY_PLAN_STARTED`, so success can be observed through Micrometer rather than only logs. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/BookingMetricsRegistry.java:209)
- `resolveActivityPlanStatus` fails the AP milestone (`ActivityPlanStatusEnum.FAILED`) for **any** region's Ready-for-Planning notification that carries an outstanding `RfpMandatoryFieldValidator` business exception, not only NAM — this blocks the flow from advancing to SEND_TO_TMS/SEND_TO_EXECUTION until the equipment's mandatory RFP fields (e.g. commodity code) are fixed. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingActivityPlanDispatcher.java:78)
- `SendToActivityPlanActivityImpl.sendToAp` is the Temporal activity behind `sendServicePlanDetailsToAP`; it picks the update, SAP or default dispatcher by event. When the event name contains `SEND_TO_TMS` and the plan has `cancelledBookingEquipments`, it adds them to `bookingEquipments` before dispatch and removes them afterward, so AP sees the full pre-cancellation equipment set for that one call. `SEND_TO_EXECUTION` does not get this merge. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SendToActivityPlanActivityImpl.java:32-60; common/BookingConstants.java:243)
