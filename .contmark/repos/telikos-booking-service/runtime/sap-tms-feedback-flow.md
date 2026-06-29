---
category: runtime
title: sap tms feedback handling
summary: "Inbound SAP feedback paths for transport-order acknowledgement and execution-status updates, including payload guards and workflow activity chains."
primary_for: [sap-tms-feedback-handling]
mentions: [transport-order-ack-processing, execution-status-update, sap-shared-consumers]
scenarios: [sap feedback topic, sap feedback guards, sap ack flow, sap execution flow, transport order feedback]
capabilities: [kafka-feedback-processing, sap-status-reconciliation]
domains: [booking, sap-tms]
entities: [SapFeedbackConsumerService, SapTmsExecutionStatusConsumerService, UpdateTransportOrderFeedbackDomainService]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - contracts/kafka-events.md
  - integrations/sap-tms.md
  - runtime/event-activity-matrix.md
---

# SAP TMS feedback handling

- Ack feedback starts on `${KAFKA_SAP_TMS_FEEDBACK_TOPIC}` through `SapFeedbackConsumerService.startKafkaConsumer`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:40)
- Ack payloads are rejected and acknowledged immediately when the Avro message, transport-order number, or derived booking number is missing. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:60)
- Valid ack messages are forwarded to `bookingEventOperationService.captureTransportEventFeedback`, which the trace maps to `UpdateTransportOrderFeedbackDomainService`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:85)
- `SAP_TMS_ACK_FEEDBACK` executes `updateTmsFeedbackAcknowledgement`, `updateSapTmsFeedBack`, `saveToAckFeedbackInServicePlanDB`, `sendServicePlanDetailsToAP`, and `sendEventToIomForToAck`. (source: service/src/main/resources/application.yml:379)
- Execution-status feedback starts on `${KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC}` through `SapTmsExecutionStatusConsumerService.startKafkaConsumer`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java:38)
- Execution-status payloads are dropped unless the carrier booking, transport plan, transport-order number, and transport legs are all present. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java:57)
- A second execution-status guard rejects invalid receive-channel data or work processes missing start datetimes before any downstream mutation occurs. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java:74)
- `SAP_TMS_EXECUTION_STATUS` then runs `processTmsExecution`, `updateTransportOrder`, `updateExecutionStatus`, and `sendEndBookingEventToIOM`. (source: service/src/main/resources/application.yml:385)
- Both SAP consumers use effectively infinite Kafka connection retry with ten-second fixed delay, so the steady-state recovery model is reconnect-not-crash. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:53)
