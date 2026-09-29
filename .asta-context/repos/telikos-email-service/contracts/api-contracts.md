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
verified_against: 473e07ebffd0d0920e4153642bdc1eb97a80eb45
last_updated: "2026-09-29"
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

- `POST /api/v1/notifications/email` dispatch to the booking template is exact-match (case-insensitive `.equals`), not substring containment — a `notificationCategory` merely containing "EMAIL BOOKING" now falls through to the generic template instead of matching. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:223)
- Inbound `BookingEquipment.transportAssetPriority` (group/name) is accepted and deserialized on the wire DTO but `ServicePlanMapper.mapEquipmentSizeTypes` does not map it onto the internal model used for mail content — the field is currently a no-op for any email. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/dto/BookingEquipment.java:25; service/src/main/java/net/apmoller/crb/telikos/microservices/email/mapper/ServicePlanMapper.java:52)
