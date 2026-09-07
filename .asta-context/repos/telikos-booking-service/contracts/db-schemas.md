---
category: contracts
title: mongo schemas
summary: "Mongo collection contracts and the workflow operations that insert, save, or query each collection during booking processing."
primary_for: [booking-mongo-schemas]
mentions: [service-plan-storage, transport-order-storage, retry-payload-storage]
scenarios: [booking mongo collections, booking mongo writes, service plan schema, transport order schema, retry collection schema, ata capturing, where is ata stored, final destination ata, ata timezone id, booking references wiped, vessel eta reference, can an execution update wipe the stored ata, execution update references guard, references overwritten on update, transport asset priority mongo field, driver id mongo field, idempotent transport order insert, ata timezone final destination leg]
capabilities: [collection-lookup, persistence-operation-lookup]
domains: [booking, persistence]
entities: [ServicePlanEntity, TransportOrderNewEntity, CustomsServiceOrderEntity, RetryEntity, ServicePlanMongoTemplate, BookingConstants, BookingEquipmentEntity, DriverEntity, TransportOrderInfraService, CustomsServiceOrderInfraService]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/ServicePlanEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/TransportOrderNewEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/CustomsServiceOrderEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/RetryEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/TransportPlanEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/AssetEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/persistence/impl/ServicePlanMongoTemplate.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/BookingConstants.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/BookingEquipmentEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/DriverEntity.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/service/TransportOrderInfraService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/service/CustomsServiceOrderInfraService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/DomainHelperUtils.java
verified_against: 4850c3efe7babc8364a044fed070268d6945002f
last_updated: "2026-09-07"
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
- `TransportPlanEntity` migrated work processes from a single embedded `workProcess` object to a plan-level `workProcesses: List<WorkProcessEntity>` array; the legacy singular field is kept read-only for old documents and left null on new writes (all new work-process/execution-status writes target the array). (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/TransportPlanEntity.java)
- New embedded asset models describe the physical asset executing a transport leg: `AssetEntity` (assetIdentifier, assetType, lease/operation/ownership type) references `AssetTypeEntity`, and `CompatibleAssetTypeSetEntity` (code + name) captures interchangeable asset types. Domain mirrors: `Asset`, `AssetType`, `CompatibleAssetTypeSet`; API mirrors: `AssetApplication`, `AssetTypeApplication`, `CompatibleAssetTypeSetApplication`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/AssetEntity.java:9)
- `BookingEquipmentEntity` gained embedded `TransportAssetPriorityEntity` (`transportAssetPriority`: group + priority name), mirroring the new avro/domain/api field end to end. `DriverEntity` gained `driverId`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/BookingEquipmentEntity.java:16; infrastructure/models/DriverEntity.java:14)
- `TransportOrderInfraService.insertTransportOrderIfAbsent` and `CustomsServiceOrderInfraService.insertCustomsServiceOrderIfAbsent` are new idempotent insert paths: insert first, and on a unique-key clash only skip if the existing row is the SAME order (same booking + service plan number) — otherwise a fresh id is generated so a colliding different order is never overwritten. Replaces an unsafe in-memory retry cache; see `operations/retries.md`. (source: infrastructure/service/TransportOrderInfraService.java:159; infrastructure/service/CustomsServiceOrderInfraService.java:83)

## Booking-level references (ATA and its timezone)

- The final-destination **ATA** and its timezone id are stored as booking-level *references*
  (`ATA_ENUM`, `ATA_TIMEZONE_ID_ENUM` / `ATA_TIMEZONE_ID_NAME`), added during execution rather than
  as fields on the plan. Vessel ETA uses the same shape (`VESSEL_ETA_ENUM`).
  (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/BookingConstants.java:450)
- The Mongo write is **guarded**: `booking.references` is only `$set` when the incoming plan
  actually carries references, so an execution update that carries none never wipes the ATA that a
  previous update stored. Removing the guard loses data silently — the update still succeeds.
  (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/persistence/impl/ServicePlanMongoTemplate.java:397)
- The ATA timezone id no longer comes from matching the ATA transport leg's end-location facility
  **name** against the service plan legs. It is now the **highest-sequence service plan leg's**
  (the final destination leg's) facility zone id, full stop — simpler, but wrong if a plan's legs
  are ever out of delivery-sequence order.
  (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/DomainHelperUtils.java:1419)
