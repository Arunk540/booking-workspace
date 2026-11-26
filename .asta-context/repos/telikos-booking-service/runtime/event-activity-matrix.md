---
category: runtime
title: event activity matrix
summary: "Ordered activity matrix for the booking workflow events defined in configuration, plus the Temporal queue behaviors that alter execution."
primary_for: [booking-event-activity-matrix]
mentions: [one-click-queue-pruning, continue-as-new-threshold, activity-ordering]
scenarios: [booking activity matrix, booking event order, workflow activity order, one click queue, temporal continue as new, one click iom pruning removed]
capabilities: [workflow-sequencing, event-to-activity-lookup]
domains: [booking, workflow-orchestration]
entities: [BookingEventsWorkflowImplementation, ActivitiesConfig, ProcessInvoiceTriggeredFeedbackImpl, ProcessPricingUpdateImpl, TriggerBookingEventsActivityImpl, UpdateRevenueChargeActivityImpl, UpdateStartDateTimeActivityImpl]
sources:
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessInvoiceTriggeredFeedbackImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessPricingUpdateImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/TriggerBookingEventsActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateRevenueChargeActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateStartDateTimeActivityImpl.java
verified_against: cf8cb392d09686d16ba800291da20d5644191555
last_updated: "2026-11-03"
related:
  - runtime/rfp-flow.md
  - runtime/confirm-send-to-tms-flow.md
  - runtime/sap-tms-feedback-flow.md
---

# Event activity matrix

- `READY_FOR_PLANNING` → saveServicePlanDetailsToDB → saveTODetails → saveSODetails → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:320)
- `BOOKING_CONFIRMED` → saveServicePlanDetailsToDB → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:329)
- `ACTIVITYPLAN_FEEDBACK` → updateBookingFeedbackInDB → sendEndBookingEventToIOM. (source: service/src/main/resources/application.yml:335)
- `PRICING_UPDATE` → `ProcessPricingUpdateImpl.processPricingUpdate` → saveServicePlanDetailsToDB. (source: service/src/main/resources/application.yml:338)
- `EDIT_AMEND_READY_FOR_PLANNING` → processEditAmendReadyForPlanning → saveServicePlanDetailsToDB → updateTransportOrder → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:341)
- `SEND_TO_EXECUTION` → saveServicePlanDetailsToDB → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:349)
- `SEND_TO_TMS` → processSendToTms → saveServicePlanDetailsToDB → updateTOVersionStatusAndResetOldTOAck → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM. (source: service/src/main/resources/application.yml:355)
- `VESSEL_CONTAINER_REGISTRATION_FEEDBACK` → updateVesselRailAvailabilityDate → sendVesselCamsTrackingToEh (appended; see `integrations/cams.md` for what it emits). (source: service/src/main/resources/application.yml:362)
- `UPDATE_TO` → saveServicePlanDetailsToDB → updateTransportOrder → `UpdateExecutionStatusActivityImpl.updateExecutionStatus` → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:365)
- `DRAFT_CANCELLATION` → `ProcessCancelledBookingActivityImpl.processCancelledBookingActivity` → saveServicePlanDetailsToDB → sendServicePlanDetailsToAP → `UpdateStartDateTimeActivityImpl.updateStartDateTime` → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:371)
- `BOOKING_CANCELLATION` → processBookingCancellation → saveServicePlanDetailsToDB → updateTOVersionStatusAndResetOldTOAck → sendServicePlanDetailsToAP → updateWorkProcessStartDateTimeInDB → sendStartBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:378)
- `SAP_TMS_ACK_FEEDBACK` → `UpdateTmsFeedbackAcknowledgementImpl.updateTmsFeedbackAcknowledgement` → updateSapTmsFeedBack → saveToAckFeedbackInServicePlanDB → sendServicePlanDetailsToAP → sendEventToIomForToAck. (source: service/src/main/resources/application.yml:386)
- `SAP_TMS_EXECUTION_STATUS` → processTmsExecution → updateTransportOrder → updateExecutionStatus → sendEndBookingEventToIOM. (source: service/src/main/resources/application.yml:392)
- `UPDATE_REVENUE` → `UpdateRevenueChargeActivityImpl.updateRevenueCharge` → sendServicePlanDetailsToAP → sendEndBookingEventToIOM → sendServicePlanDetailsToEH — not elsewhere in this matrix; triggered off `RevenueLineItem` events, not a service-plan payload. (source: service/src/main/resources/application.yml:397)
- `SEND_DOCUMENTS` → sendServicePlanDetailsToAP. (source: service/src/main/resources/application.yml:402)
- `CUSTOMS_FEEDBACK` → processCustomsFeedback → checkAndSendNotification; `CUSTOMS_UPDATE` → manualCustomsUpdate → updateExecutionStatus → sendEndBookingEventToIOM → sendServicePlanDetailsToEH. (source: service/src/main/resources/application.yml:404)
- `SCM_INVOICE_FEEDBACK` → `ProcessInvoiceTriggeredFeedbackImpl.processInvoiceTriggeredFeedback` → sendEndBookingEventToIOM — the only matrix entry sourced from `BookingActivity.getFeedback()` rather than `getNewServicePlan()`. (source: service/src/main/resources/application.yml:407)
- `TriggerBookingEventsActivityImpl.triggerBookingEvent` is not itself a matrix entry: it is the generic re-entry point other activities call (via `InitiateBookingEventsWorkflow`) to kick off a *different* event's queue from inside the current one. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/TriggerBookingEventsActivityImpl.java:16)
- Queue execution is dynamic: additional CAMS/VTS/customs activities can be inserted mid-flight, and large histories continue-as-new with the remaining queue. One-click mode no longer prunes IOM start/end activities from the queue — that removal code was deleted; see `architecture/cross-cutting.md`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:88, :121)
