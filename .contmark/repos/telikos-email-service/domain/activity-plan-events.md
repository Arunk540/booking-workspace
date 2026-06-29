---
category: domain
title: Activity plan events
summary: Core email payloads are ActivityPlanTemporal for booking mail, ActivityPlanInvoice for invoice mail, and the Avro ActivityPlanEvent contract for event history and topic exchange.
primary_for: [activity-plan-email-events]
mentions: [booking-email-dispatch, invoice-dispatch-email-flow, notification-email-workflow, email-event-history-kafka]
scenarios: [activity plan email flow, activity plan event mapping, activity plan status mapping, where activity plan lives, why activity plan failed]
capabilities: [booking-email, invoice-dispatch, notification-email]
domains: [email-notification, activity-plan, billing]
entities: [ActivityPlanTemporal, ActivityPlanInvoice, ActivityPlanEvent, EmailBookingDetails]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/ActivityPlanTemporal.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/ActivityPlanInvoice.java, service/src/main/avro/activityPlanEvent.avsc, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/utilities/EmailUtility.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [runtime/booking-email-flow.md, runtime/invoice-dispatch-flow.md, contracts/db-schemas.md]
---
# Activity plan events

## Core payloads
- `ActivityPlanTemporal` carries `productName`, `domainName`, `orderId`, `bookingId`, `eventName`, `userId`, `userName`, `activityDateTime`, `status`, `eventType`, and `domainData`; this is the Temporal activity payload for booking-mail execution. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/ActivityPlanTemporal.java:17)
- `ActivityPlanInvoice` reuses booking identifiers and adds `invoiceData`, `invoiceNumber`, `toEmail`, `transportActivity`, and `detailedErrorMsgs` for invoice dispatch handling. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/ActivityPlanInvoice.java:24)
- Avro `ActivityPlanEvent` is the schema-level contract with required `productName`, `domainName`, `orderId`, `eventName`, `activityDateTime` and nullable `bookingId`, `userId`, `userName`, `status`, `domainData`. (source: service/src/main/avro/activityPlanEvent.avsc:1)

## Event name normalization
| Input event | Output event |
|---|---|
| Booking Confirmed | Email Booking Confirmation Status |
| Booking Cancelled | Email Booking Cancellation Status |
| Booking Amendment Confirmed | Email Booking Amendment Confirmation Status |
| Booking Amendment Cancelled | Email Booking Amendment Cancellation Status |
| Send To Execution | Email Send To Execution Status |
| Booking Cancelled For Vendor | Email Booking Cancellation For Vendor Status |
| Amendment Send To Execution | Email Amendment Send To Execution Status |
| Invoice Dispatch | Email Invoice Dispatched Status |
| Send Documents | Send Documents |
(source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/utilities/EmailUtility.java:266)

## Validation invariants
- Booking mail fails validation when `orderId`, `bookingId`, `productName`, `domainData`, sender email, recipient list, or mapped template is missing, or when domain `servicePlanNumber` disagrees with the activity payload order id. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java:313)
- Vendor-recipient extraction switches from `booking.instructions[*].parties[*].emailAddresses` to `bookingEquipments[*].instructions[*].parties[*].emailAddresses` for `Send To Execution`, `Booking Cancelled For Vendor`, and `Amendment Send To Execution`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java:94)
