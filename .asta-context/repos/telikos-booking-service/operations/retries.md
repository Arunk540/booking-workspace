---
category: operations
title: retry controls
summary: "Exact retry behaviors for Kafka processing, Kafka connectivity, Temporal activities, and persisted event-router recovery."
primary_for: [booking-retry-controls]
mentions: [event-router-persistence, temporal-default-retries, kafka-business-retry]
scenarios: [booking retry policy, booking retry delays, kafka retry model, temporal retry model, retry collection behavior, temporal retry drops data bug, idempotent insert on retry]
capabilities: [failure-recovery, retry-triage]
domains: [booking, operations]
entities: [KafkaConsumerService, SapFeedbackConsumerService, EventRouterService, RetryEntity, SaveTransportOrderActivityImpl, SaveCustomsOrderActivityImpl, TransportOrderInfraService, CustomsServiceOrderInfraService]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/router/EventRouterService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveTransportOrderActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveCustomsOrderActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/service/TransportOrderInfraService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/service/CustomsServiceOrderInfraService.java
verified_against: 4850c3efe7babc8364a044fed070268d6945002f
last_updated: "2026-09-07"
related:
  - operations/failure-model.md
  - contracts/db-schemas.md
  - runtime/rfp-flow.md
---

# Retry controls

- Dedicated service-plan ingress retries business processing three times with one-second delay before acknowledging and skipping the poisoned record. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:47)
- Dedicated service-plan ingress separately retries Kafka connection failures forever with ten-second delay, so transport failures and business failures have different recovery policies. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:72)
- Shared SAP, customs, and container-availability consumers use the same infinite connection-retry pattern with fixed ten-second delay. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:53)
- Temporal workflow activities are executed with a sixty-minute `StartToCloseTimeout` and default `RetryOptions`, which the trace interprets as unlimited retries with backoff unless an activity overrides them. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:78)
- The VTS wait child is the notable exception: its fan-back activity is capped at three attempts with five-minute timeout. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java:27)
- Event-router persistence is guarded by `${EVENT_ROUTER_RETRY_ENABLED}`; when enabled, retryable AP/Kafka publish failures are stored in the `retries` collection for later replay. (source: service/src/main/resources/application.yml:210)
- Event-router retry persistence only stores Kafka failures when the exception is `EventRouterRetryableException`, and AP failures when the exception is a Temporal `StatusRuntimeException`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/router/EventRouterService.java:268)
- `SaveTransportOrderActivityImpl`/`SaveCustomsOrderActivityImpl` no longer cache the pending list in an instance field guarded by `attempt == 1` (that pattern silently dropped data whenever a Temporal retry landed on a different worker pod, or the first attempt failed before the body ran — an empty instance list + `attempt != 1` meant nothing was ever saved). Each attempt now re-derives the work set from the activity input and persists via `insertTransportOrderIfAbsent`/`insertCustomsServiceOrderIfAbsent`, which insert-or-skip on a stable business key — safe to run every retry. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveTransportOrderActivityImpl.java:25; temporal/activity/SaveCustomsOrderActivityImpl.java:21)
