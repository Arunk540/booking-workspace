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
  - booking business exception
  - rfp milestone failed
capabilities: [failure-analysis]
domains: [operations, activity-plan]
entities: [HelperUtils, KafkaProducerServiceImpl, EventProcessorServiceImpl, BusinessException]
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/utils/HelperUtils.java
  - event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/dto/Booking.java
verified_against: a5fbe3845803a0a11d5f55773a966014b0596e2e
last_updated: 2026-08-11
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
- Booking-side business failures arrive as DATA, not as an error: `ServicePlan.booking.businessExceptions[]` carries them and `HelperUtils.businessExceptionMessages` flattens their `exceptionName` values onto the milestone, returning `null` rather than an empty list when there are none. A booking can therefore fail its milestone while the AP event itself is a perfectly successful message. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/utils/HelperUtils.java:234) (source: common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/dto/Booking.java:51)
- `HelperUtils.resolveRfpStatus` turns that into the Ready-for-Planning milestone status: `FAILED` when the booking failed it, otherwise `CLOSED`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/utils/HelperUtils.java:255)
