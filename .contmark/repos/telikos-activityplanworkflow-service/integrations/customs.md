---
category: integrations
title: customs integration
summary: AP builds shared-bootstrap customs Avro envelopes from service-plan customs orders, publishes them synchronously, and keeps customs/AP state aligned through AP milestones.
primary_for: [activity-plan-customs-integration]
mentions: [activity-plan-customs-sde-runtime, activity-plan-kafka-contracts]
scenarios:
  - activity plan customs topic
  - customs service order
  - activity plan customs publish
  - customs sync producer
  - customs status mapping
capabilities: [customs-dispatch]
domains: [customs, kafka, activity-plan]
entities: [CustomsServiceImpl, PublishMsgToCustomsActivityImpl, KafkaProducerServiceImpl, CustomsServiceOrderEvent]
peer_systems: [cip-customs]
direction: outbound
protocol: kafka
topic_or_endpoint: KAFKA_CUSTOMS_REQUEST_TOPIC
sources:
  - booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/CustomsServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishMsgToCustomsActivityImpl.java
  - event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java
  - service/src/main/resources/application.yml
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - runtime/customs-sde-flow.md
  - contracts/kafka-events.md
---

# Customs integration

- `CustomsServiceImpl` iterates `customsServiceOrders` from the service plan and wraps each one in `CustomsServiceOrderEvent` with header and message sections. (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/CustomsServiceImpl.java:92)
- Topic binding comes from `spring.kafka.shared.producers.customs.topic: ${KAFKA_CUSTOMS_REQUEST_TOPIC}`. (source: service/src/main/resources/application.yml:88)
- `PublishMsgToCustomsActivityImpl` updates AP state to `PENDING` before the shared customs Kafka producer sends the Avro payload. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishMsgToCustomsActivityImpl.java:20)
- Delivery is synchronous because the shared producer blocks on `customsKafkaProducer.send(...).get()`. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:255)
- Shared producer connectivity, schema registry, and SASL settings are isolated in `SharedKafkaConfiguration`. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/SharedKafkaConfiguration.java:38)
