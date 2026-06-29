---
category: navigation
title: key classes
summary: These are the classes to open first when tracing request ingress, workflow routing, persistence, and downstream dispatch.
primary_for: [activity-plan-class-navigation]
mentions: [activity-plan-entry-points, activity-plan-module-architecture]
scenarios:
  - activity plan key classes
  - workflow class lookup
  - persistence class lookup
  - integration class lookup
  - controller class lookup
capabilities: [class-routing]
domains: [navigation]
entities: [ActivityPlanController, ActivityPlanWorkflowImplV2, EventProcessorServiceImpl, KafkaProducerServiceImpl]
sources:
  - api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/controller/ActivityPlanController.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
  - persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoReactiveActivityPlanRepositoryImpl.java
  - event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - navigation/entry-points.md
  - navigation/scenarios.md
---

# Key classes

| concern | class | why it matters |
|---|---|---|
| REST ingress | `ActivityPlanController` | Owns the only public HTTP route and the order-id validation gate. (source: api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/controller/ActivityPlanController.java:37) |
| workflow orchestration | `ActivityPlanWorkflowImplV2` | Central queue-based runtime for booking, billing, customs, email, and revenue tasks. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:117) |
| workflow bridge | `EventProcessorServiceImpl` | Starts or signals AP, billing, booking, invoice, and cost workflows. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:114) |
| persistence query | `MongoReactiveActivityPlanRepositoryImpl` | Implements order lookup and reactive save/find calls. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoReactiveActivityPlanRepositoryImpl.java:27) |
| kafka egress | `KafkaProducerServiceImpl` | Sends email, event history, TMS, and customs payloads while recording producer metrics. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:22) |
| worker registration | `TemporalWorker` | Registers V1/V2 workflows plus common and V2-only activities. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java:127) |
