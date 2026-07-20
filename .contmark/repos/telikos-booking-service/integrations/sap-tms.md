---
category: integrations
title: sap tms exchange
summary: "Business exchange with SAP TMS: outbound SEND_TO_TMS initiation from booking and inbound Kafka feedback/execution events from SAP."
primary_for: [sap-tms-exchange]
mentions: [sap-country-gating, ack-feedback-processing, execution-status-processing]
scenarios: [sap exchange routing, sap exchange feedback, sap tms execution, send to sap tms, sap exchange topics]
capabilities: [sap-integration-mapping, feedback-reconciliation]
domains: [booking, sap-tms]
entities: [BookingSendToTmsDomainService, SapFeedbackConsumerService, SapTmsExecutionStatusConsumerService]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/BookingSendToTmsDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/mapper/SapTmsExecutionStatusTransportOrderMapper.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessTmsExecutionImpl.java
  - service/src/main/resources/application.yml
verified_against: da20d26b87ae304ae28736fcce66794fcb3155cc
last_updated: "2026-07-20T12:30:00.000+05:30"
related:
  - runtime/confirm-send-to-tms-flow.md
  - runtime/sap-tms-feedback-flow.md
  - operations/flags-and-lists.md
peer_systems:
  - sap-tms
direction: bidirectional
protocol: kafka
topic_or_endpoint: "KAFKA_SAP_TMS_FEEDBACK_TOPIC + KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC"
---

# SAP TMS exchange

- Outbound business initiation starts at `POST /bookings/{bookingId}/send-to-tms`, which validates country/status and emits the `SEND_TO_TMS` workflow event. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/BookingSendToTmsDomainService.java:43)
- `ProcessSendToTmsImpl` is the last in-repo branching point before downstream TMS handling and chooses SAP-vs-non-SAP side effects together with NAM CAMS/VTS registration inserts. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java:39)
- Inbound acknowledgement feedback arrives on `${KAFKA_SAP_TMS_FEEDBACK_TOPIC}` and is processed by `SapFeedbackConsumerService`. (source: service/src/main/resources/application.yml:155)
- Inbound execution-status feedback arrives on `${KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC}` and is processed by `SapTmsExecutionStatusConsumerService`. (source: service/src/main/resources/application.yml:168)
- Ack feedback reconciles transport-order acknowledgement state and then republishes AP and IOM ack events through the `SAP_TMS_ACK_FEEDBACK` activity list. (source: service/src/main/resources/application.yml:379)
- Execution-status feedback updates transport-order and execution status state, then sends an IOM end event through the `SAP_TMS_EXECUTION_STATUS` activity list. (source: service/src/main/resources/application.yml:385)
- `SapTmsExecutionStatusTransportOrderMapper` now maps each inbound `workProcessStatus` to a typed `WorkProcessStatus` (name enum + start/end datetimes + status code) and splits them into leg-level vs plan-level lists: a `"ContainerExecutionStatus"` status is added to the plan-level list and also drives `mapTransportPlanStatus`, everything else stays leg-level. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/mapper/SapTmsExecutionStatusTransportOrderMapper.java)
- `ProcessTmsExecutionImpl` extracts the plan-level `CONTAINER_DELIVERY_EXECUTION` work process (skipping spec-only entries with no `workProcessStatus`) and, only when that status becomes `EXECUTED`, captures the final-destination ATA once — it is never overridden by later execution-status messages. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessTmsExecutionImpl.java)
