---
category: runtime
title: Invoice dispatch flow
summary: `sendInvoice` only processes `Invoice Dispatch`, chooses S4Hana billing-document download or Finance Chassis PDF export, groups invoices by recipient email, then sends grouped SendGrid mails and stores invoice event data.
primary_for: [invoice-dispatch-email-flow]
mentions: [finance-chassis-invoice-pdf, document-storage-pdf-archive, sendgrid-email-delivery, email-delivery-retries]
scenarios: [invoice dispatch flow, invoice dispatch failing, why invoice dispatch failed, send invoice dispatch, which class sends invoice]
capabilities: [invoice-dispatch]
domains: [email-notification, billing]
entities: [SendInvoiceDispatchActivityImpl, ActivityPlanDispatchEventsServiceImpl, ActivityPlanInvoice, EventsData]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendInvoiceDispatchActivityImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/documentstorageservice/DocumentStorageService.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [integrations/finance-chassis.md, integrations/document-storage.md, contracts/db-schemas.md]
---
# Invoice dispatch flow

## Variant Routing
| Trigger condition | Resolver path | Notes |
|---|---|---|
| `IS_S4_HANA_ENABLED=true` | `downloadBillingDocumentsSequential` | Calls `${DOCUMENT_BILLING_URL}` once per invoice with IAM auth. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:87) |
| `IS_S4_HANA_ENABLED=false` | `FinanceChasisApiWebClient.invokeFinanceChassisApiForInvoicePdf` | Posts to `/erp/finance/idd694/export-documents` with finance IAM token. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:99) |
| Missing encoded key | recipient result = `FAILED-EncodedKey` | The email leg is skipped for that recipient grouping. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:334) |

## Chain
1. `SendInvoiceDispatchActivityImpl.sendInvoice` logs order/booking ids and calls `ActivityPlanDispatchEventsServiceImpl.processActivityPlanInvoice`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendInvoiceDispatchActivityImpl.java:17)
2. The domain service gates on `eventName == "Invoice Dispatch"`; nonmatching events just bypass the download/send path and still get normalized on return. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:71)
3. Download responses are converted into `DownloadInvoiceResponse`, then flattened against `invoiceData` so each PDF is associated with the matching invoice or credit-note relation. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:163) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:215)
4. Grouping is by recipient email; each group collects invoices plus aligned PDF byte arrays before `sendEmailForInvoiceDispatch` is called. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:225)
5. Response post-processing maps SendGrid outcome into per-recipient `EmailData`, derives event ids from categories, saves `EmailBookingDetails`, and publishes invoice event history. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:354)
6. The flow returns the original invoice payload with `eventName` remapped to `Email Invoice Dispatched Status`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:145) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/utilities/EmailUtility.java:266)
