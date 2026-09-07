---
category: architecture
title: Modules and package map
summary: The repo is a single Maven service module with API, domain, events, integration, persistence, and Temporal workflow packages under `service/`.
primary_for: [email-service-modules]
mentions: [email-service-cross-cutting, email-service-stack, booking-email-dispatch]
scenarios: [email module map, email package tree, where email module lives, email module boundaries, email module ownership]
capabilities: [service-structure]
domains: [email-notification]
entities: [NotificationController, ActivityPlanEventsServiceImpl, TemporalWorker]
sources: [service/pom.xml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [architecture/cross-cutting.md, navigation/key-classes.md, stack/stack.md]
---
# Modules and package map

## Module split
- `service/pom.xml` defines the runnable microservice; no separate production submodules are declared in the repo root. (source: service/pom.xml:1)
- `componenttest/` is the only dedicated non-unit test module and contains its own Spring configuration and Kafka test helpers. (source: not derivable from trace)

## Package tree
```text
service/src/main/java/net/apmoller/crb/telikos/microservices/email/
├── api/controller
├── common/{constants,cqrs,dto,models,utilities}
├── domain/{activityplanevents,documentstorageservice,emailservice,eventsdataservice,eventshistoryservice,pdfservice,sendgridservice}
├── events/{config,mapper,producer}
├── integration/{config,constants,exception,models,service,webclient}
├── persistence/{config,eventsdata,eventshistorydata,repository}
└── workflow/{EmailWorkflow interface + temporal worker/activity impls under workflow/src/main/java/...}
```
(source: not derivable from trace)

## Layer ownership
- Controllers only accept REST payloads and hand off to Temporal or webhook commands; business orchestration lives under `domain/` and `workflow/`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java:24)
- `domain/activityplanevents` owns booking and invoice flow orchestration; `domain/emailservice` owns mail body construction, SendGrid delegation, and PDF/document-storage side effects. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanEventsServiceImpl.java:53)
- `integration/webclient` owns outbound REST calls; `events/producer` owns event-history publication; `persistence/*` owns Mongo repositories and retry envelopes. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/events/producer/EventsHistoryProducer.java:28)
