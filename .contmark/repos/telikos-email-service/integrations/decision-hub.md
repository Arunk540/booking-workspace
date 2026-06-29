---
category: integrations
title: Decision Hub
summary: Decision Hub is an outbound REST dependency used only for sender-email resolution when booking country appears in the configured country list and shipment direction can be derived from product name.
primary_for: [decision-hub-sender-resolution]
mentions: [booking-email-dispatch, email-runtime-flags]
scenarios: [decision hub sender, decision hub failing, why decision hub failed, resolve decision hub email, decision hub country routing]
capabilities: [sender-resolution]
domains: [email-notification]
entities: [DecisionHubWebClient, DecisionHubIamTokenCachingService, DomainDataServiceImpl]
peer_systems: [decision-hub]
direction: outbound
protocol: rest
topic_or_endpoint: ${DECISION_HUB_HOST}/${DECISION_HUB_RESOURCE}
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/DecisionHubWebClient.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/service/DecisionHubIamTokenCachingService.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [runtime/booking-email-flow.md, operations/flags-and-lists.md]
---
# Decision Hub

| Aspect | Behavior |
|---|---|
| Entry condition | `resolveFromEmail(...)` only calls Decision Hub when booking country matches `decision-hub-config-countries` and shipment direction resolves to `Export` or `Import`; otherwise it returns AGENT fallback email. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java:477) |
| Request shape | `DecisionHubWebClient.resolveGroupEmail` posts `GroupEmailRequestWrapper{country,direction}` to the configured resource. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/DecisionHubWebClient.java:42) |
| Auth | Authorization header is `Bearer <token>` from `DecisionHubIamTokenCachingService`; consumer key is sent as a dedicated header. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/DecisionHubWebClient.java:59) |
| Token cache | Decision Hub IAM tokens are cached for `spring.application.iam.cache.ttl`, which is `6000` seconds in application config. (source: service/src/main/resources/application.yml:69) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/service/DecisionHubIamTokenCachingService.java:19) |
| Failure impact | Empty or failed lookups do not fail the email flow; the caller logs and falls back to booking AGENT email. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/DecisionHubWebClient.java:72) |
