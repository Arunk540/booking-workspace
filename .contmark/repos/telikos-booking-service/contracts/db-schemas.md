---
category: contracts
title: mongo schemas
summary: "Mongo collection contracts and the workflow operations that insert, save, or query each collection during booking processing."
primary_for: [booking-mongo-schemas]
mentions: [service-plan-storage, transport-order-storage, retry-payload-storage]
scenarios: [booking mongo collections, booking mongo writes, service plan schema, transport order schema, retry collection schema]
capabilities: [collection-lookup, persistence-operation-lookup]
domains: [booking, persistence]
entities: [ServicePlanEntity, TransportOrderNewEntity, CustomsServiceOrderEntity, RetryEntity]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/ServicePlanEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/TransportOrderNewEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/CustomsServiceOrderEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/RetryEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - domain/service-plan.md
  - operations/retries.md
  - runtime/event-activity-matrix.md
---

# Mongo schemas

- `bookings` stores `ServicePlanEntity` with `bookingId` as the document id and includes booking, product, leg, equipment, charge, service-date, and free-day substructures. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/ServicePlanEntity.java:23)
- `transportOrders` stores `TransportOrderNewEntity` with `transportOrderNumber` as the document id plus acknowledgement, status, and version fields. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/TransportOrderNewEntity.java:25)
- `customsOrders` stores `CustomsServiceOrderEntity` with `customsServiceOrderNumber` as the document id and customs-specific lifecycle fields. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/CustomsServiceOrderEntity.java:16)
- `retries` stores `RetryEntity` with creation timestamp, booking id, event type, and serialized failed payload. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/RetryEntity.java:16)
- Workflow writes to `bookings` by insert for `READY_FOR_PLANNING` and `DRAFT_CANCELLATION`, and by save for every later state transition or feedback event. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java:36)
- The trace identifies booking repository operations as insert/save/findById/findByServicePlanNumber/updateStartDateTime/updateEndDateTime, transport-order operations as insert/save/findById/findByBookingNumber, and customs-order operations as insert/save/findById. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java:33)
