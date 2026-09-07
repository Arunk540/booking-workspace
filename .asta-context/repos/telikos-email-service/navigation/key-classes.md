---
category: navigation
title: Key classes
summary: Key concerns cluster around Temporal ingress, booking/invoice orchestration, SendGrid delivery, Mongo persistence, and outbound integration clients.
primary_for: [email-key-classes]
mentions: [email-service-modules, email-scenario-routing, email-entry-points]
scenarios: [email key classes, which class handles email, email class lookup, where email logic lives, email ownership map]
capabilities: [navigation]
domains: [email-notification]
entities: [TemporalWorker, ActivityPlanEventsServiceImpl, EmailServiceImpl, EventsDataServiceImpl]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [navigation/scenarios.md, architecture/modules.md]
---
# Key classes

| Concern | Class |
|---|---|
| notification rest entry | `NotificationController` |
| sendgrid webhook entry | `SendGridEventWebhookController` |
| temporal worker bootstrap | `TemporalWorker` |
| notification workflow | `EmailWorkflowImpl` |
| booking email orchestration | `ActivityPlanEventsServiceImpl` |
| invoice dispatch orchestration | `ActivityPlanDispatchEventsServiceImpl` |
| sender and recipient derivation | `DomainDataServiceImpl` |
| sendgrid request construction | `EmailServiceImpl` |
| sendgrid transport | `SendGridApiWebClient` |
| decision hub lookup | `DecisionHubWebClient` |
| finance chassis pdf export | `FinanceChasisApiWebClient` |
| email-booking Mongo updates | `EventsDataServiceImpl` |
| event-history publish | `EventsHistoryProducer` |
