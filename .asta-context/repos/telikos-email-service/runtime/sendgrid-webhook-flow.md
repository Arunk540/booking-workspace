---
category: runtime
title: SendGrid webhook flow
summary: `POST /events` forwards batched SendGrid events to a webhook service that filters TELIKOS categories, extracts order/booking/event ids from the category, updates Mongo email status, and republishes failed delivery states to event history.
primary_for: [sendgrid-webhook-processing]
mentions: [sendgrid-email-delivery, email-mongo-schemas, email-event-history-kafka]
scenarios: [sendgrid webhook flow, sendgrid webhook failing, why sendgrid webhook failed, process sendgrid webhook, which class handles sendgrid]
capabilities: [sendgrid-webhook]
domains: [email-notification]
entities: [SendGridEventWebhookController, SendGridWebhookServiceImpl, SendGridEvent, EmailBookingDetails]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/SendGridEventWebhookController.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/sendgridservice/SendGridWebhookServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [contracts/api-contracts.md, contracts/db-schemas.md, operations/failure-model.md]
---
# SendGrid webhook flow

## Variant Routing
| Trigger condition | Resolver path | Notes |
|---|---|---|
| Category missing or non-`TELIKOS` | ignore event | The filter only accepts `category[0]` values starting with `TELIKOS`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/sendgridservice/SendGridWebhookServiceImpl.java:61) |
| Accepted delivery event | update Mongo only | Status and message are written back to the matching `EmailData` record. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:340) |
| `deferred`, `dropped`, or `bounced` | update Mongo + publish event history | Failure-like webhook states are propagated downstream. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:389) |

## Chain
1. `SendGridEventWebhookController.receiveSgEventHook` logs each posted event category and delegates the full list to `AcceptSendGridEventsCommand.apply`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/SendGridEventWebhookController.java:29) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/sendgridservice/AcceptSendGridEventsCommand.java:14)
2. `SendGridWebhookServiceImpl.processSendGridEventsData` parallel-filters accepted events, strips the `TELIKOS-` prefix, then splits category into `orderId-bookingId-eventId`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/sendgridservice/SendGridWebhookServiceImpl.java:36)
3. `EventsDataServiceImpl.updateEmailBookingDetailsForSendGridEvents` fetches `EmailBookingDetails` by `orderId`, finds matching `EventsData.eventId` and `EmailData.emailId`, and updates status, timestamp, and failure message. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:284) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:354)
4. For `deferred`, message comes from `response`; for other webhook failures, message comes from `reason`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:367)
5. If the webhook event is `deferred`, `dropped`, or `bounced`, the service rebuilds an `ActivityPlanEvent` and republishes it through `eventsHistoryGateway.publishEventHistory(...)`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/eventsdata/EventsDataServiceImpl.java:389)
