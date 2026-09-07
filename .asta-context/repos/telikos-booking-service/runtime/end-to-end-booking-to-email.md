---
category: runtime
title: End-to-end chain across the three services
summary: "The full path a booking takes across booking-service, activityplanworkflow-service and email-service, naming every cross-repo hop, its queue and its schema."
primary_for: [cross-repo-booking-chain]
mentions: [rfp-variant-routing, activity-plan-email-events, sap-tms-dispatch, booking-feedback-loop]
scenarios: [trace a booking end to end, trace a booking from ready for planning to the customer email, what happens after ready for planning, which services are involved in a booking, cross repo flow, who consumes ActivityPlanInternal, what consumes the activity plan schema, end to end booking flow, how do the three services talk, blast radius of a schema change]
capabilities: [cross-repo-tracing, impact-analysis]
domains: [booking, activity-plan, email-notification]
entities: [ActivityPlanInternal, TransportOrder, BookingActivity]
sources:
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
verified_against: 6ee7d83b6e6a427b680025a1758a40ab4775acca
last_updated: "2026-08-11"
related:
  - runtime/rfp-flow.md
  - integrations/ap-temporal.md
  - contracts/kafka-events.md
---

# End-to-end: booking → activity plan → email

Three services, and **every hop between them is a Temporal signal, not Kafka** — Kafka is how work
*enters* booking-service and how the transport order *leaves* for SAP TMS, but the internal chain is
Temporal task queues. Reasoning about a cross-repo change as if it were a topic is the mistake this
exists to prevent.

```
  Kafka (service-plan)
        │
        ▼
  telikos-booking-service          RFP ingress, workflow start, TO/SO creation
        │  TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE      schema: ActivityPlanInternal.v2.avsc
        ▼
  telikos-activityplanworkflow-service     milestones, billing, customs, TMS dispatch
        │                    │                        │
        │ EMAIL_TASK_QUEUE   │ EMAIL_TASK_QUEUE_      │ TMS_TOPIC (Kafka, outbound)
        │ EMAIL_TASK_QUEUE_  │ INVOICE_DISPATCH       │ schema: TransportOrder.v9.avsc
        ▼                    ▼                        ▼
  telikos-email-service                          SAP TMS (external)
        │
        └── feedback ──► BOOKING_WORKER_TASK_QUEUE ──► telikos-booking-service
```

## The four internal contracts

| Queue | Producer | Consumer | Schema |
|---|---|---|---|
| `TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE` | booking-service | activityplanworkflow | `ActivityPlanInternal.v2.avsc` |
| `EMAIL_TASK_QUEUE` | activityplanworkflow | email-service | `ActivityPlanInternal.v2.avsc` |
| `EMAIL_TASK_QUEUE_INVOICE_DISPATCH` | activityplanworkflow | email-service | — |
| `BOOKING_WORKER_TASK_QUEUE` | activityplanworkflow | booking-service | — |

(source: `.contmark/_global_links.json`, derived from source by `generate-links.js`)

**`ActivityPlanInternal.v2.avsc` is consumed by two repos**, so a field added to it is a
three-repo change: activityplanworkflow reads it from booking, and email-service reads it again from
activityplanworkflow. There is no REST between any of these services — 0 internal REST edges.

## Reading it the other direction

- A change to `TransportOrder.v9.avsc` affects activityplanworkflow and **SAP TMS**, which is
  outside this workspace and cannot be checked by running anything here.
- A change to `ActivityPlanInternal.v2.avsc` affects all three repos in this workspace.
- A change confined to email rendering affects only email-service — the queues carry the event, not
  the rendered message.
