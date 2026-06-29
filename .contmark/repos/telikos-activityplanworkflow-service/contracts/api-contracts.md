---
category: contracts
title: api contracts
summary: The public API surface is a single JWT-protected order lookup endpoint that returns AP response DTOs and rejects order ids with non-alphanumeric punctuation.
primary_for: [activity-plan-query-api]
mentions: [activity-plan-domain-model, activity-plan-monitoring]
scenarios:
  - activity plan api
  - get activity plan order
  - activity plan response fields
  - invalid order id
  - swagger activity plan
capabilities: [rest-query]
domains: [activity-plan, api]
entities: [ActivityPlanController, ActivityPlanResponse]
sources:
  - api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/controller/ActivityPlanController.java
  - common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/constant/ActivityPlanConstants.java
  - api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/dto/ActivityPlanResponse.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/telikos/microservices/activityplan/ActivityplanworkflowApplication.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - domain/activity-plan.md
  - navigation/entry-points.md
---

# API contracts

- `GET /activity-plan/order/{order-id}` is the only controller entry point in this repo and returns `Flux<ActivityPlanResponse>` with HTTP 200. (source: api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/controller/ActivityPlanController.java:37)
- The endpoint reads optional header `X-Correlation-ID`, but lookup is keyed only by `orderId`. (source: api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/controller/ActivityPlanController.java:39)
- Order ids must match `^[a-zA-Z0-9.]*$`; invalid values raise `TELIKOS-CLIENTERROR` with message `Order ID should not contain any special character`. (source: common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/constant/ActivityPlanConstants.java:12)
- Response payload fields are `activityName`, `userId`, `userName`, `activityStatus`, `activityDateTime`, `detailedErrorMsgs`, and `automatedRetryIntervalInMins`. (source: api/src/main/java/net/apmoller/telikos/microservices/activityplan/api/dto/ActivityPlanResponse.java:17)
- The service advertises OpenAPI metadata and serves Swagger UI at `/swagger-ui.html`. (source: service/src/main/java/net/apmoller/telikos/microservices/activityplan/ActivityplanworkflowApplication.java:31)
