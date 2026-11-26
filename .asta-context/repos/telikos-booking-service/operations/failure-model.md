---
category: operations
title: failure model
summary: "Practical failure surfaces and their observable outcomes across API validation, workflow orchestration, Kafka ingress, and external peer integration."
primary_for: [booking-failure-surfaces]
mentions: [poison-message-ack, vts-hold-timeout, duplicate-booking-insert]
scenarios: [booking failure modes, booking poison messages, workflow timeout behavior, integration failure surfaces, duplicate insert recovery]
capabilities: [incident-triage, blast-radius-estimation]
domains: [booking, operations]
entities: [BookingController, KafkaConsumerService, SaveToDatabaseActivityImpl, VesselTrackingRegistrationActivityImpl]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java
verified_against: 658219d7b0d44dcec2883faeecbe4409128c72d5
last_updated: "2026-11-27"
related:
  - operations/retries.md
  - operations/monitoring.md
  - runtime/customs-vessel-flow.md
---

# Failure model

- API failures are mostly synchronous validation failures: malformed booking ids, missing party emails, missing transport plans, missing document numbers, and invalid customs payloads fail before workflow initiation. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:110)
- On SIGTERM each Kafka consumer (`KafkaConsumerService`, `SapFeedbackConsumerService`, `SapTmsExecutionStatusConsumerService`, `CustomsServiceOrderConsumer`, `ContainerAvailabilityFeedbackConsumer`) disposes its subscription on `ContextClosedEvent`, before the Temporal worker drains (`${TEMPORAL_WORKER_SHUTDOWN_TIMEOUT:PT25S}`), so acknowledged offsets commit and partitions move at once. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:97; service/src/main/resources/application.yml:97)
- Outbound HTTP and Mongo calls have timeouts: `MONGO_SOCKET_TIMEOUT_MS` / `MONGO_SERVER_SELECTION_TIMEOUT_MS` 15 s, `AUTHORIZATION_TIMEOUT` PT10S, `DEADLINE_RULES_TIMEOUT` PT30S, `CAMS_API_TIMEOUT` PT60S, `VESSEL_TRACKING_API_TIMEOUT` PT30S. [gap] which other WebClient calls remain unbounded. (source: service/src/main/resources/application.yml:55, :69, :75, :86, :91)
- Poisoned dedicated Kafka records are retried three times and then acknowledged, so downstream loss is possible unless logs and metrics catch the skip quickly. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:66)
- Duplicate booking inserts during READY_FOR_PLANNING or DRAFT_CANCELLATION regenerate booking ids and close the current workflow, which can create extra workflow noise but avoids total event loss. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java:44)
- SEND_TO_TMS idempotency can close the workflow early when that work process is already STARTED, so repeated API calls may look like no-ops by design. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java:54)
- VTS 4xx responses are permanent: the activity logs and returns without a wait child. A 5xx, timeout or connection error is transient: it arms the wait child, whose `attemptVtsRegistration` retries (4xx → non-retryable, 5xx → retryable; 30 s initial, 10 min max interval) until the deadline, then fans back the timeout. A successful-but-pending response also arms the hold. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java:109, :126, :153)
- If the VTS hold is armed and no feedback arrives before deadline, the child workflow emits a timeout fan-back event; feedback after that point is already late. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java:72)
