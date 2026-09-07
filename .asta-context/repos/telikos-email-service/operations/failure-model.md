---
category: operations
title: Failure model
summary: Failures are either validation-driven before SendGrid, transport/integration-driven during delivery, or post-delivery reconciliation failures from SendGrid webhook and event-history publishing.
primary_for: [email-delivery-failure-model]
mentions: [booking-email-dispatch, invoice-dispatch-email-flow, sendgrid-webhook-processing, notification-email-workflow]
scenarios: [email failure model, email failure causes, why email failed, booking email stuck, sendgrid status bounced]
capabilities: [failure-operations]
domains: [email-notification, operations]
entities: [ActivityPlanEventsServiceImpl, ActivityPlanDispatchEventsServiceImpl, EventsDataServiceImpl, EventsHistoryProducer]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/producer/EventsHistoryProducer.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [operations/retries.md, runtime/sendgrid-webhook-flow.md, contracts/db-schemas.md]
---
# Failure model

| Failure point | Effect | Recovery signal |
|---|---|---|
| Validation failure in booking flow | `onFailure(...)` marks status `FAILED`, stores `Delivery failed due to invalid/missing data`, and still publishes event history. | Look at `EmailBookingDetails` plus event-history records for the same order/booking id. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:238) |
| `Send Documents` attachment fetch error | The flow catches the error, marks status failed, and reuses the same `onFailure(...)` persistence/event-history path. | Triggered after document-download retry exhaustion. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:147) |
| Invoice PDF missing encoded key | Recipient mail is skipped and status becomes `FAILED-EncodedKey` / `Delivery failed due to encoded key is null...`. | Check invoice email response mapping before SendGrid call. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:334) |
| SendGrid webhook `deferred`/`dropped`/`bounced` | Existing `EmailData` status is updated and event history is republished with webhook status. | Follow webhook event id back to `EmailBookingDetails.eventsData`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:389) |
| Event-history publish error | Producer logs the error; retryable router failures are stored in `EventHistoryFailureDetails`. | Investigate failure collection and router exception payload. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/producer/EventsHistoryProducer.java:70) |
| Notification workflow disabled | REST call logs and returns without workflow start when Temporal client is null. | Check `NOTIFICATION_ENABLED` and worker registration. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java:37) |
