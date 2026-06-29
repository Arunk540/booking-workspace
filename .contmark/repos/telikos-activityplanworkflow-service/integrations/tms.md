---
category: integrations
title: sap tms integration
summary: AP builds Avro TransportOrder payloads from booking service-plan data, publishes them synchronously to the configured TMS topic, and updates AP status around the publish.
primary_for: [activity-plan-tms-integration]
mentions: [activity-plan-rfp-tms-runtime, activity-plan-kafka-contracts]
scenarios:
  - activity plan tms topic
  - tms transport order
  - activity plan tms publish
  - send tms sync
  - tms activity status
capabilities: [tms-dispatch]
domains: [tms-dispatch, kafka, activity-plan]
entities: [TmsServiceImpl, PublishTmsActivityImpl, KafkaProducerServiceImpl, TransportOrder]
peer_systems: [sap-tms]
direction: outbound
protocol: kafka
topic_or_endpoint: TMS_TOPIC
sources:
  - booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/TmsServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishTmsActivityImpl.java
  - event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java
  - service/src/main/resources/application.yml
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - runtime/rfp-tms-flow.md
  - contracts/kafka-events.md
---

# SAP TMS integration

- `TmsServiceImpl` maps booking-derived transport orders and only publishes payloads that still contain `servicePlanLegs`. (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/TmsServiceImpl.java:139)
- Topic binding comes from `spring.kafka.producer.topics.tms-topic: ${TMS_TOPIC}`. (source: service/src/main/resources/application.yml:73)
- `PublishTmsActivityImpl` updates AP state around TMS dispatch using activity name and id resolved from workflow utilities. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishTmsActivityImpl.java:31)
- Kafka delivery is synchronous because `KafkaProducerServiceImpl.sendMessageToTms` blocks on `kafkaProducer.send(...).get()`. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:177)
- Success and failure both feed the `activityplan.tms.event.sent` metric with status tags. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:193)
