---
category: navigation
title: entry points
summary: The repo is entered through one REST query path, Temporal workflow queues for V1 and V2, and three outbound-facing worker queues for booking and billing feedback loops.
primary_for: [activity-plan-entry-points]
mentions: [activity-plan-query-api, activity-plan-billing-integration]
scenarios:
  - activity plan entry points
  - activity plan queue map
  - rest order endpoint
  - billing feedback worker
  - booking signal worker
capabilities: [entry-point-navigation]
domains: [navigation, workflow-orchestration]
entities: [ActivityPlanController, TemporalWorker, BillingWorker, BillingProducerWorker, BillingProducerWorker2, BookingWorker]
sources:
  - api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/controller/ActivityPlanController.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingWorker.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingProducerWorker.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingProducerWorker2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BookingWorker.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - navigation/key-classes.md
  - contracts/api-contracts.md
---

# Entry points

| surface | class | queue or route | evidence |
|---|---|---|---|
| REST order query | `ActivityPlanController#getByOrderId` | `GET /activity-plan/order/{order-id}` | (source: api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/controller/ActivityPlanController.java:37) |
| Temporal V1 worker | `TemporalWorker` | `activityplan.taskQueue` -> `ActivityPlanWorkflowImpl` | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java:132) |
| Temporal V2 worker | `TemporalWorker` | `activityplan.secondTaskQueue` -> `ActivityPlanWorkflowImplV2` | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/TemporalWorker.java:137) |
| Billing feedback worker | `BillingWorker` | `activityplan.biilingFeedbackQueue` with `BillingFeedbackActivityImpl` | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingWorker.java:31) |
| Billing producer worker | `BillingProducerWorker` | `activityplan.billingTaskQueue` | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingProducerWorker.java:16) |
| Billing producer worker v2 | `BillingProducerWorker2` | `activityplan.billingSecondTaskQueue` | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingProducerWorker2.java:16) |
| Booking feedback worker | `BookingWorker` | `activityplan.bookingWorkerTaskQueue` | (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BookingWorker.java:17) |
