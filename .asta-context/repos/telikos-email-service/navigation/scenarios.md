---
category: navigation
title: Scenario routing
summary: User-facing scenarios map directly to the controller, worker, or orchestration method that should be opened first.
primary_for: [email-scenario-routing]
mentions: [email-entry-points, booking-email-dispatch, invoice-dispatch-email-flow, notification-email-workflow, sendgrid-webhook-processing]
scenarios: [email scenario routing, where email bug starts, first place for email, email flow lookup, email issue routing]
capabilities: [navigation]
domains: [email-notification]
entities: [NotificationController, ActivityPlanEventsServiceImpl, ActivityPlanDispatchEventsServiceImpl, SendGridWebhookServiceImpl]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/sendgridservice/SendGridWebhookServiceImpl.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [navigation/entry-points.md, navigation/key-classes.md]
---
# Scenario routing

| Task phrase | Start here |
|---|---|
| booking confirmation email failing | `ActivityPlanEventsServiceImpl.processActivityPlanEvent` |
| send documents mail missing attachment | `ActivityPlanEventsServiceImpl.getDocumentsFromDocumentStorage` |
| vendor email grouping wrong | `DomainDataServiceImpl.getVendorToContainerMap` |
| invoice dispatch wrong recipient | `ActivityPlanDispatchEventsServiceImpl.processDownloadInvoiceDetailsAndSendEmail` |
| notification api did nothing | `NotificationController.sendEmailNotification` |
| workflow signal never executes | `EmailWorkflowImpl.signalFromBooking` |
| sendgrid webhook not updating status | `SendGridWebhookServiceImpl.processSendGridEventsData` |
| bounced email not in history | `EventsDataServiceImpl.publishUpdatedDataToEventHistory` |
