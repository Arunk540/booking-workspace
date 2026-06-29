---
category: integrations
title: AP Temporal ingress
summary: Activity-plan workflow service invokes this repo through Temporal activity queues for booking confirmation/cancellation/amendment mail and invoice dispatch mail; the email service responds by returning transformed activity payloads.
primary_for: [activity-plan-temporal-ingress]
mentions: [booking-email-dispatch, invoice-dispatch-email-flow, notification-email-workflow]
scenarios: [activity plan queue, activity plan temporal, activity plan email task, activity plan invoice task, where activity plan enters]
capabilities: [temporal-ingress]
domains: [activity-plan, billing, email-notification]
entities: [TemporalWorker, SendEmailConfirmationActivityImpl, SendInvoiceDispatchActivityImpl]
peer_systems: [telikos-activityplanworkflow-service_02]
direction: inbound
protocol: temporal-signal
topic_or_endpoint: EMAIL_TASK_QUEUE
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendEmailConfirmationActivityImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendInvoiceDispatchActivityImpl.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [runtime/booking-email-flow.md, runtime/invoice-dispatch-flow.md, navigation/entry-points.md]
---
# AP Temporal ingress

| Queue | Bound handler | Purpose |
|---|---|---|
| `${EMAIL_TASK_QUEUE}` | `SendEmailConfirmationActivityImpl` | Booking confirmation/cancellation/amendment and document-send email activity. (source: service/src/main/resources/application.yml:4) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java:58) |
| `${EMAIL_TASK_QUEUE_INVOICE_DISPATCH}` | `SendInvoiceDispatchActivityImpl` | Invoice dispatch email activity. (source: service/src/main/resources/application.yml:4) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java:64) |

- `emailSend(...)` logs the booking id, delegates to booking-email orchestration, and returns the transformed `ActivityPlanTemporal` payload back to the caller. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendEmailConfirmationActivityImpl.java:20)
- `sendInvoice(...)` logs order and booking ids, delegates to invoice orchestration, and returns `ActivityPlanInvoice` feedback. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendInvoiceDispatchActivityImpl.java:17)
- Notification workflow runs on a third queue `${NOTIFICATION_QUEUE}`, but it is a local REST-triggered workflow rather than AP ingress. (source: service/src/main/resources/application.yml:223) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java:69)
