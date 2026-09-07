---
category: runtime
title: event activity matrix
summary: "Ordered activity matrix for the booking workflow events defined in configuration, plus the Temporal queue behaviors that alter execution."
primary_for: [booking-event-activity-matrix]
mentions: [one-click-queue-pruning, continue-as-new-threshold, activity-ordering]
scenarios: [booking activity matrix, booking event order, workflow activity order, one click queue, temporal continue as new]
capabilities: [workflow-sequencing, event-to-activity-lookup]
domains: [booking, workflow-orchestration]
entities: [BookingEventsWorkflowImplementation, ActivitiesConfig]
sources:
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - runtime/rfp-flow.md
  - runtime/confirm-send-to-tms-flow.md
  - runtime/sap-tms-feedback-flow.md
---

# Event activity matrix

- `READY_FOR_PLANNING` → saveServicePlanDetailsToDB → saveTODetails → saveSODetails → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:315)
- `BOOKING_CONFIRMED` → saveServicePlanDetailsToDB → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:323)
- `ACTIVITYPLAN_FEEDBACK` → updateBookingFeedbackInDB → sendEndBookingEventToIOM. (source: service/src/main/resources/application.yml:329)
- `PRICING_UPDATE` → processPricingUpdate → saveServicePlanDetailsToDB. (source: service/src/main/resources/application.yml:332)
- `EDIT_AMEND_READY_FOR_PLANNING` → processEditAmendReadyForPlanning → saveServicePlanDetailsToDB → updateTransportOrder → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:335)
- `SEND_TO_EXECUTION` → saveServicePlanDetailsToDB → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:343)
- `SEND_TO_TMS` → processSendToTms → saveServicePlanDetailsToDB → updateTOVersionStatusAndResetOldTOAck → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM. (source: service/src/main/resources/application.yml:349)
- `VESSEL_CONTAINER_REGISTRATION_FEEDBACK` → updateVesselRailAvailabilityDate. (source: service/src/main/resources/application.yml:356)
- `UPDATE_TO` → saveServicePlanDetailsToDB → updateTransportOrder → updateExecutionStatus → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:358)
- `DRAFT_CANCELLATION` → processBookingCancellation → saveServicePlanDetailsToDB → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:364)
- `BOOKING_CANCELLATION` → processBookingCancellation → saveServicePlanDetailsToDB → updateTOVersionStatusAndResetOldTOAck → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:371)
- `SAP_TMS_ACK_FEEDBACK` → updateTmsFeedbackAcknowledgement → updateSapTmsFeedBack → saveToAckFeedbackInServicePlanDB → sendServicePlanDetailsToAP → sendEventToIomForToAck. (source: service/src/main/resources/application.yml:379)
- `SAP_TMS_EXECUTION_STATUS` → processTmsExecution → updateTransportOrder → updateExecutionStatus → sendEndBookingEventToIOM. (source: service/src/main/resources/application.yml:385)
- `SEND_DOCUMENTS` → sendServicePlanDetailsToAP. (source: service/src/main/resources/application.yml:395)
- `CUSTOMS_FEEDBACK` → processCustomsFeedback → checkAndSendNotification; `CUSTOMS_UPDATE` → manualCustomsUpdate → updateExecutionStatus → sendEndBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:397)
- Queue execution is dynamic: additional CAMS/VTS/customs activities can be inserted mid-flight, one-click mode can prune end events, and large histories continue-as-new with the remaining queue. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:88)
