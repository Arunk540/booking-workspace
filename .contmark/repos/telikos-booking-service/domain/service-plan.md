---
category: domain
title: service plan aggregate
summary: "Canonical shape of the booking aggregate, its sibling order documents, and the persistence rules Temporal activities apply."
primary_for: [service-plan-state]
mentions: [transport-order-lifecycle, customs-order-lifecycle, retry-event-payload]
scenarios: [service plan fields, service plan dates, service plan persistence, booking state lookup, service plan retries]
capabilities: [aggregate-persistence, workflow-state-storage]
domains: [booking, service-plan]
entities: [ServicePlan, Booking, TransportOrder, CustomsServiceOrder, RetryEntity]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/ServicePlanEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/TransportOrderNewEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/CustomsServiceOrderEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/RetryEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - contracts/db-schemas.md
  - runtime/event-activity-matrix.md
  - operations/retries.md
---

# Service plan aggregate

## Aggregate shape
- `ServicePlanEntity` persists to the `bookings` collection and carries booking identifiers, products, transport orders, legs, locations, equipments, charges, customs orders, service dates, and the CAMS/VTS change flags. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/ServicePlanEntity.java:23)
- `TransportOrderNewEntity` persists to `transportOrders` with versioning, transport plans, acknowledgement state, booking linkage, service plan linkage, and carrier documents. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/TransportOrderNewEntity.java:25)
- `CustomsServiceOrderEntity` persists to `customsOrders` with transaction type, status fields, references, booking equipment identifiers, and booking/service-plan linkage. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/CustomsServiceOrderEntity.java:16)
- `RetryEntity` persists failed outbound payloads with `bookingId`, `eventType`, `creationTimeStamp`, and the serialized event payload. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/RetryEntity.java:16)

## Persistence semantics
- Temporal insert semantics are special-cased for `READY_FOR_PLANNING` and `DRAFT_CANCELLATION`; those events insert a fresh booking row instead of saving over an existing document. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java:36)
- Duplicate booking inserts are treated as booking-id collisions; the activity regenerates a booking number and re-initiates the same workflow rather than failing the event permanently. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java:44)
- All non-insert flows save the current booking document, but transport plans are temporarily nulled before save and restored after write to reduce nested persistence weight. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java:61)
- One-click bookings mutate the aggregate before save for `SEND_TO_EXECUTION` and `BOOKING_CONFIRMED`, which keeps persisted work-process state aligned with auto-advanced workflow steps. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java:107)
