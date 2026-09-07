---
category: navigation
title: Entry points
summary: The repo exposes two REST endpoints and three Temporal worker entry points; Kafka is configured at infrastructure level but not surfaced as a first-party controller method in main source.
primary_for: [email-entry-points]
mentions: [booking-email-dispatch, invoice-dispatch-email-flow, notification-email-workflow, sendgrid-webhook-processing]
scenarios: [email entry points, where email starts, which class handles email, email webhook entry, email temporal entry]
capabilities: [navigation]
domains: [email-notification]
entities: [NotificationController, SendGridEventWebhookController, TemporalWorker]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/SendGridEventWebhookController.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/EmailWorkflow.java, service/src/main/resources/application.yml]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [navigation/scenarios.md, navigation/key-classes.md, contracts/api-contracts.md]
---
# Entry points

| Type | Trigger | Handler |
|---|---|---|
| REST | `POST /api/v1/notifications/email` | `NotificationController.sendEmailNotification` → `WorkflowStub.signalWithStart(...)`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java:37) |
| REST webhook | `POST /events` | `SendGridEventWebhookController.receiveSgEventHook` → `AcceptSendGridEventsCommand.apply`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/SendGridEventWebhookController.java:29) |
| Temporal activity | `${EMAIL_TASK_QUEUE}` | `SendEmailConfirmationActivityImpl.emailSend`. (source: service/src/main/resources/application.yml:4) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendEmailConfirmationActivityImpl.java:20) |
| Temporal activity | `${EMAIL_TASK_QUEUE_INVOICE_DISPATCH}` | `SendInvoiceDispatchActivityImpl.sendInvoice`. (source: service/src/main/resources/application.yml:4) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendInvoiceDispatchActivityImpl.java:17) |
| Temporal workflow | `EmailWorkflow.startWorkFlow` + signal `email_signal` on `${NOTIFICATION_QUEUE}` | Registered only when `NOTIFICATION_ENABLED=true`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/EmailWorkflow.java:12) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java:69) |
