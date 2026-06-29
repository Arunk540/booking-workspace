---
category: navigation
title: key classes
summary: "Concern-to-class cheat sheet for the booking repo so an agent can jump directly to the likely owner of a behavior."
primary_for: [booking-class-landmarks]
mentions: [workflow-landmarks, consumer-landmarks, integrator-landmarks]
scenarios: [booking class map, booking key classes, workflow owner class, consumer owner class, integration owner class]
capabilities: [class-routing, owner-discovery]
domains: [booking, navigation]
entities: [BookingController, ProductOrchestration, BookingEventsWorkflowImplementation]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/productresolver/ProductOrchestration.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/InlandBookingHandler.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingActivityPlanDispatcher.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - navigation/entry-points.md
  - navigation/scenarios.md
  - architecture/modules.md
---

# Key classes

- REST ingress owner: `BookingController`, with sibling controllers `TransportOrderController`, `CustomsOrderController`, `BookingReprocessApiController`, and `MigrateDataController`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:79)
- Product/event resolver chain: `ProductOrchestration` chooses product family, then `InlandBookingHandler` chooses the inland event-domain service. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/productresolver/ProductOrchestration.java:22)
- RFP/cancel/amend owners: `InitialReadyForPlanningEventsDomainService`, `AmendEditRfpEventsDomainService`, and `CancelBookingEventsDomainService`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/InitialReadyForPlanningEventsDomainService.java:29)
- Confirm/send-to-tms owners: `ConfirmBookingDomainService`, `BookingSendToTmsDomainService`, and `ProcessSendToTmsImpl`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ConfirmBookingDomainService.java:34)
- Workflow owner: `BookingEventsWorkflowImplementation`; VTS hold owner: `VtsWaitChildWorkflowImpl`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:31)
- Kafka ingress owners: `KafkaConsumerService`, `SapFeedbackConsumerService`, `SapTmsExecutionStatusConsumerService`, `CustomsServiceOrderConsumer`, and `ContainerAvailabilityFeedbackConsumer`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:29)
- External dispatch owners: `BookingActivityPlanDispatcher`, `IomBookingEventDispatcher`, `BookingFlowsEventHistoryDispatcher`, `CamsIntegrator`, `VesselTrackingIntegrator`, and `DeadlineRulesIntegrator`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/BookingActivityPlanDispatcher.java:23)
