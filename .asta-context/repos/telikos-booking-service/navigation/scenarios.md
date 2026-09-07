---
category: navigation
title: scenario routing
summary: "Human-vocabulary lookup table for common booking tasks and the first mini-skills or classes to load."
primary_for: [booking-scenario-routing]
mentions: [triage-shortcuts, class-entry-hints, flow-file-shortcuts]
scenarios: [booking scenario routing, booking task lookup, rfp troubleshooting start, send to tms start, customs feedback start]
capabilities: [task-routing, starting-point-selection]
domains: [booking, navigation]
entities: [scenario map, runtime files, integration files]
sources:
  - runtime/rfp-flow.md
  - runtime/confirm-send-to-tms-flow.md
  - runtime/sap-tms-feedback-flow.md
  - runtime/customs-vessel-flow.md
  - contracts/api-contracts.md
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - navigation/key-classes.md
  - navigation/entry-points.md
  - runtime/event-activity-matrix.md
---

# Scenario routing

- New booking, amendment, or cancellation from service-plan Kafka → start with `runtime/rfp-flow.md`, then `runtime/event-activity-matrix.md`. (source: runtime/rfp-flow.md:1)
- Confirm booking API problems or SEND_TO_TMS validation issues → start with `runtime/confirm-send-to-tms-flow.md`, then `contracts/api-contracts.md`. (source: runtime/confirm-send-to-tms-flow.md:1)
- SAP ack or execution-status drift → start with `runtime/sap-tms-feedback-flow.md`, then `integrations/sap-tms.md`. (source: runtime/sap-tms-feedback-flow.md:1)
- Customs response or notification failures → start with `runtime/customs-vessel-flow.md`, then `integrations/customs.md`. (source: runtime/customs-vessel-flow.md:1)
- Vessel tracking, container availability, or NAM registration questions → start with `runtime/customs-vessel-flow.md`, then `integrations/vts.md` or `integrations/cams.md`. (source: runtime/customs-vessel-flow.md:1)
- Mongo collection shape or retry persistence questions → start with `contracts/db-schemas.md`, then `operations/retries.md`. (source: contracts/db-schemas.md:1)
