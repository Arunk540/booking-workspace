---
category: operations
title: monitoring and observability
summary: The service exposes actuator health groups, Prometheus metrics, Swagger, and a trace-id MDC convention across workflow and Kafka paths.
primary_for: [activity-plan-monitoring]
mentions: [activity-plan-failure-model, activity-plan-query-api]
scenarios:
  - activity plan metrics
  - readiness liveness checks
  - swagger activity plan
  - client trace id
  - kafka temporal observability
capabilities: [observability]
domains: [operations, monitoring]
entities: [MicroMeterConstants, ActivityplanworkflowApplication]
sources:
  - common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/constant/MicroMeterConstants.java
  - common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/constant/Constants.java
  - service/src/main/resources/application.yml
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - operations/failure-model.md
  - contracts/api-contracts.md
---

# Monitoring and observability

- Named metrics include `telikos.activityplan.bookings.received`, `activityplan.event.receive.failed`, `telikos.activityplan.email.request`, `activityplan.event.history.sent`, and `activityplan.tms.event.sent`. (source: common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/constant/MicroMeterConstants.java:22)
- Health endpoints expose `health`, `info`, and `prometheus`, with liveness including `diskSpace`, `ping`, and `mongo`, and readiness including `readinessState`, `diskSpace`, `ping`, and `mongo`. (source: service/src/main/resources/application.yml:122)
- Swagger UI is published at `/swagger-ui.html`. (source: service/src/main/resources/application.yml:193)
- MDC and trace propagation use key `client-traceid`. (source: common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/constant/Constants.java:76)
- Event consumer micrometer tagging uses custom tag `customConsumerTag` and metric family `activity-plan-workflow-consumer-metrics`. (source: common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/constant/MicroMeterConstants.java:20)
