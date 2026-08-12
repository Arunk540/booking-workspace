---
category: runtime
title: rfp variant routing and flow
summary: "Forensic map of the READY_FOR_PLANNING ingress path, including amendment and cancellation variants selected by the inland resolver chain."
primary_for: [rfp-variant-routing]
mentions: [product-resolver-chain, booking-cancellation-routing, one-click-booking]
scenarios: [rfp flow entry, rfp variant routing, rfp duplicate guard, booking cancellation routing, amendment routing chain, process ready for planning activity]
capabilities: [event-routing, workflow-initiation]
domains: [booking, service-plan]
entities: [ProductOrchestration, InlandBookingHandler, InitialReadyForPlanningEventsDomainService, AmendEditRfpEventsDomainService, CancelBookingEventsDomainService, ProcessReadyForPlanning, ProcessReadyForPlanningImpl]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/productresolver/ProductOrchestration.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/InlandBookingHandler.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/InitialReadyForPlanningEventsDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/AmendEditRfpEventsDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/CancelBookingEventsDomainService.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessReadyForPlanning.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessReadyForPlanningImpl.java
verified_against: 6ee7d83b6e6a427b680025a1758a40ab4775acca
last_updated: "2026-08-11"
related:
  - runtime/event-activity-matrix.md
  - contracts/kafka-events.md
  - navigation/key-classes.md
---

# RFP variant routing and flow

- Entry starts at the dedicated Kafka consumer, which acknowledges only after `BookingEventOperationService.captureBookingEvents` completes or exhausts business retries. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:37)
- `ProductOrchestration` selects the top-level product resolver from a predicate map, and the booking trace says inland bookings route into `InlandBookingHandler`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/productresolver/ProductOrchestration.java:22)
- `InlandBookingHandler` performs a second predicate-based dispatch to the concrete event-domain service, which is how new, amend, and cancel variants stay in one ingress lane. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/InlandBookingHandler.java:27)
- New bookings are the `bookingStatus=BOOKED` plus `eventType=null` case; they land in `InitialReadyForPlanningEventsDomainService` and emit `READY_FOR_PLANNING`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/InitialReadyForPlanningEventsDomainService.java:50)
- READY_FOR_PLANNING has a duplicate-initiation guard: if an existing booking already exists for the same service-plan number, the workflow is skipped and the event is only acknowledged. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/InitialReadyForPlanningEventsDomainService.java:69)
- The initial RFP step is now its own Temporal activity — `@ActivityInterface ProcessReadyForPlanning.processReadyForPlanning(BookingActivity) → BookingActivity`, implemented by `ProcessReadyForPlanningImpl` and registered on the worker alongside the other activities. Work that used to run inline is now retriable by Temporal rather than failing the consume. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessReadyForPlanning.java) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessReadyForPlanningImpl.java:39) (source: service/src/main/resources/application.yml)
- Amendment events route to `AmendEditRfpEventsDomainService`, which immediately initiates `EDIT_AMEND_READY_FOR_PLANNING`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/AmendEditRfpEventsDomainService.java:30)
- Cancellation events route to `CancelBookingEventsDomainService`; missing `bookingNumber` means `DRAFT_CANCELLATION`, while a populated `bookingNumber` means `BOOKING_CANCELLATION`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/eventsservice/CancelBookingEventsDomainService.java:27)
- READY_FOR_PLANNING activities run in this order: `saveServicePlanDetailsToDB`, `saveTODetails`, `saveSODetails`, `sendServicePlanDetailsToAP`, `updateWorkProcessStartDateTimeInDB`, `sendStartBookingEventToIOM`, `sendServicePlanDetailsToEH`. (source: service/src/main/resources/application.yml:315)
- EDIT_AMEND_READY_FOR_PLANNING replaces the initial TO/SO creation with `processEditAmendReadyForPlanning` and `updateTransportOrder`, then keeps the same AP/IOM/EH fan-out pattern. (source: service/src/main/resources/application.yml:335)
- DRAFT_CANCELLATION omits TO version reset, while BOOKING_CANCELLATION adds `updateTOVersionStatusAndResetOldTOAck` before AP/IOM/EH dispatch. (source: service/src/main/resources/application.yml:364)

## Mapping Chain

MapStruct/hand-written mappers fail silently — an unmapped field compiles green and drops data. A field added to this flow must touch every hop below.

| Hop | Mapper | From → To | Source |
|---|---|---|---|
| ingest | `BookingResponseMapper` | RFP event → application model | events/mapper/ · used by domain/inland/service/eventsservice/router/EventRouterService.java |
| ingest | `ServicePlanApplicationMapper` | event payload → service-plan model | events/mapper/ · used by events/service/BookingEventOperationService.java |
| persist | `ServicePlanEntityMapper` | domain → Mongo entity | infrastructure/mapper/ · used by infrastructure/service/BookingEventsOperationInfraServiceImpl.java |
| persist | `TransportOrderMapper` | domain TO → entity | infrastructure/mapper/ · used by infrastructure/service/BookingEventsOperationInfraServiceImpl.java |
| audit | `ReadyForPlanningEventHistoryMapper` / `InitialReadyForPlanningHistoryMapper` | event → history record | events/audit/mappers/ · via events/audit/dispatchers/* |
