---
category: integrations
title: SendGrid
summary: SendGrid is the outbound REST delivery system for booking emails, invoice dispatch, and notification mail; all variants post to `${SENDGRID_URL}` with bearer auth and return status plus category for downstream persistence.
primary_for: [sendgrid-email-delivery]
mentions: [booking-email-dispatch, invoice-dispatch-email-flow, notification-email-workflow, sendgrid-webhook-processing]
scenarios: [sendgrid email flow, sendgrid email failing, why sendgrid failed, sendgrid delivery retry, sendgrid category mapping]
capabilities: [sendgrid-delivery]
domains: [email-notification]
entities: [SendGridApiWebClient, Mail, SendGridEvent]
peer_systems: [sendgrid]
direction: outbound
protocol: rest
topic_or_endpoint: ${SENDGRID_URL}
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/SendGridApiWebClient.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [runtime/booking-email-flow.md, runtime/invoice-dispatch-flow.md, runtime/notification-workflow-flow.md]
---
# SendGrid

| Aspect | Behavior |
|---|---|
| Endpoint and auth | All mail variants call `webClient.post().uri(sendGridConfig.getSendGridApiUrl())` and set bearer auth from `sendGridConfig.getSendGridApiKey()`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/SendGridApiWebClient.java:60) |
| Booking and notification mail | `sendEmail(...)` and notification `EmailServiceImpl.sendEmailNotification(...)` share the same SendGrid client; the latter passes `activityPlanEvent=null` because it is not AP-driven. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/SendGridApiWebClient.java:45) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:128) |
| Vendor and invoice mail | Separate wrapper methods keep variant-specific logging but still return `SUCCESS,<category>` or `FAILED,<category>` strings for persistence logic. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/SendGridApiWebClient.java:110) |
| Category contract | Categories encode TELIKOS + order id + booking id + event id for booking/invoice mail; notification mail uses `TELIKOS-<bookingReferenceId>-emailNotification`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:145) |
| Retry and failure impact | SendGrid retries are `fixedDelay(${SENDGRID_RETRIES}, ${SENDGRID_DURATION}s)`; on terminal failure the client increments `telikos_email_sendgrid` failure metrics and returns `FAILED`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/SendGridApiWebClient.java:100) |
