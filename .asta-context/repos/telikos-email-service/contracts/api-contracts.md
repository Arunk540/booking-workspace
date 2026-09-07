---
category: contracts
title: API contracts
summary: Public HTTP contracts are `POST /api/v1/notifications/email` for Temporal-backed notification mail and `POST /events` for SendGrid webhook ingestion; Temporal-facing workflow and activity signatures form the internal runtime contract.
primary_for: [email-service-api-contracts]
mentions: [notification-email-workflow, sendgrid-webhook-processing, booking-email-dispatch, invoice-dispatch-email-flow]
scenarios: [email api contracts, email endpoint failing, why email endpoint failed, call email api, email request shape]
capabilities: [api-contracts]
domains: [email-notification]
entities: [NotificationRequest, SendGridEvent, ActivityPlanTemporal, ActivityPlanInvoice]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/SendGridEventWebhookController.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/models/notification/NotificationRequest.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/models/notification/NotificationAction.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/SendGridEvent.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/EmailWorkflow.java]
verified_against: a7d1d87df6fd002a83372328daa5fa8862ca59e4
last_updated: 2026-07-20
related: [navigation/entry-points.md, runtime/notification-workflow-flow.md, runtime/sendgrid-webhook-flow.md]
---
# API contracts

| Contract | Payload | Behavioral notes |
|---|---|---|
| `POST /api/v1/notifications/email` | `NotificationRequest{userId, bookingReferenceId, message, notificationType, notificationCategory, channels, emailRequest, actions}` | Starts or signals workflow `EMAIL_<bookingReferenceId>` on `${NOTIFICATION_QUEUE}`; if Temporal client is null, the request is ignored after a log line. `notificationCategory` selects the mail template: `EMAIL BOOKING` (default booking notification) or `REPORT_DOWNLOAD` (attaches a report file). (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java:24) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/models/notification/NotificationRequest.java:14) |
| `NotificationRequest.actions[]` | `NotificationAction{label, actionType, url}` | Action buttons/links on a notification. `actionType=DOWNLOAD-EMAIL` carries the Azure Blob SAS `url` from which `ReportDownloadService` fetches the report for `REPORT_DOWNLOAD` mails. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/models/notification/NotificationAction.java:18) |
| `POST /events` | `List<SendGridEvent>{email,event,url,reason,response,sg_message_id,category}` | Only TELIKOS-tagged categories are processed downstream. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/SendGridEventWebhookController.java:29) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/SendGridEvent.java:16) |
| Temporal workflow `EmailWorkflow.startWorkFlow` + signal `email_signal` | `NotificationRequest` | `startWorkFlow` blocks on `Workflow.await`; `signalFromBooking` is the entry that unblocks it. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/EmailWorkflow.java:12) |
| Temporal activity `sendEmail` | `ActivityPlanTemporal` | Booking email contract; response is the same DTO with normalized `eventName` and updated status. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/ActivityPlanTemporal.java:17) |
| Temporal activity `sendInvoice` | `ActivityPlanInvoice` | Invoice dispatch contract; includes `invoiceData` and per-recipient invoice mail state. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/ActivityPlanInvoice.java:24) |
