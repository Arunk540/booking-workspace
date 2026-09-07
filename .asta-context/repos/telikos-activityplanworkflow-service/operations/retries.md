---
category: operations
title: retry model
summary: Retry behavior spans Temporal activity defaults, queue-specific email retries, Kafka consumer backoff, and persisted AP retry metadata.
primary_for: [activity-plan-retries]
mentions: [activity-plan-failure-model, activity-plan-billing-integration]
scenarios:
  - activity plan retries
  - temporal activity backoff
  - email retry timeout
  - kafka retry backoff
  - retry metadata field
capabilities: [retry-analysis]
domains: [operations, temporal, kafka]
entities: [ActivityStub, ActivityPlanWorkflowImplV2, KafkaConfiguration, ActivityPlan]
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityStub.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaConfiguration.java
  - service/src/main/resources/application.yml
  - persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - operations/failure-model.md
  - contracts/db-schemas.md
---

# Retry model

- Default Temporal activity options use initial interval `1s`, backoff coefficient `2.0`, maximum interval `2h`, and `startToCloseTimeout` `2h`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityStub.java:16)
- Queue-specific feedback/email activities override that with `10` minute timeout and `20` second initial retry interval. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:97)
- Kafka listener retry is controlled by `DefaultErrorHandler` plus `ExponentialBackOff(backoffIntervalMs, backoffMultiplier)`. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaConfiguration.java:241)
- Backoff properties are externally configured as `spring.kafka.retry-backoff.interval-ms` and `multiplier`. (source: service/src/main/resources/application.yml:29)
- AP documents persist `automatedRetryIntervalInMins`, so retry cadence can be reflected back in order lookup responses. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java:35)
