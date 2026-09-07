---
category: operations
title: retry controls
summary: "Exact retry behaviors for Kafka processing, Kafka connectivity, Temporal activities, and persisted event-router recovery."
primary_for: [booking-retry-controls]
mentions: [event-router-persistence, temporal-default-retries, kafka-business-retry]
scenarios: [booking retry policy, booking retry delays, kafka retry model, temporal retry model, retry collection behavior]
capabilities: [failure-recovery, retry-triage]
domains: [booking, operations]
entities: [KafkaConsumerService, SapFeedbackConsumerService, EventRouterService, RetryEntity]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/router/EventRouterService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
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
