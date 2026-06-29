---
category: navigation
title: entry points
summary: "Single-sheet map of all REST, Kafka, and Temporal entry points named in the forensic trace."
primary_for: [booking-entry-surface]
mentions: [rest-entry-points, kafka-entry-points, temporal-entry-points]
scenarios: [booking entry points, booking rest entries, booking kafka entries, booking temporal entries, booking ingress map]
capabilities: [entry-point-navigation, ingress-lookup]
domains: [booking, navigation]
entities: [BookingController, KafkaConsumerService, BookingEventsWorkflowImplementation]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingReprocessApiController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/TransportOrderController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/CustomsOrderController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/MigrateDataController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/ContainerAvailabilityFeedbackConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflow.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - contracts/api-contracts.md
  - contracts/kafka-events.md
  - navigation/key-classes.md
---

# Entry points

- REST: `GET /bookings/{bookingId}` at `BookingController.getBookingById`; `PUT /bookings/{bookingId}/transport-orders` at `updateBooking`; `PATCH /bookings/{bookingId}/status` at `confirmBooking`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:102)
- REST: `PATCH /bookings/{bookingId}/execution-instructions`, `POST /bookings/{bookingId}/send-to-tms`, `GET /bookings/{bookingId}/configs`, and `PATCH /bookings/{bookingId}/send-documents` are all on `BookingController`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:240)
- REST: `PUT /bookings/bulk-upload/{orderId}/container-details`, `PATCH /bookings/{bookingId}/customs-status`, and `PATCH /bookings/{bookingId}/vessel-information` are the remaining booking mutations. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:386)
- REST: `PATCH /bookings/{bookingId}/workProcessStatus` maps to `BookingReprocessApiController.triggerEvents`; `GET /transport-orders` and `GET /customs-orders` are query surfaces; `POST /migrate/rel2/data` is the migration surface. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingReprocessApiController.java:27)
- Kafka: `${KAFKA_SERVICE_PLAN_TOPIC}` → `KafkaConsumerService.startKafkaConsumer`; `${KAFKA_SAP_TMS_FEEDBACK_TOPIC}` → `SapFeedbackConsumerService.startKafkaConsumer`; `${KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC}` → `SapTmsExecutionStatusConsumerService.startKafkaConsumer`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:36)
- Kafka: `${KAFKA_CUSTOMS_RESPONSE_TOPIC}` → `CustomsServiceOrderConsumer.startKafkaConsumer`; `${KAFKA_CONTAINER_AVAILABILITY_TOPIC}` → `ContainerAvailabilityFeedbackConsumer.startKafkaConsumer`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java:27)
- Temporal: workflow method `bookingEventsWorkflow` enters at `BookingEventsWorkflow.initialiseBookingEvents`; signal `bookingSignal` enters at `consumeFeedBackSignal`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflow.java:12)
- Temporal: the VTS child wait loop enters at `VtsWaitChildWorkflowImpl.waitForFeedback`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java:35)
