---
category: integrations
title: customs feedback exchange
summary: "Inbound customs-response processing and the notification side effect that follows successful customs feedback handling."
primary_for: [customs-feedback-exchange]
mentions: [customs-notification-topic, receiver-guard, customs-order-state]
scenarios: [customs feedback flow, customs receiver guard, customs notification path, customs response topic, customs order updates]
capabilities: [customs-response-handling, notification-triggering]
domains: [booking, customs]
entities: [CustomsServiceOrderConsumer, CustomsServiceOrderResponseEvent]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - runtime/customs-vessel-flow.md
  - contracts/kafka-events.md
  - operations/monitoring.md
peer_systems:
  - customs
direction: inbound
protocol: kafka
topic_or_endpoint: "KAFKA_CUSTOMS_RESPONSE_TOPIC"
---

# Customs feedback exchange

- Customs responses arrive on `${KAFKA_CUSTOMS_RESPONSE_TOPIC}` through the shared Kafka consumer configuration. (source: service/src/main/resources/application.yml:179)
- `CustomsServiceOrderConsumer` only processes events whose header receivers contain `TELIKOS`, so cross-tenant customs traffic is acknowledged and dropped. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java:58)
- The consumer forwards valid events to `bookingEventOperationService.captureCustomsServiceOrderResponse`, which is the runtime handoff into booking-domain updates. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java:76)
- `CUSTOMS_FEEDBACK` runs `processCustomsFeedback` and then `checkAndSendNotification`, so customs feedback is both a state update and a notification trigger. (source: service/src/main/resources/application.yml:397)
- Notification fan-out has a configured `${KAFKA_NOTIFICATION_TOPIC}` producer, which is why customs outcomes can leave the booking service after processing. (source: service/src/main/resources/application.yml:214)
