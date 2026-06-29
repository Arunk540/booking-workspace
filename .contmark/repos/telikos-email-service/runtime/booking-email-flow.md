---
category: runtime
title: Booking email flow
summary: `sendEmail` Temporal activity converts an activity-plan payload, resolves sender and recipients, validates the event, then routes to Send Documents, vendor email, or standard SendGrid delivery before Mongo and event-history updates.
primary_for: [booking-email-dispatch]
mentions: [activity-plan-email-events, sendgrid-email-delivery, decision-hub-sender-resolution, document-storage-pdf-archive, email-delivery-retries]
scenarios: [booking email flow, booking email failing, why booking email failed, send booking email, which class sends booking email]
capabilities: [booking-email]
domains: [email-notification, activity-plan]
entities: [SendEmailConfirmationActivityImpl, ActivityPlanEventsServiceImpl, ActivityPlanTemporal, EmailBookingDetails]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendEmailConfirmationActivityImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [domain/activity-plan-events.md, integrations/sendgrid.md, operations/failure-model.md]
---
# Booking email flow

## Variant Routing
| Trigger condition | Resolver path | Notes |
|---|---|---|
| `Send Documents` | parse `ActivityPlanRequest` → download pouch docs → `sendEmailDocuments` | Document download retries 3 times with 2-second fixed delay. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:84) |
| `Booking Amendment Cancelled` | `onFailure(...)` only | The flow logs invalidity and never enters SendGrid success processing. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:156) |
| Vendor events | `doOnProcessForVendorToContainer` → `sendEmailForVendors` | Applies to `Send To Execution`, `Booking Cancelled For Vendor`, and `Amendment Send To Execution`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:175) |
| All other valid events | `doProcess` → `sendEmail` | Standard booking confirmation/cancellation/amendment delivery path. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:181) |

## Chain
1. `SendEmailConfirmationActivityImpl.emailSend` receives `ActivityPlanTemporal`, logs the booking id, and delegates to `ActivityPlanEventsServiceImpl.processActivityPlanEvent`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendEmailConfirmationActivityImpl.java:20)
2. The service maps Temporal DTO → `ActivityPlanEvent`, resolves `fromEmail` via Decision Hub when country is configured and direction is nonblank, otherwise falls back to the AGENT party email from booking data. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:67) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java:477)
3. `getToEmails` reads booking-equipment instruction parties for vendor flows and booking instruction parties for all other flows, deduping recipient addresses. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java:94)
4. `validateEvent` checks order id, booking id, product name, sender, domain data, mapped template, recipient list, and order/booking mismatch against service-plan data. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java:313)
5. Success paths call either `sendEmail`, `sendEmailForVendors`, or `sendEmailDocuments`; standard and vendor paths also call `asyncInvokeDocumentStorageService`, which uploads PDFs when `DOCUMENT_STORAGE_ENABLED=TRUE` or writes local `./azurePdf_<orderId>.pdf` files when set to `SavePdf`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:98) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:340)
6. `processSendEmailResponse` splits SendGrid result into status and category, marks activity-plan status, saves `EmailBookingDetails`, increments `telikos_email_sendgrid`, and publishes event history. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:313)
7. `onFailure` marks the activity as failed, persists a `FAILED_DELIVERY` message when order and booking ids exist, increments failure metrics, and still publishes event history. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:238)
8. The returned Temporal payload rewrites `eventName` through `EmailUtility.setEventTypes()` before feedback goes back to AP. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:402) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/utilities/EmailUtility.java:266)
