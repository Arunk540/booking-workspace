---
category: contracts
title: Kafka events
summary: The service is wired for an inbound dedicated consumer topic pattern rooted at `${EMAIL_DEV_TOPIC}` and produces event-history records to `${EVENT_HISTORY_DEV_TOPIC}` using Avro-backed event-router dispatchers.
primary_for: [email-event-history-kafka]
mentions: [activity-plan-email-events, booking-email-dispatch, sendgrid-webhook-processing]
scenarios: [email kafka topics, email kafka failing, why email kafka failed, publish email history, consume email topic]
capabilities: [kafka-contracts]
domains: [email-notification, event-history]
entities: [ActivityPlanEvent, EventsHistoryProducer, KafkaConsumerConfig]
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/config/KafkaConsumerConfig.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/producer/EventsHistoryProducer.java, service/src/main/avro/activityPlanEvent.avsc]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [integrations/ap-temporal.md, runtime/booking-email-flow.md, runtime/sendgrid-webhook-flow.md]
---
# Kafka events

| Direction | Topic binding | Handler or producer | Payload contract |
|---|---|---|---|
| inbound config | `${EMAIL_DEV_TOPIC}` via regex `^.*${EMAIL_DEV_TOPIC}*` | `KafkaConsumerConfig.kafkaReceiverOptions()` | Avro `ActivityPlanEvent`; consumer properties install `KafkaAvroDeserializer`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/config/KafkaConsumerConfig.java:18) |
| outbound | `${EVENT_HISTORY_DEV_TOPIC}` | `EventsHistoryProducer.publishEventHistory(...)` and `publishEventHistoryForInvoice(...)` | Event-history mapper output driven from booking or invoice payloads. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/producer/EventsHistoryProducer.java:28) |
| shared schema | `ActivityPlanEvent` | AP/email/event-history boundary | Fields include order id, nullable booking id, event name, activity timestamp, status, and domain data. (source: service/src/main/avro/activityPlanEvent.avsc:1) |

- Kafka producer topic is externalized as `kafka.dedicated.producer.topic`, and consumer topic/group wiring is externalized under `kafka.dedicated.consumer.*`. (source: service/src/main/resources/application.yml:111)
- The repo contains Kafka wiring but no first-party controller-like consumer entry method in `service/src/main/java`; inbound activity/event consumption is mediated by router/library infrastructure plus Temporal workers. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/config/KafkaConsumerConfig.java:18)
