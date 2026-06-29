---
category: operations
title: Retries
summary: Retry policies are split across SendGrid delivery, document download, Mongo persistence, event-history failure persistence, Temporal notification activities, and document-service auth/billing calls.
primary_for: [email-delivery-retries]
mentions: [booking-email-dispatch, invoice-dispatch-email-flow, notification-email-workflow, sendgrid-email-delivery]
scenarios: [email retries, email retry failing, why email retries fail, retry booking email, retry invoice email]
capabilities: [retry-operations]
domains: [email-notification, operations]
entities: [SendGridApiWebClient, ActivityStub, EventsDataServiceImpl, EventsHistoryDataServiceImpl]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/SendGridApiWebClient.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventshistorydata/EventsHistoryDataServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/utility/ActivityStub.java, service/src/main/resources/application.yml]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [operations/failure-model.md, runtime/booking-email-flow.md, runtime/notification-workflow-flow.md]
---
# Retries

| Scope | Strategy | Source |
|---|---|---|
| SendGrid booking/vendor/invoice mail | `Retry.fixedDelay(${SENDGRID_RETRIES}, ${SENDGRID_DURATION}s)` with exhausted retries propagated. | (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/SendGridApiWebClient.java:100) |
| `Send Documents` attachment fetch | `Retry.fixedDelay(3, 2s)` on `RuntimeException`. | (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:431) |
| Mongo `findByOrderId` / `save` | `Retry.fixedDelay(app.mongodb.retries, Duration.ofMinutes(app.mongodb.duration))`. | (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:84) |
| Event-history failure persistence | `Retry.backoff(3, 10s)` before throwing `TelikosInternalServerException`. | (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventshistorydata/EventsHistoryDataServiceImpl.java:45) |
| Notification Temporal activity | initial interval `1s`, backoff coefficient `2.0`, max interval `2h`, start-to-close timeout `2h`. | (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/utility/ActivityStub.java:25) |
| Document-service auth and billing fetch | auth token uses fixed delay `3 x 2s`; billing download uses fixed delay `3 x 2s`. | (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/documentstorageservice/DocumentStorageService.java:119) |
