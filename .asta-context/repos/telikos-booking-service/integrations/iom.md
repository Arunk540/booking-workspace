---
category: integrations
title: iom booking events
summary: "Outbound Booking-domain event publication to IOM for workflow start, end, and acknowledgement milestones."
primary_for: [iom-booking-publish]
mentions: [start-event-emission, end-event-emission, one-click-pruning]
scenarios: [iom booking topic, iom booking publish, booking start event, booking end event, iom ack event]
capabilities: [booking-event-publication, workflow-status-fanout]
domains: [booking, iom]
entities: [IomBookingEventDispatcher, Booking]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/IomBookingEventDispatcher.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - runtime/event-activity-matrix.md
  - contracts/kafka-events.md
  - operations/monitoring.md
peer_systems:
  - iom
direction: outbound
protocol: kafka
topic_or_endpoint: "KAFKA_BOOKING_TOPIC"
---

# IOM booking events

- IOM publication uses `${KAFKA_BOOKING_TOPIC}` under `audit.kafka.topic.iom-booking`. (source: service/src/main/resources/application.yml:214)
- `IomBookingEventDispatcher` publishes Booking-domain payloads and logs booking id plus service-plan number for each send. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/audit/dispatchers/IomBookingEventDispatcher.java:16)
- Start-event emission appears in READY_FOR_PLANNING, BOOKING_CONFIRMED, amendment, cancellation, SEND_TO_TMS, SEND_TO_EXECUTION, and UPDATE_TO activity lists through `sendStartBookingEventToIOM`. (source: service/src/main/resources/application.yml:315)
- End-event emission appears in ACTIVITYPLAN_FEEDBACK, SAP_TMS_EXECUTION_STATUS, CUSTOMS_UPDATE, SCM invoice feedback, and ack-specific flows through `sendEndBookingEventToIOM` or `sendEventToIomForToAck`. (source: service/src/main/resources/application.yml:329)
- One-click mode can remove intermediate IOM end/start activities from the queue so the customer-facing booking story looks continuous instead of multi-step. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:164)
