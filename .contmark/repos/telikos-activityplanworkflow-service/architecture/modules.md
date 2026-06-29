---
category: architecture
title: module layout
summary: The repo is an eight-module Maven build with service wiring in `service` and workflow execution concentrated in `workflow` and `booking-domain`.
primary_for: [activity-plan-module-architecture]
mentions: [activity-plan-stack-profile, activity-plan-entry-points]
scenarios:
  - activity plan modules
  - module dependency map
  - activity plan build layout
  - workflow module ownership
  - service module wiring
capabilities: [repo-structure]
domains: [activity-plan, platform-architecture]
entities: [ActivityplanworkflowApplication, ActivityPlanWorkflowImplV2]
sources:
  - pom.xml
  - api/pom.xml
  - booking-domain/pom.xml
  - common/pom.xml
  - event/pom.xml
  - persistence/pom.xml
  - workflow/pom.xml
  - service/pom.xml
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - architecture/cross-cutting.md
  - stack/stack.md
---

# Module layout

| module | role | evidence |
|---|---|---|
| `service` | Spring Boot assembly module that depends on persistence, api, event, booking-domain, common, and workflow. | (source: service/pom.xml:27) |
| `api` | REST adapter module exposing controller and DTO mapping. | (source: api/pom.xml:19) |
| `booking-domain` | Business services for TMS, customs, event history, and AP domain orchestration. | (source: booking-domain/pom.xml:19) |
| `workflow` | Temporal SDK module with workflow implementations, workers, and activities. | (source: workflow/pom.xml:19) |
| `event` | Kafka and observability module with producers, consumers, and actuator dependencies. | (source: event/pom.xml:19) |
| `persistence` | MongoDB persistence layer with reactive and blocking repositories. | (source: persistence/pom.xml:19) |
| `common` | Shared DTO, constants, enums, and Avro generation support. | (source: common/pom.xml:19) |
| `billing-domain` | Placeholder jar module with no declared dependencies or source tree in this repo snapshot. | (source: billing-domain/pom.xml:12) |
