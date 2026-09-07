---
category: domain
title: activity plan aggregate
summary: ActivityPlan documents are the service's canonical milestone records for order lookup, workflow progress, errors, and retry metadata.
primary_for: [activity-plan-domain-model]
mentions: [activity-plan-query-api, activity-plan-mongo-schema]
scenarios:
  - activity plan fields
  - activity plan collection
  - activity plan status model
  - activity plan retry window
  - order activity plan lookup
capabilities: [activity-plan-tracking]
domains: [activity-plan, workflow-orchestration]
entities: [ActivityPlan]
sources:
  - persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java
  - persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoActivityPlanRepository.java
  - persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoReactiveActivityPlanRepositoryImpl.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - contracts/db-schemas.md
  - contracts/api-contracts.md
---

# Activity plan aggregate

- `ActivityPlan` is stored in Mongo collection `activityPlan`, making the document the persisted workflow ledger for this repo. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java:14)
- Core business keys are `orderId`, `bookingId`, `activityId`, and `activityName`; status and timing live in `activityStatus` and `activityDateTime`. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java:24)
- Operator attribution is stored as `userId` and `userName`, while `eventId` links AP rows back to upstream workflow or billing events. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java:28)
- Payload carry-through is kept in `domainData`, and failure detail is flattened into `detailedErrorMsgs`. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java:32)
- Long-running workflow tracking uses `workProcessStartDatetime` and `automatedRetryIntervalInMins`, which is why billing and retry docs should be read with this file. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/entity/ActivityPlan.java:35)
- Read patterns prove the aggregate is queried by order, booking plus activity name, booking plus activity id, and booking plus status-qualified activity variants. (source: persistence/src/main/java/net/apmoller/telikos/microservices/activityplan/persistence/service/MongoActivityPlanRepository.java:14)
