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
  - service/src/main/avro/Booking.v10.avsc
  - service/src/main/avro/ServicePlan.v10.avsc
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/ContainerAvailabilityFeedbackConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/IomBookingEventDispatcher.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingFlowsEventHistoryDispatcher.java
verified_against: 658219d7b0d44dcec2883faeecbe4409128c72d5
last_updated: "2026-11-26"
related:
  - integrations/iom.md
  - integrations/sap-tms.md
  - integrations/customs.md
---

# Kafka events

- Consumer `${KAFKA_SERVICE_PLAN_TOPIC}` carries Avro `ServicePlan` and is handled by `KafkaConsumerService` on the dedicated cluster. (source: service/src/main/resources/application.yml:142)
- Consumer `${KAFKA_SAP_TMS_FEEDBACK_TOPIC}` carries Avro `TransportOrderAcknowledgement` and is handled by `SapFeedbackConsumerService` on the shared cluster. (source: service/src/main/resources/application.yml:182)
- Consumer `${KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC}` carries Avro `CarrierBooking` and is handled by `SapTmsExecutionStatusConsumerService`. (source: service/src/main/resources/application.yml:197)
- Consumer `${KAFKA_CUSTOMS_RESPONSE_TOPIC}` carries Avro `CustomsServiceOrderResponseEvent` and is handled by `CustomsServiceOrderConsumer`. (source: service/src/main/resources/application.yml:208)
- Consumer `${KAFKA_CONTAINER_AVAILABILITY_TOPIC}` carries Avro `ContainerAvailabilityApiResponse` and is handled by `ContainerAvailabilityFeedbackConsumer`. (source: service/src/main/resources/application.yml:213)
- Producer `${KAFKA_BOOKING_TOPIC}` publishes Booking-domain Avro messages to IOM through `IomBookingEventDispatcher`. (source: service/src/main/resources/application.yml:138)
- Producer `${KAFKA_EVENT_HISTORY_TOPIC}` publishes event-history messages through `BookingFlowsEventHistoryDispatcher`. (source: service/src/main/resources/application.yml:242)
- Producer `${KAFKA_NOTIFICATION_TOPIC}` is published through `KafkaNotificationDispatcher`, called from `EventRouterService`. (source: service/src/main/resources/application.yml:140)
- Shared-cluster consumers all use Avro deserialization and schema registry configuration under `kafka.shared.*`; dedicated service-plan ingress uses the `kafka.dedicated.*` tree. [gap] Avro deserializer settings per consumer were not re-read. (source: service/src/main/resources/application.yml:112, :169)
- Both producer schemas (`Booking.v10.avsc` and `ServicePlan.v10.avsc`) carry a `transportAssetPriority` record under `bookingEquipments` — `transportAssetPriorityGroupName`/`transportAssetPriorityName`, customer-specified equipment priority. The same field is in activityplanworkflow-service's `TransportOrder.v10.avsc`; see that repo's `integrations/tms.md`. [gap] nullability of the record was not checked. (source: service/src/main/avro/Booking.v10.avsc:2581; service/src/main/avro/ServicePlan.v10.avsc:6908)
- **Topic names and schema versions are separate axes.** Topic names carry their own suffix (`...vN`); the Avro schema files are versioned by file name (`*.v10.avsc` on develop). Don't conflate a topic-suffix bump with a schema bump. [gap] the per-env topic suffixes live in helm values, which this workspace does not read.
- `BookingEquipment.equals`/`hashCode` include `transportAssetPriority` next to `transportAssetRequirement`, so two equipments differing only by priority are not equal. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/models/BookingEquipment.java:61, :175)
- Consumer-side `CarrierBooking.v10.avsc` (SAP_TMS_EXECUTION_STATUS payload) has a `references` array on a transport-plan substructure; `SapTmsExecutionStatusTransportOrderMapper.mapLinkedFreightOrderReference` reads the `ZSOFR` (linked freight order) reference type — see `integrations/sap-tms.md`. (source: service/src/main/avro/CarrierBooking.v10.avsc:1585; events/mapper/SapTmsExecutionStatusTransportOrderMapper.java:119)
