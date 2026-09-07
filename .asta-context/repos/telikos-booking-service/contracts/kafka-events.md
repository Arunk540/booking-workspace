---
category: contracts
title: kafka events
summary: "Consumer and producer topic contract sheet, mapped to Avro payloads and concrete handlers in the booking service."
primary_for: [booking-kafka-contracts]
mentions: [event-history-publish, sap-shared-topics, container-availability-feedback]
scenarios: [booking kafka topics, booking kafka schemas, service plan topic, sap feedback topic, event history topic, transport asset priority kafka schema, black friday equipment priority]
capabilities: [topic-lookup, schema-lookup]
domains: [booking, messaging]
entities: [ServicePlan, TransportOrderAcknowledgement, CarrierBooking, CustomsServiceOrderResponseEvent, ContainerAvailabilityApiResponse, TransportAssetPriority]
sources:
  - service/src/main/resources/application.yml
  - service/src/main/avro/Booking.v9.avsc
  - service/src/main/avro/ServicePlan.v9.avsc
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/ContainerAvailabilityFeedbackConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/IomBookingEventDispatcher.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingFlowsEventHistoryDispatcher.java
verified_against: 4850c3efe7babc8364a044fed070268d6945002f
last_updated: "2026-09-07"
related:
  - integrations/iom.md
  - integrations/sap-tms.md
  - integrations/customs.md
---

# Kafka events

- Consumer `${KAFKA_SERVICE_PLAN_TOPIC}` carries Avro `ServicePlan` and is handled by `KafkaConsumerService` on the dedicated cluster. (source: service/src/main/resources/application.yml:115)
- Consumer `${KAFKA_SAP_TMS_FEEDBACK_TOPIC}` carries Avro `TransportOrderAcknowledgement` and is handled by `SapFeedbackConsumerService` on the shared cluster. (source: service/src/main/resources/application.yml:155)
- Consumer `${KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC}` carries Avro `CarrierBooking` and is handled by `SapTmsExecutionStatusConsumerService`. (source: service/src/main/resources/application.yml:168)
- Consumer `${KAFKA_CUSTOMS_RESPONSE_TOPIC}` carries Avro `CustomsServiceOrderResponseEvent` and is handled by `CustomsServiceOrderConsumer`. (source: service/src/main/resources/application.yml:179)
- Consumer `${KAFKA_CONTAINER_AVAILABILITY_TOPIC}` carries Avro `ContainerAvailabilityApiResponse` and is handled by `ContainerAvailabilityFeedbackConsumer`. (source: service/src/main/resources/application.yml:184)
- Producer `${KAFKA_BOOKING_TOPIC}` publishes Booking-domain Avro messages to IOM through `IomBookingEventDispatcher`. (source: service/src/main/resources/application.yml:216)
- Producer `${KAFKA_EVENT_HISTORY_TOPIC}` publishes event-history messages through `BookingFlowsEventHistoryDispatcher`. (source: service/src/main/resources/application.yml:215)
- Producer `${KAFKA_NOTIFICATION_TOPIC}` is configured for notification fan-out and is referenced by customs-feedback notification handling. (source: service/src/main/resources/application.yml:217)
- Shared-cluster consumers all use Avro deserialization and schema registry configuration under `kafka.shared.*`; dedicated service-plan ingress uses the `kafka.dedicated.*` tree. (source: service/src/main/resources/application.yml:84)
- Both producer schemas (`Booking.v9.avsc` and `ServicePlan.v9.avsc`) added a nullable `transportAssetPriority` record under `bookingEquipments` — `transportAssetPriorityGroupName`/`transportAssetPriorityName` (e.g. group `"BLACK FRIDAY"`, name `"HIGH"`), customer-specified equipment priority. Same field crosses to activityplanworkflow-service's `TransportOrder.v9.avsc`; see that repo's `integrations/tms.md`. (source: service/src/main/avro/Booking.v9.avsc:3002; service/src/main/avro/ServicePlan.v9.avsc:4738)
