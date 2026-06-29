---
category: architecture
title: Cross-cutting behavior
summary: Cross-cutting concerns are reactive HTTP timeouts, OAuth2 resource-server security, Mongo retry configuration, Temporal worker bootstrap, and package-scoped logging and metrics.
primary_for: [email-service-cross-cutting]
mentions: [email-service-modules, email-runtime-flags, email-delivery-retries, notification-email-workflow]
scenarios: [email cross cutting, email security setup, email logging setup, email timeout setup, where email worker starts]
capabilities: [cross-cutting]
domains: [email-notification]
entities: [WebClientConfig, MongoDatabaseConfig, TemporalWorker]
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/config/WebClientConfig.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/config/MongoDatabaseConfig.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [operations/retries.md, operations/monitoring.md, stack/stack.md]
---
# Cross-cutting behavior

- Spring Security runs as an OAuth2 resource server with Azure AD and ForgeRock issuer and JWK configuration under `spring.security.oauth2.resource-server`. (source: service/src/main/resources/application.yml:45)
- Reactor `WebClient` builders inject read timeouts for SendGrid and read+connect timeouts for IAM, Finance Chassis, and Decision Hub; finance and decision-hub clients are base-URL scoped beans. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/config/WebClientConfig.java:15)
- Mongo retry knobs are externalized as `app.mongodb.retries` and `app.mongodb.duration`, then consumed by persistence services. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/persistence/config/MongoDatabaseConfig.java:8)
- Temporal worker bootstrap creates workers for the booking queue, invoice queue, and optionally the notification queue before calling `factory.start()`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java:53)
- Package logging level defaults to `INFO` via `${LOG_LEVEL:INFO}` for `net.apmoller.crb.telikos.microservices.email.*` and Spring packages. (source: service/src/main/resources/application.yml:236)
