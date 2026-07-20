---
category: integrations
title: Document Storage
summary: Document Storage is a bidirectional REST integration used to upload generated booking-email PDFs, download `Send Documents` attachments, and fetch billing PDFs when S4Hana mode is enabled.
primary_for: [document-storage-pdf-archive]
mentions: [booking-email-dispatch, invoice-dispatch-email-flow, email-runtime-flags, email-delivery-retries]
scenarios: [document storage flow, document storage failing, why document storage failed, upload document pdf, download billing pdf]
capabilities: [document-storage]
domains: [email-notification, billing]
entities: [DocumentStorageService, DocumentStorageDetails, DownloadedDocument, BillingDocumentsResponse, ReportDownloadService]
peer_systems: [document-storage, azure-blob]
direction: bidirectional
protocol: rest
topic_or_endpoint: ${DOCUMENT_STORAGE_URL}
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/documentstorageservice/DocumentStorageService.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/reportdownloadservice/ReportDownloadService.java]
verified_against: a7d1d87df6fd002a83372328daa5fa8862ca59e4
last_updated: 2026-07-20
related: [runtime/booking-email-flow.md, runtime/invoice-dispatch-flow.md, contracts/db-schemas.md]
---
# Document Storage

| Direction | Operation | Behavior |
|---|---|---|
| outbound | upload booking PDFs | `EmailServiceImpl.invokeDocumentStorageService` uploads automation and email-content PDFs when `DOCUMENT_STORAGE_ENABLED=TRUE`; `SavePdf` writes local replicas instead. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:367) |
| inbound | download pouch documents | `downloadDocument(orderId, document)` fetches `/documents/referenceId/<documentNumber>/content` with document-service IAM auth and maps bytes into `DownloadedDocument`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/documentstorageservice/DocumentStorageService.java:150) |
| inbound | download billing PDFs | `downloadBillingDocumentsSequential` posts to `${DOCUMENT_BILLING_URL}` once per invoice and retries three times with two-second delay. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/documentstorageservice/DocumentStorageService.java:332) |
| local persistence | save upload metadata | Upload responses are folded into `DocumentStorageDetails` in Mongo by `referenceId`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:445) |

- Upload URL and billing URL come from `document.storage.url` and `document.storage.billing-url` configuration keys. (source: service/src/main/resources/application.yml:14)
- Auth-token acquisition for document storage itself retries three times with two-second fixed delay before upload or billing-download calls proceed. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/documentstorageservice/DocumentStorageService.java:119)
- `ReportDownloadService.downloadReport(sasUrl)` is a separate inbound path used only by `REPORT_DOWNLOAD` notifications: it fetches raw report bytes directly from a short-lived Azure Blob SAS URL (pre-signed by the reporting service, carried on the `DOWNLOAD-EMAIL` action of the `NotificationRequest`) — no IAM auth, unlike `DocumentStorageService`. On failure it returns `Mono.empty()` so the caller sends a fallback "download failed" email instead of erroring. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/reportdownloadservice/ReportDownloadService.java:37)
