---
category: contracts
title: kafka contracts
summary: The repo produces Avro payloads to TMS, event history, and customs topics, with a dedicated producer for TMS and event history plus a shared producer for customs.
primary_for: [activity-plan-kafka-contracts]
mentions: [activity-plan-tms-integration, activity-plan-customs-integration, activity-plan-monitoring]
scenarios:
  - activity plan kafka topics
  - tms kafka schema
  - customs kafka schema
  - event history topic
  - activity plan avro payloads
capabilities: [kafka-producer-contracts]
domains: [kafka, tms-dispatch, customs, event-history]
entities: [TransportOrder, EventHistory, CustomsServiceOrderEvent]
sources:
  - service/src/main/resources/application.yml
  - service/src/main/resources/application-local.yml
  - event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java
  - common/src/main/resources/avro/TransportOrder.v8.avsc
  - common/src/main/resources/avro/EventHistoryInternal.v2.avsc
  - common/src/main/resources/avro/CustomServiceOrderEvent.v1.avsc
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - integrations/tms.md
  - integrations/customs.md
---

# Kafka contracts

| topic property | payload | producer behavior | evidence |
|---|---|---|---|
| `spring.kafka.producer.topics.tms-topic` / `${TMS_TOPIC}` | `com.maersk.TransportOrder` from `TransportOrder.v8.avsc` | Dedicated producer sends synchronously with `.get()` and emits `activityplan.tms.event.sent` metrics. | (source: service/src/main/resources/application.yml:73) |
| `spring.kafka.producer.topics.event-history-topic` / `${EVENT_HISTORY_TOPIC}` | `EventHistory` from `EventHistoryInternal.v2.avsc` | Dedicated producer uses async callback success/failure metrics for event history. | (source: service/src/main/resources/application.yml:73) |
| `spring.kafka.shared.producers.customs.topic` / `${KAFKA_CUSTOMS_REQUEST_TOPIC}` | `CustomsServiceOrderEvent` from `CustomServiceOrderEvent.v1.avsc` | Shared customs producer sends synchronously with `.get()` against the shared bootstrap. | (source: service/src/main/resources/application.yml:88) |
| keying | TMS uses transport order number, event history uses booking number, customs uses header correlation id. | Producer records set keys per downstream integration contract. | (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:185) |
| local defaults | Local config binds TMS, event history, and customs topics to dev/internal names for local or test runs. | These defaults are declared in `application-local.yml`. | (source: service/src/main/resources/application-local.yml:90) |
