---
category: contracts
title: database schema and query shapes
summary: MongoDB stores AP milestones in `activityPlan`, with both reactive order queries and repository-based booking/activity probes.
primary_for: [activity-plan-mongo-schema]
mentions: [activity-plan-domain-model, activity-plan-failure-model]
scenarios:
  - activity plan mongo schema
  - activity plan collection keys
  - activity plan query shapes
  - booking activity lookup
  - activity plan delete path
capabilities: [mongo-contracts]
domains: [mongo, activity-plan]
entities: [ActivityPlan, MongoActivityPlanRepository, MongoReactiveActivityPlanRepositoryImpl]
sources:
  - persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java
  - persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoActivityPlanRepository.java
  - persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoReactiveActivityPlanRepositoryImpl.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - domain/activity-plan.md
  - contracts/api-contracts.md
---

# Database schema and query shapes

- Collection name is `activityPlan`, and each document includes workflow, user, error, and retry metadata fields. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java:14)
- Reactive order lookup uses `Criteria.where("orderId").is(orderId)` through `ReactiveMongoTemplate`. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoReactiveActivityPlanRepositoryImpl.java:27)
- Blocking repository methods support `bookingId + activityName`, `bookingId + activityName + activityStatus`, and `bookingId + activityId` access paths. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoActivityPlanRepository.java:14)
- Existence probes back cancellation, SDE, and billing branching through `existsByBookingId`, `existsByBookingIdAndActivityName`, and status-qualified exists checks. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoActivityPlanRepository.java:20)
- Cleanup is limited to `deleteByBookingIdAndActivityName`, so row-level removal is activity-scoped rather than order-scoped. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoActivityPlanRepository.java:27)
