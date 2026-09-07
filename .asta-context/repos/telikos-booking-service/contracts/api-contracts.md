---
category: contracts
title: api contracts
summary: "Entry-point contract sheet for REST APIs, including authorization expectations and the validations performed inline by controllers."
primary_for: [booking-rest-contracts]
mentions: [booking-reprocess-api, transport-order-query, migration-guard]
scenarios: [booking api endpoints, booking api auth, booking api validations, transport order query, customs order query]
capabilities: [rest-surface-lookup, validation-tracing]
domains: [booking, api]
entities: [BookingController, TransportOrderController, CustomsOrderController, BookingReprocessApiController, MigrateDataController]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingReprocessApiController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/TransportOrderController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/CustomsOrderController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/MigrateDataController.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - navigation/entry-points.md
  - runtime/confirm-send-to-tms-flow.md
  - operations/flags-and-lists.md
---

# API contracts

- `GET /bookings/{bookingId}` → `getBookingById`; validates `bookingId` against `[a-zA-Z0-9]{11}` before returning booking state. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:102)
- `PUT /bookings/{bookingId}/transport-orders` → `updateBooking`; requires booking-api authority, validates booking id, rejects transport orders with missing transport plans, and reads user email from JWT claims. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:123)
- `PATCH /bookings/{bookingId}/status` → `confirmBooking`; requires booking-api authority and at least one non-empty party email in the request. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:183)
- `PATCH /bookings/{bookingId}/execution-instructions` → `bookingSendToExecution`; requires booking-api authority and validates execution-team emails before delegating. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:240)
- `POST /bookings/{bookingId}/send-to-tms` → `bookingSendToTms`; requires booking-api authority and accepts an optional body. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:272)
- `GET /bookings/{bookingId}/configs` → `getManualOrAutomationBooking`; validates booking id and returns manual/automated execution config. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:295)
- `PATCH /bookings/{bookingId}/send-documents` → `sendDocuments`; requires booking-api authority, at least one party email, and at least one document number. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:320)
- `PUT /bookings/bulk-upload/{orderId}/container-details` → `updateContainerDetails`; requires booking-api authority and rejects containers missing `bookingEquipmentId` or `containerNumber`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:386)
- `PATCH /bookings/{bookingId}/customs-status` → `customsStatusUpdate`; requires booking-api authority and rejects empty customs status or booking-equipment identifiers. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:436)
- `PATCH /bookings/{bookingId}/vessel-information` → `updateVesselInformation`; validates booking id format and returns HTTP 200 on success. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:479)
- `PATCH /bookings/{bookingId}/workProcessStatus` → `triggerEvents`; requires booking-api role and optionally accepts an `event` query param for reprocessing. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingReprocessApiController.java:27)
- `GET /transport-orders` and `GET /customs-orders` are lookup endpoints keyed by `bookingId`, `servicePlanNumber`, and order identifiers. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/TransportOrderController.java:38)
- `POST /migrate/rel2/data` starts migration only when `app.dataMigration` is enabled; otherwise the controller logs and exits. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/MigrateDataController.java:33)
