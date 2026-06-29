---
category: operations
title: failure model
summary: Failures are expressed as AP status transitions, workflow branching, Kafka send exceptions, and booking feedback fallbacks when downstream workflows are absent.
primary_for: [activity-plan-failure-model]
mentions: [activity-plan-retries, activity-plan-monitoring]
scenarios:
  - activity plan failures
  - status failure mapping
  - downstream workflow missing
  - kafka publish failure
  - email failure feedback
capabilities: [failure-analysis]
domains: [operations, activity-plan]
entities: [HelperUtils, KafkaProducerServiceImpl, EventProcessorServiceImpl]
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/utils/HelperUtils.java
  - event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - operations/retries.md
  - operations/monitoring.md
---

# Failure model

- `HelperUtils.getStatus` maps blank event type to `PENDING`, TMS/customs success to `CLOSED`, customs in-flight states to `IN_PROGRESS`, and other outcomes to `FAILED`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/utils/HelperUtils.java:48)
- TMS publish failure raises runtime exceptions after synchronous Kafka send errors, so the Temporal activity fails rather than silently dropping events. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:223)
- Customs synchronous send failures also throw runtime exceptions, preserving failure semantics for the calling Temporal activity. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:287)
- Email failure propagates through `sendAndReceiveEmailEvent`, where failed responses set `failedResponse = true` before booking feedback is emitted. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:935)
- If booking workflows are missing, AP retries delivery by starting a new booking workflow stub instead of discarding feedback or revenue updates. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:407)
