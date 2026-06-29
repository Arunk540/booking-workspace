---
category: runtime
title: customs and vessel registration flows
summary: "Combines customs feedback, rail container-availability feedback, and VTS registration/feedback behavior for NAM bookings."
primary_for: [customs-vessel-registration]
mentions: [customs-notification-path, container-availability-feedback, vts-child-wait]
scenarios: [customs feedback topic, customs feedback guard, vessel registration flow, container availability flow, vts deadline wait]
capabilities: [external-feedback-processing, nam-registration-handling]
domains: [booking, customs, vessel-tracking]
entities: [CustomsServiceOrderConsumer, ContainerAvailabilityDomainService, VesselInformationDomainService, VtsWaitChildWorkflowImpl]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/ContainerAvailabilityFeedbackConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ContainerAvailabilityDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/VesselInformationDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - integrations/customs.md
  - integrations/cams.md
  - integrations/vts.md
---

# Customs and vessel registration flows

- Customs feedback is consumed from `${KAFKA_CUSTOMS_RESPONSE_TOPIC}` and only processed when the response header receivers contain `TELIKOS`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/CustomsServiceOrderConsumer.java:58)
- The `CUSTOMS_FEEDBACK` activity chain is `processCustomsFeedback` followed by `checkAndSendNotification`. (source: service/src/main/resources/application.yml:397)
- Container-availability feedback is consumed from `${KAFKA_CONTAINER_AVAILABILITY_TOPIC}` and is rejected unless booking reference number, container number, and receiver are valid. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/ContainerAvailabilityFeedbackConsumer.java:54)
- Rail feedback is normalized by `ContainerAvailabilityDomainService.updateContainerAvailability`, which converts local rail timestamps to UTC and emits `VESSEL_CONTAINER_REGISTRATION_FEEDBACK`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ContainerAvailabilityDomainService.java:39)
- `VESSEL_CONTAINER_REGISTRATION_FEEDBACK` only runs `updateVesselRailAvailabilityDate`, so this event is a narrow persistence patch rather than a broad fan-out flow. (source: service/src/main/resources/application.yml:356)
- Non-rail NAM send-to-tms registration uses `VesselTrackingRegistrationActivityImpl`, which POSTs to VTS and applies response dates immediately when the response contains schedule data. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java:51)
- If the VTS response is pending or empty, `armVtsHold` computes a deadline and starts `VtsWaitChildWorkflow`; amendments update the deadline instead of restarting the child. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java:127)
- `VtsWaitChildWorkflowImpl` waits until feedback or deadline, exits quietly on feedback, and only fans back a timeout event after deadline expiry. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java:35)
- REST vessel feedback lands on `PATCH /bookings/{bookingId}/vessel-information`; the domain service stores vessel dates, signals any in-flight wait child, and then emits `VESSEL_CONTAINER_REGISTRATION_FEEDBACK` to persist the final state. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/VesselInformationDomainService.java:43)
