---
category: integrations
title: container availability registration
summary: "CAMS registration for NAM rail bookings and the inbound feedback topic that patches service-plan rail availability dates."
primary_for: [container-availability-registration]
mentions: [rail-registration-branch, container-availability-feedback, cams-feature-flag]
scenarios: [container availability flow, container availability callback, cams registration endpoint, rail availability feedback, cams feature flag, cams vts short circuit cancelled executed, rail eta update skipped when executed]
capabilities: [rail-registration, feedback-patch-processing]
domains: [booking, container-availability]
entities: [CamsIntegrator, ContainerAvailabilityFeedbackConsumer, ContainerAvailabilityDomainService, UpdateVesselRailAvailabilityDateActivityImpl, CamsRetryChildWorkflowImpl, ContainerAvailabilityRegisterActivityImpl, VtsCamsChildFanBackActivityImpl, SendToEhActivityImpl]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/integration/integrators/CamsIntegrator.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/ContainerAvailabilityFeedbackConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ContainerAvailabilityDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/CamsRetryChildWorkflowImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ContainerAvailabilityRegisterActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VtsCamsChildFanBackActivityImpl.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateVesselRailAvailabilityDateActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SendToEhActivityImpl.java
verified_against: 658219d7b0d44dcec2883faeecbe4409128c72d5
last_updated: "2026-11-26"
related:
  - runtime/customs-vessel-flow.md
  - runtime/confirm-send-to-tms-flow.md
  - operations/flags-and-lists.md
peer_systems:
  - cams
direction: bidirectional
protocol: rest
topic_or_endpoint: "CAMS_API_ENDPOINT + KAFKA_CONTAINER_AVAILABILITY_TOPIC"
---

# Container availability registration

- CAMS registration is an HTTP POST to `${CAMS_API_BASE_URL}${CAMS_API_ENDPOINT}` performed by `CamsIntegrator.registerAvailabilityCheck`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/integration/integrators/CamsIntegrator.java:30)
- When `containerAvailability.enabled` (env `CONTAINER_AVAILABILITY_ENABLED`, default `false`) is false, the integrator returns a synthetic `SKIPPED` response instead of calling the peer. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/integration/integrators/CamsIntegrator.java:33; service/src/main/resources/application.yml:77)
- For a NAM booking, `DomainHelperUtils.selectNamRegistrationActivity` picks `CONTAINER_AVAILABILITY_REGISTER` (CAMS) when the plan has a railhead facility, else `VESSEL_REGISTER_TRACKING` (VTS). `ProcessReadyForPlanningImpl` and `ProcessEditAmendReadyForPlanningImpl` merge it as a pre-save entry via `mergeRegistrationEntry`; `ProcessSendToTmsImpl` no longer references it, so CAMS registration is a Ready-for-Planning / amend side effect, not a SEND_TO_TMS one. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/DomainHelperUtils.java:3165; temporal/activity/ProcessReadyForPlanningImpl.java:103; temporal/activity/ProcessEditAmendReadyForPlanningImpl.java:275)
- CAMS feedback arrives on `${KAFKA_CONTAINER_AVAILABILITY_TOPIC}` and is handled by `ContainerAvailabilityFeedbackConsumer`. (source: service/src/main/resources/application.yml:213)
- `ContainerAvailabilityDomainService.updateContainerAvailability` converts local rail availability timestamps to UTC (start-location zone id), signals any in-flight `CamsRetryChildWorkflow` with `camsFeedback` once the rail ETA has arrived, and emits `VESSEL_CONTAINER_REGISTRATION_FEEDBACK` so the patched dates are persisted by the workflow engine. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ContainerAvailabilityDomainService.java:42, :65, :110)
- When the `containerAvailabilityRegister` attempt hits a 5xx/transient error, or the registration succeeds but the rail ETA is still awaited, the activity arms `CamsRetryChildWorkflow` (`@WorkflowMethod(name = "camsRetry")`) via `armCamsRetry`; a 4xx skips the child. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ContainerAvailabilityRegisterActivityImpl.java:78, :102, :112)
- The child runs up to two phases against one deadline (`deadlineEpochMillis`, replaceable by the `updateCamsDeadline` signal). **Retry phase** (skipped when `callbackOnly`): re-issues `attemptCamsRegistration` with Temporal-native retry, schedule-to-close set to the remaining time to the deadline. **Wait phase**: awaits the `camsFeedback` signal until the deadline. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/CamsRetryChildWorkflowImpl.java:51-125)
- A single retry attempt is capped so it never outlives the deadline: `startToClose = min(remaining, 5m)`; non-retryable 4xx (`CAMS_NON_RETRYABLE_TYPE`) ends the retry phase and the child exits without fan-back. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/CamsRetryChildWorkflowImpl.java:81)
- On deadline expiry (in either phase) the child calls `VtsCamsChildFanBackActivityImpl.fireVtsCamsRegistrationFeedback(bookingId, null, true)` — the shared fan-back for the VTS and CAMS children; the `true` timeout flag makes `UpdateVesselRailAvailabilityDate` surface the rail "Unable to retrieve rail ETA" business exception. If `camsFeedback` arrived first, the Kafka callback has already triggered the parent and nothing is fanned back. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VtsCamsChildFanBackActivityImpl.java:26; CamsRetryChildWorkflowImpl.java:74, :124)
- `UpdateVesselRailAvailabilityDateActivityImpl` short-circuits (skips the equipment-date update, the VTS reference sync, AND the SEND_TO_TMS trigger check) before doing any work, for two cases: the booking is `CANCELLED`, or `SERVICE_DELIVERY_EXECUTION` has already reached `EXECUTED`. Applies identically to a normal date update and a VTS/CAMS registration-timeout notification. [gap] whether the SEND_TO_TMS trigger check is skipped on the early return was read from the guard comments only. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/UpdateVesselRailAvailabilityDateActivityImpl.java:58, :72)
- The `VESSEL_CONTAINER_REGISTRATION_FEEDBACK` event's second step, `SendToEhActivityImpl.sendVesselCamsTrackingToEh`, only publishes to the event-history topic when the service plan carries tracking dates or a VTS/CAMS timeout business exception — a feedback cycle with neither is dropped instead of writing an empty history entry. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SendToEhActivityImpl.java:79)
