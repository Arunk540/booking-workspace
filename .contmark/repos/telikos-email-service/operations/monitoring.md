---
category: operations
title: Monitoring
summary: Monitoring is a mix of Micrometer counters around inbound/outbound email events, SendGrid success/failure metrics, actuator liveness/readiness probes, and package-scoped log levels.
primary_for: [email-service-monitoring]
mentions: [booking-email-dispatch, sendgrid-webhook-processing, email-event-history-kafka]
scenarios: [email monitoring setup, email metrics failing, why email metrics missing, email health probe, email logs location]
capabilities: [monitoring]
domains: [email-notification, operations]
entities: [Constants, EventsHistoryProducer, ActivityPlanEventsServiceImpl, application.yml]
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/constants/Constants.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/producer/EventsHistoryProducer.java, service/pom.xml]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [operations/retries.md, operations/failure-model.md]
---
# Monitoring

| Signal | Where it is emitted |
|---|---|
| `email.events.received` | Incremented when booking-event processing accepts a valid inbound activity-plan request. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:167) |
| `email.events.produced` | Incremented when event history publish succeeds for booking or invoice flows. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/producer/EventsHistoryProducer.java:63) |
| `telikos_email_sendgrid` | Incremented on SendGrid success/failure and booking-flow failure branches. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/constants/Constants.java:95) |
| Readiness/liveness | `/actuator/health/liveness` includes `diskSpace,ping,mongo`; readiness adds `readinessState`. (source: service/src/main/resources/application.yml:190) |
| Prometheus exposure | `health,info,prometheus` are exposed through actuator web endpoints. (source: service/src/main/resources/application.yml:200) |
| Logging | Package log level is `${LOG_LEVEL:INFO}` and the build brings in `telikos-logger` for structured service logging. (source: service/src/main/resources/application.yml:236) (source: service/pom.xml:65) |
