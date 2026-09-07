---
category: architecture
title: cross-cutting execution model
summary: The service combines WebFlux ingress, Temporal orchestration, Kafka producers, Mongo persistence, and Azure AD secured APIs.
primary_for: [activity-plan-cross-cutting-architecture]
mentions: [activity-plan-module-architecture, activity-plan-operational-model]
scenarios:
  - activity plan architecture
  - temporal and kafka wiring
  - activity plan security model
  - mongo and workflow coupling
  - versioned worker rollout
capabilities: [cross-cutting-design]
domains: [activity-plan, workflow-orchestration, integration-architecture]
entities: [ActivityplanworkflowApplication, TemporalWorker, TemporalClientConfig]
sources:
  - service/src/main/java/net/apmoller/telikos/microservices/activityplan/ActivityplanworkflowApplication.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/config/TemporalClientConfig.java
  - service/src/main/resources/application.yml
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - stack/stack.md
  - operations/flags-and-lists.md
---

# Cross-cutting execution model

- The boot app imports Mongo config, Kafka config, Temporal client config, and the REST controller into one Spring Boot runtime. (source: service/src/main/java/net/apmoller/telikos/microservices/activityplan/ActivityplanworkflowApplication.java:38)
- API traffic is WebFlux-based and secured with bearer JWT validation backed by Azure issuer, JWK, and audience properties. (source: service/src/main/resources/application.yml:14)
- Temporal client creation supports mTLS with PKCS8 conversion before creating the namespace-scoped `WorkflowClient`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/config/TemporalClientConfig.java:34)
- `TemporalWorker` runs both the deprecated queue worker and the V2 worker, and can attach a Temporal build id when versioning is enabled. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java:127)
- Kafka is split between dedicated producer topics for TMS and event history, plus a shared bootstrap for customs producers. (source: service/src/main/resources/application.yml:67)
- Mongo access is dual-mode: Spring Data repositories for blocking lookups and `ReactiveMongoTemplate` for order query flows. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoActivityPlanRepository.java:12)
