---
category: runtime
title: confirm booking and send to tms
summary: "Covers the REST-triggered BOOKING_CONFIRMED and SEND_TO_TMS workflow legs, including validation, guards, and NAM registration branching."
primary_for: [confirm-send-to-tms]
mentions: [booking-status-guards, nam-registration-branching, sap-country-validation]
scenarios: [confirm booking api, confirm booking guard, send to tms api, send to tms routing, nam registration branch]
capabilities: [rest-triggered-workflows, validation-routing]
domains: [booking, tms-dispatch]
entities: [BookingController, ConfirmBookingDomainService, BookingSendToTmsDomainService, ProcessSendToTmsImpl]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ConfirmBookingDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/BookingSendToTmsDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - contracts/api-contracts.md
  - runtime/customs-vessel-flow.md
  - integrations/sap-tms.md
---

# Confirm booking and send to tms

- `PATCH /bookings/{bookingId}/status` validates JWT claims, requires at least one party email, and then calls `bookingConfirmService.confirmBooking`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:183)
- `ConfirmBookingDomainService` blocks already confirmed and already cancelled bookings before any workflow is started. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ConfirmBookingDomainService.java:57)
- Successful confirm mutates instructions and agent metadata through `upsertConfirmData`, then initiates `BOOKING_CONFIRMED`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ConfirmBookingDomainService.java:85)
- `BOOKING_CONFIRMED` runs `saveServicePlanDetailsToDB`, `sendServicePlanDetailsToAP`, `updateWorkProcessStartDateTimeInDB`, `sendStartBookingEventToIOM`, and `sendServicePlanDetailsToEH`. (source: service/src/main/resources/application.yml:323)
- `POST /bookings/{bookingId}/send-to-tms` is the API trigger for `SEND_TO_TMS` and delegates to `BookingSendToTmsDomainService`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:272)
- `BookingSendToTmsDomainService` fetches the booking, validates SAP-TMS country eligibility, validates booking status, rejects cancelled bookings, maps agent details, and only then initiates `SEND_TO_TMS`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/BookingSendToTmsDomainService.java:43)
- `SEND_TO_TMS` activities are `processSendToTms`, `saveServicePlanDetailsToDB`, `updateTOVersionStatusAndResetOldTOAck`, `sendServicePlanDetailsToAP`, `updateWorkProcessStartDateTimeInDB`, and `sendStartBookingEventToIOM`. (source: service/src/main/resources/application.yml:349)
- `ProcessSendToTmsImpl` short-circuits if the SEND_TO_TMS work process is already STARTED, which is the idempotency guard for repeated triggers. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java:55)
- The same activity inserts additional executions for NAM registrations: rail bookings queue `CONTAINER_AVAILABILITY_REGISTER`, while non-rail bookings queue `VESSEL_REGISTER_TRACKING`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java:90)
- Requests with unchanged CAMS/VTS registration payloads on amendments skip the extra registration step, which prevents duplicate external registrations. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java:102)
