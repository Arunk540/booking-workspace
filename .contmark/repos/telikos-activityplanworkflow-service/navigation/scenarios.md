---
category: navigation
title: scenario router
summary: This file is the fastest human lookup from task wording to the mini-skill or source class that best explains the behavior.
primary_for: [activity-plan-scenario-navigation]
mentions: [activity-plan-entry-points, activity-plan-event-rules]
scenarios:
  - activity plan navigation
  - find activity plan flow
  - billing scenario lookup
  - customs scenario lookup
  - email scenario lookup
capabilities: [scenario-routing]
domains: [navigation]
entities: [ActivityPlanWorkflowImplV2, EventProcessorServiceImpl]
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/resources/domain-rules.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - runtime/rfp-tms-flow.md
  - navigation/key-classes.md
---

# Scenario router

| ask this | start here | why |
|---|---|---|
| ready for planning or send to tms | `runtime/rfp-tms-flow.md` | Covers task loading, AP persistence, TMS publish, and non-SAP billing branching. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:718) |
| booking cancelled or email ack | `runtime/cancellation-email-flow.md` | Explains cancellation validation, email queues, NAM bypass, and booking feedback. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:437) |
| billing feedback or invoice dispatch | `runtime/billing-flow.md` | Captures billing signal names, invoice dispatch, job closure, and booking feedback projection. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java:31) |
| customs or service delivery execution | `runtime/customs-sde-flow.md` | Explains customs milestone logic, SDE transitions, and FSD-to-billing handoff. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:747) |
| what tasks a booking event runs | `runtime/event-activity-matrix.md` | Connects `domain-rules.yml` task names to activity handlers. (source: workflow/src/main/resources/domain-rules.yml:1) |
