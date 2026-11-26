---
category: integrations
title: customs feedback exchange
summary: "Inbound customs-response processing and the notification side effect that follows successful customs feedback handling."
primary_for: [customs-feedback-exchange]
mentions: [customs-notification-topic, receiver-guard, customs-order-state]
scenarios: [customs feedback flow, customs receiver guard, customs notification path, customs response topic, customs order updates]
capabilities: [customs-response-handling, notification-triggering]
domains: [booking, customs]
entities: [CustomsServiceOrderConsumer, CustomsServiceOrderResponseEvent, ProcessCustomsFeedbackActivityImpl, CheckAndSendNotificationActivityImpl, CustomsManualUpdateActivityImpl, CustomsStatusUpdateActivityImpl]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessCustomsFeedbackActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/CheckAndSendNotificationActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/CustomsManualUpdateActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/CustomsStatusUpdateActivityImpl.java
verified_against: 658219d7b0d44dcec2883faeecbe4409128c72d5
last_updated: "2026-11-27"
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

- Customs responses arrive on `${KAFKA_CUSTOMS_RESPONSE_TOPIC}` through the shared Kafka consumer configuration. (source: service/src/main/resources/application.yml:201)
- `CustomsServiceOrderConsumer` only processes events whose header receivers contain `TELIKOS`, so cross-tenant customs traffic is acknowledged and dropped. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java:82)
- On `ContextClosedEvent` the consumer disposes its Kafka subscription (`stopKafkaConsumer`), so SIGTERM stops intake before the Temporal worker drains. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java:60)
- The consumer forwards valid events to `bookingEventOperationService.captureCustomsServiceOrderResponse`, which is the runtime handoff into booking-domain updates. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java:100)
- `CUSTOMS_FEEDBACK` runs `ProcessCustomsFeedbackActivityImpl.processCustomsFeedback` and then `CheckAndSendNotificationActivityImpl.checkAndSendNotification`, so customs feedback is both a state update and a notification trigger. (source: service/src/main/resources/application.yml:430)
- `CheckAndSendNotificationActivityImpl` is a no-op unless `isCustomsNotificationEnabled` is true, and even then only fires for a `CUSTOMS_EXECUTION_STATUS` work-process transition into `ON_HOLD` or `CUSTOMS_RELEASED`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/CheckAndSendNotificationActivityImpl.java:33, :39)
- `CUSTOMS_UPDATE` (the manual-amend path) runs `CustomsManualUpdateActivityImpl.manualCustomsUpdate`, then `updateExecutionStatus` and `sendEndBookingEventToIOM`; a missing service plan sets `closeWorkFlow=true` instead of failing the activity. (source: service/src/main/resources/application.yml:436; temporal/activity/CustomsManualUpdateActivityImpl.java:49)
- `CustomsStatusUpdateActivityImpl.updateAckStatus` completes the customs work process once every `CustomsServiceOrder` is `Ack`, and fails it if any order reports `Error`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/CustomsStatusUpdateActivityImpl.java:39)
- Notification fan-out has a configured `${KAFKA_NOTIFICATION_TOPIC}` producer, which is why customs outcomes can leave the booking service after processing. (source: service/src/main/resources/application.yml:236)
