---
category: contracts
title: Mongo schemas
summary: Mongo stores booking/invoice email history in `EmailBookingDetails`, document archival metadata in `DocumentStorageDetails`, and event-history publish failures in `EventHistoryFailureDetails`.
primary_for: [email-mongo-schemas]
mentions: [booking-email-dispatch, invoice-dispatch-email-flow, sendgrid-webhook-processing, document-storage-pdf-archive]
scenarios: [email mongo schema, email collection layout, why email mongo failed, save email details, update email status]
capabilities: [db-contracts]
domains: [email-notification, persistence]
entities: [EmailBookingDetails, EventsData, EmailData, DocumentStorageDetails, EventHistoryFailureData]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/EmailBookingDetails.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/EventsData.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/EmailData.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/documentstorageservice/DocumentStorageDetails.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/EventHistoryFailureData.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [runtime/sendgrid-webhook-flow.md, operations/failure-model.md, integrations/document-storage.md]
---
# Mongo schemas

| Collection | Key | Stored structure | Write paths |
|---|---|---|---|
| `EmailBookingDetails` | `_id = orderId` | `productName` plus `Event_Data` list of `EventsData{eventId,eventName,bookingId,invoiceNumber,message,emailDataList}`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/EmailBookingDetails.java:13) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/EventsData.java:11) | Booking and invoice flows create/update this record; webhook processing mutates nested `EmailData` status fields. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:140) |
| `DocumentStorageDetails` | `referenceId` | `documentDetails` list from document-storage upload responses. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/documentstorageservice/DocumentStorageDetails.java:14) | `EmailServiceImpl.updateDocumentStorageDetails(...)` upserts by order/reference id after PDF upload. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:445) |
| `EventHistoryFailureDetails` | generated `id` | `bookingId`, `creationTimeStamp`, and full `eventPayload`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/EventHistoryFailureData.java:13) | `EventsHistoryDataServiceImpl.saveEventHistoryData(...)` persists retryable event-history publish failures. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventshistorydata/EventsHistoryDataServiceImpl.java:21) |

- `EventDataRepository.findByOrderId` is a `_id` query and is the common read path for booking updates and webhook correlation. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/repository/EventDataRepository.java:10)
- Mongo auto-index creation is enabled globally in Spring data config. (source: service/src/main/resources/application.yml:103)
