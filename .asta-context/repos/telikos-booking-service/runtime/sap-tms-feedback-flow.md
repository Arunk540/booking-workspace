---
category: runtime
title: sap tms feedback handling
summary: "Inbound SAP feedback paths for transport-order acknowledgement and execution-status updates, including payload guards and workflow activity chains."
primary_for: [sap-tms-feedback-handling]
mentions: [transport-order-ack-processing, execution-status-update, sap-shared-consumers]
scenarios: [sap feedback topic, sap feedback guards, sap ack flow, sap execution flow, transport order feedback]
capabilities: [kafka-feedback-processing, sap-status-reconciliation]
domains: [booking, sap-tms]
entities: [SapFeedbackConsumerService, SapTmsExecutionStatusConsumerService, UpdateTransportOrderFeedbackDomainService, UpdateTmsFeedbackAcknowledgementImpl, UpdateExecutionStatusActivityImpl, UpdateFeedbackActivityImpl]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateTmsFeedbackAcknowledgementImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateExecutionStatusActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateFeedbackActivityImpl.java
verified_against: cf8cb392d09686d16ba800291da20d5644191555
last_updated: "2026-11-03"
related:
  - contracts/kafka-events.md
  - integrations/sap-tms.md
  - runtime/event-activity-matrix.md
---

# SAP TMS feedback handling

- Ack feedback starts on `${KAFKA_SAP_TMS_FEEDBACK_TOPIC}` through `SapFeedbackConsumerService.startKafkaConsumer`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:40)
- Ack payloads are rejected and acknowledged immediately when the Avro message, transport-order number, or derived booking number is missing. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:60)
- Valid ack messages are forwarded to `bookingEventOperationService.captureTransportEventFeedback`, which the trace maps to `UpdateTransportOrderFeedbackDomainService`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:85)
- `SAP_TMS_ACK_FEEDBACK` executes `UpdateTmsFeedbackAcknowledgementImpl.updateTmsFeedbackAcknowledgement`, `updateSapTmsFeedBack`, `saveToAckFeedbackInServicePlanDB`, `sendServicePlanDetailsToAP`, and `sendEventToIomForToAck`. (source: service/src/main/resources/application.yml:386)
- `UpdateTmsFeedbackAcknowledgementImpl` rejects the ack when the inbound transport-order version is not greater than the stored one (`checkVersionInRequestIsLessThanDb`), so an out-of-order/duplicate SAP ack cannot roll the acknowledgement state backward. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateTmsFeedbackAcknowledgementImpl.java:40)
- `UpdateFeedbackActivityImpl` (the `ACTIVITYPLAN_FEEDBACK` activity behind `updateBookingFeedbackInDB`) also calls `TmsCountryValidator` to decide SAP-vs-execution routing on feedback close-out — see `operations/flags-and-lists.md` for the BOOKING_COUNTRY fallback it shares with cancellation and amend. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateFeedbackActivityImpl.java:30)
- Execution-status feedback starts on `${KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC}` through `SapTmsExecutionStatusConsumerService.startKafkaConsumer`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java:38)
- Execution-status payloads are dropped unless the carrier booking, transport plan, transport-order number, and transport legs are all present. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java:57)
- A second execution-status guard rejects invalid receive-channel data or work processes missing start datetimes before any downstream mutation occurs. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java:74)
- `SAP_TMS_EXECUTION_STATUS` then runs `processTmsExecution`, `updateTransportOrder`, `UpdateExecutionStatusActivityImpl.updateExecutionStatus`, and `sendEndBookingEventToIOM`. (source: service/src/main/resources/application.yml:392)
- `UpdateExecutionStatusActivityImpl.updateExecutionStatus` closes the workflow early (`closeWorkFlow=true`) if the service plan's booking has no work processes, instead of calling the infra update with an empty set. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateExecutionStatusActivityImpl.java:21)
- Both SAP consumers use effectively infinite Kafka connection retry with ten-second fixed delay, so the steady-state recovery model is reconnect-not-crash. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java:53)

## Mapping Chain

MapStruct/hand-written mappers fail silently — an unmapped field compiles green and drops data. A field added to this flow must touch every hop below.

| Hop | Mapper | From → To | Source |
|---|---|---|---|
| ingest | `TransportOrderFeedbackAvroMapper` | Avro feedback → domain | events/mapper/ · used by events/service/BookingEventOperationService.java |
| ingest | `SapTmsExecutionStatusTransportOrderMapper` | execution status → TO update | events/mapper/ · used by events/service/BookingEventOperationService.java |
| persist | `TransportOrderMapper` | domain TO → entity | infrastructure/mapper/ · used by infrastructure/service/TransportOrderInfraService.java |
| audit | `SapTmsExecutionStatusEventHistoryMapper` | event → history record | events/audit/mappers/categories/ · via events/audit/dispatchers/* |
