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
  - common/src/main/resources/avro/TransportOrder.v10.avsc
  - common/src/main/resources/avro/EventHistoryInternal.v2.avsc
  - common/src/main/resources/avro/CustomServiceOrderEvent.v1.avsc
verified_against: 55f73f4df1c31b8892489af194e7b453774dd7e3
last_updated: "2026-09-29"
related:
  - integrations/tms.md
  - integrations/customs.md
---

# Kafka contracts

| topic property | payload | producer behavior | evidence |
|---|---|---|---|
| `spring.kafka.producer.topics.tms-topic` / `${TMS_TOPIC}` | `com.maersk.TransportOrder` from `TransportOrder.v10.avsc` (this table was already 1 version stale at v8 before this update — actual tip is v10, see `integrations/tms.md` for the v9→v10 rename and what changed) | Dedicated producer sends synchronously with `.get()` and emits `activityplan.tms.event.sent` metrics. Note: the topic name's trailing `vN` in helm values is an independent env counter, not the schema version. | (source: service/src/main/resources/application.yml:73; common/src/main/resources/avro/TransportOrder.v10.avsc) |
| `spring.kafka.producer.topics.event-history-topic` / `${EVENT_HISTORY_TOPIC}` | `EventHistory` from `EventHistoryInternal.v2.avsc` | Dedicated producer uses async callback success/failure metrics for event history. | (source: service/src/main/resources/application.yml:73) |
| `spring.kafka.shared.producers.customs.topic` / `${KAFKA_CUSTOMS_REQUEST_TOPIC}` | `CustomsServiceOrderEvent` from `CustomServiceOrderEvent.v1.avsc` | Shared customs producer sends synchronously with `.get()` against the shared bootstrap. | (source: service/src/main/resources/application.yml:88) |
| keying | TMS uses transport order number, event history uses booking number, customs uses header correlation id. | Producer records set keys per downstream integration contract. | (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:185) |
| local defaults | Local config binds TMS, event history, and customs topics to dev/internal names for local or test runs. | These defaults are declared in `application-local.yml`. | (source: service/src/main/resources/application-local.yml:90) |
