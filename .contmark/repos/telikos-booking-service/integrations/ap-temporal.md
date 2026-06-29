---
category: integrations
title: activity plan temporal dispatch
summary: "Outbound handoff from booking workflows into the activity-plan workflow service through the Temporal activity-plan task queue."
primary_for: [activity-plan-dispatch]
mentions: [activity-plan-retry-storage, activity-plan-metrics, service-plan-audit-payload]
scenarios: [activity plan dispatch, activity plan task queue, activity plan retry, service plan to ap, activity plan temporal]
capabilities: [peer-workflow-dispatch, audit-payload-mapping]
domains: [booking, activity-plan]
entities: [BookingActivityPlanDispatcher, ActivityPlan]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingActivityPlanDispatcher.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/router/EventRouterService.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
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

- Booking workflows fan out to the activity-plan peer through `${TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE}` configured under `audit.temporal.taskQueue.activity-plan`. (source: service/src/main/resources/application.yml:218)
- `BookingActivityPlanDispatcher` maps a booking service-plan into an `ActivityPlan` payload carrying booking id, service-plan number, event name, event type, user, and the serialized service-plan domain data. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingActivityPlanDispatcher.java:29)
- The dispatcher is used by workflow activity lists such as READY_FOR_PLANNING, BOOKING_CONFIRMED, SEND_TO_TMS, amendment, cancellation, and SEND_DOCUMENTS because each of those event definitions includes `sendServicePlanDetailsToAP`. (source: service/src/main/resources/application.yml:315)
- `EventRouterService` stores failed activity-plan dispatches into the retry collection when retry persistence is enabled and the failure is a Temporal `StatusRuntimeException`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/router/EventRouterService.java:286)
- AP dispatch increments `METRICS_ACTIVITY_PLAN_STARTED`, so success can be observed through Micrometer rather than only logs. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/BookingMetricsRegistry.java:205)
