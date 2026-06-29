---
category: integrations
title: email service integration
summary: AP dispatches booking and invoice notification requests to environment-selected Temporal email queues, then consumes acknowledgement through workflow callback methods.
primary_for: [activity-plan-email-integration]
mentions: [activity-plan-cancellation-email-runtime, activity-plan-flags-lists]
scenarios:
  - activity plan email queue
  - invoice email dispatch
  - activity plan email ack
  - nam email bypass
  - email queue routing
capabilities: [email-dispatch, email-acknowledgement]
domains: [email-notification, activity-plan]
entities: [ActivityPlanWorkflowImplV2, ActivityPlanWorkflow]
peer_systems: [telikos-email-service-02]
direction: outbound
protocol: temporal-signal
topic_or_endpoint: EMAIL_QUEUE
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - runtime/cancellation-email-flow.md
  - operations/flags-and-lists.md
---

# Email service integration

- `sendEventForEmail` selects `${EMAIL_TASK_QUEUE_INVOICE_DISPATCH}` only for `INVOICE_DISPATCH`; all other events use `${EMAIL_QUEUE}`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:1052)
- The invoked activity name is `sendInvoice` for invoice dispatch and `sendEmail` for all other email cases. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:1062)
- AP records email completion through the workflow callback method `receiveEmail(...)`, which is also declared on the workflow interface. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflow.java:19)
- Non-NAM flows execute `RECEIVE_EMAIL_ACTIVITY`, while NAM countries short-circuit to synthetic `SUCCESS` status before booking feedback. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:941)
