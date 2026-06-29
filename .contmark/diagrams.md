---
category: navigation
title: Workspace whole-picture
summary: >
  Complete cross-repo map of booking-workspace — the three services, their entry surfaces,
  external systems, and the temporal-signal contracts that connect them. Generated FROM the
  mini-skills (navigation/entry-points + integrations) and _global_links.json; never hand-authored.
generated_from:
  - repos/*/navigation/entry-points.md
  - repos/*/integrations/*.md
  - _global_links.json
  - workspace.yml (cross_repo_contracts, cycle_breaks)
repos: [telikos-booking-service, telikos-activityplanworkflow-service, telikos-email-service]
last_generated: "2026-06-26"
---

# booking-workspace — whole-system picture

> Agent-readable orientation map for architecture / cross-system / blast-radius tasks. Every node maps
> to a real `(source: path:line)` (see **Source map**). Routing source of truth stays
> `resolve-task.js` + the mini-skills — this diagram augments, never replaces, them.

## 1. Cross-repo system map (who connects to whom)

```mermaid
flowchart LR
  Client([REST clients])

  subgraph BOOK["telikos-booking-service-1 — booking, service-plan, customs"]
    B_REST["BookingController<br/>REST /bookings/*"]
    B_KAFKA["Kafka consumers<br/>service-plan · sap-tms · customs · container-avail"]
    B_WF["BookingEventsWorkflow<br/>(Temporal)"]
  end

  subgraph AP["telikos-activityplanworkflow-service_02 — workflow, billing"]
    AP_REST["ActivityPlanController<br/>GET /activity-plan/order/{id}"]
    AP_WF["TemporalWorker V1/V2<br/>activityplan.taskQueue"]
    AP_BILL["Billing workers<br/>billingTaskQueue · feedback"]
    AP_BKWK["BookingWorker<br/>bookingWorkerTaskQueue"]
  end

  subgraph EMAIL["telikos-email-service-02 — notifications"]
    E_REST["NotificationController<br/>POST /notifications/email"]
    E_HOOK["SendGridEventWebhookController<br/>POST /events"]
    E_CONF["SendEmailConfirmationActivityImpl"]
    E_INV["SendInvoiceDispatchActivityImpl"]
    E_WF["EmailWorkflow"]
  end

  %% external systems
  SAPTMS[(SAP-TMS)]:::ext
  CAMS[(CAMS)]:::ext
  CUSTOMS[(Customs)]:::ext
  IOM[(IOM)]:::ext
  VTS[(VTS)]:::ext
  BILLING[(Billing)]:::ext
  SENDGRID[(SendGrid)]:::ext
  DHUB[(Decision Hub)]:::ext
  DOCS[(Document Storage)]:::ext

  Client --> B_REST
  Client --> AP_REST
  Client --> E_REST
  SENDGRID -->|webhooks| E_HOOK

  %% cross-repo temporal-signal contracts (from _global_links.json)
  B_WF ==>|"TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE<br/>ActivityPlanInternal.v2.avsc"| AP_WF
  AP_BILL ==>|"EMAIL_TASK_QUEUE<br/>ActivityPlanInternal.v2.avsc"| E_CONF
  AP_BILL ==>|"EMAIL_TASK_QUEUE_INVOICE_DISPATCH"| E_INV
  AP_BKWK -.->|"BOOKING_WORKER_TASK_QUEUE<br/>(cycle-break back-edge)"| B_WF

  %% external integrations
  B_KAFKA <--> SAPTMS
  B_REST <--> CAMS
  B_KAFKA <--> CUSTOMS
  B_REST <--> IOM
  B_WF <--> VTS
  AP_BILL <--> BILLING
  AP_REST <--> CUSTOMS
  E_CONF --> SENDGRID
  E_INV --> SENDGRID
  E_WF <--> DHUB
  E_WF <--> DOCS

  classDef ext fill:#f5f5f5,stroke:#999,stroke-dasharray:3 3,color:#333;
```

**Reading it:** thick `==>` edges are the cross-repo temporal-signal contracts the resolver tracks for
blast-radius; the dotted `-.->` edge is the AP→booking feedback loop **broken out of the topo order**
(`cycle_breaks` in `workspace.yml`) but still honoured by the Reviewer. Topo order:
`booking → activityplan → email`.

## 2. Canonical cross-repo flow — invoice-dispatch email (touches all 3)

```mermaid
sequenceDiagram
  participant C as Client
  participant B as booking-service
  participant A as activityplan-service
  participant E as email-service
  participant SG as SendGrid

  C->>B: PATCH /bookings/{id}/send-to-tms
  B->>A: signal TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE<br/>(ActivityPlanInternal.v2.avsc)
  A->>A: ActivityPlanWorkflowImplV2 → BillingProducerWorker2
  A->>E: signal EMAIL_TASK_QUEUE_INVOICE_DISPATCH
  E->>E: SendInvoiceDispatchActivityImpl.sendInvoice
  E->>SG: dispatch invoice email
  SG-->>E: delivery webhook (POST /events)
  A-->>B: signal BOOKING_WORKER_TASK_QUEUE (feedback, cycle-break)
```

## 3. Source map (every node → verified source:line)

| Node | Repo | Source |
|---|---|---|
| BookingController REST | booking | `service/.../api/controller/BookingController.java:102` |
| Kafka consumers | booking | `service/.../events/consumer/KafkaConsumerService.java:36`, `CustomsServiceOrderConsumer.java:27` |
| BookingEventsWorkflow | booking | `service/.../temporal/workflow/BookingEventsWorkflow.java:12` |
| ActivityPlanController | activityplan | `api/.../controller/ActivityPlanController.java:37` |
| TemporalWorker V1/V2 | activityplan | `workflow/.../worker/TemporalWorker.java:132` (V1), `:137` (V2) |
| Billing workers | activityplan | `workflow/.../worker/BillingProducerWorker.java:16`, `BillingProducerWorker2.java:16`, `BillingWorker.java:31` |
| BookingWorker | activityplan | `workflow/.../worker/BookingWorker.java:17` |
| NotificationController | email | `service/.../api/controller/NotificationController.java:37` |
| SendGridEventWebhookController | email | `service/.../api/controller/SendGridEventWebhookController.java:29` |
| SendEmailConfirmationActivityImpl | email | `.../workflow/activity/SendEmailConfirmationActivityImpl.java:20` |
| SendInvoiceDispatchActivityImpl | email | `.../workflow/activity/SendInvoiceDispatchActivityImpl.java:17` |
| EmailWorkflow | email | `service/.../email/workflow/EmailWorkflow.java:12` |

**Cross-repo contracts** (from `_global_links.json` / `workspace.yml`):

| Topic | Producer → Consumer | Schema |
|---|---|---|
| `TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE` | booking → activityplan | `ActivityPlanInternal.v2.avsc` |
| `EMAIL_TASK_QUEUE` | activityplan → email | `ActivityPlanInternal.v2.avsc` |
| `EMAIL_TASK_QUEUE_INVOICE_DISPATCH` | activityplan → email | _(no avsc — POJO signal)_ |
| `BOOKING_WORKER_TASK_QUEUE` | activityplan → booking | _(cycle-break back-edge)_ |

> Regenerate this file whenever the underlying `navigation/entry-points.md`, `integrations/*`, or
> `_global_links.json` change (the drift ledger triggers it) — it then stays in lock-step with the
> agent's truth.
