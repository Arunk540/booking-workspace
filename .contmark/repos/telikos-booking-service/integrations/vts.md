---
category: integrations
title: vessel tracking registration
summary: "Outbound vessel-tracking registration for NAM non-rail bookings and inbound REST feedback that closes the VTS holding pattern."
primary_for: [vessel-tracking-registration]
mentions: [vts-child-workflow, vessel-information-callback, deadline-shift-signal]
scenarios: [vessel tracking flow, vessel tracking callback, vts deadline update, vts child wait, vessel tracking endpoint]
capabilities: [vessel-registration, callback-reconciliation]
domains: [booking, vessel-tracking]
entities: [VesselTrackingIntegrator, VesselTrackingRegistrationActivityImpl, VtsWaitChildWorkflowImpl, VesselInformationDomainService]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/integration/integrators/VesselTrackingIntegrator.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/VesselInformationDomainService.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - runtime/customs-vessel-flow.md
  - runtime/confirm-send-to-tms-flow.md
  - operations/failure-model.md
peer_systems:
  - vts
direction: bidirectional
protocol: rest
topic_or_endpoint: "VESSEL_TRACKING_API_ENDPOINT + /bookings/{bookingId}/vessel-information"
---

# Vessel tracking registration

- Outbound VTS registration is an HTTP POST to `${VESSEL_TRACKING_API_BASE_URL}${VESSEL_TRACKING_API_ENDPOINT}` through `VesselTrackingIntegrator.registerScheduleDetails`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/integration/integrators/VesselTrackingIntegrator.java:24)
- `VesselTrackingRegistrationActivityImpl` only runs when send-to-tms reaches the non-rail NAM branch and the VTS feature flag is enabled. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java:67)
- Successful VTS responses with dates update the service plan immediately; pending or empty responses arm a deadline-based wait child instead. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java:110)
- The child workflow waits for feedback, accepts deadline shifts via signal, and only emits a timeout fan-back after the deadline elapses. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java:35)
- Inbound VTS business feedback reaches booking through `PATCH /bookings/{bookingId}/vessel-information`, where `VesselInformationDomainService` stores dates, signals the child, and emits `VESSEL_CONTAINER_REGISTRATION_FEEDBACK`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/VesselInformationDomainService.java:43)
