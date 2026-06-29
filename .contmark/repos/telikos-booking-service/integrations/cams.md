---
category: integrations
title: container availability registration
summary: "CAMS registration for NAM rail bookings and the inbound feedback topic that patches service-plan rail availability dates."
primary_for: [container-availability-registration]
mentions: [rail-registration-branch, container-availability-feedback, cams-feature-flag]
scenarios: [container availability flow, container availability callback, cams registration endpoint, rail availability feedback, cams feature flag]
capabilities: [rail-registration, feedback-patch-processing]
domains: [booking, container-availability]
entities: [CamsIntegrator, ContainerAvailabilityFeedbackConsumer, ContainerAvailabilityDomainService]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/integration/integrators/CamsIntegrator.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/ContainerAvailabilityFeedbackConsumer.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ContainerAvailabilityDomainService.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
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

- CAMS registration is an HTTP POST to `${CAMS_API_BASE_URL}${CAMS_API_ENDPOINT}` performed by `CamsIntegrator.registerAvailabilityCheck`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/integration/integrators/CamsIntegrator.java:28)
- When `containerAvailability.enabled` is false, the integrator returns a synthetic `SKIPPED` response instead of calling the peer. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/integration/integrators/CamsIntegrator.java:31)
- The send-to-tms NAM rail branch inserts `CONTAINER_AVAILABILITY_REGISTER`, making CAMS a pre-save side effect of the SEND_TO_TMS workflow. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java:96)
- CAMS feedback arrives on `${KAFKA_CONTAINER_AVAILABILITY_TOPIC}` and is handled by `ContainerAvailabilityFeedbackConsumer`. (source: service/src/main/resources/application.yml:184)
- `ContainerAvailabilityDomainService` converts local rail availability timestamps to UTC and emits `VESSEL_CONTAINER_REGISTRATION_FEEDBACK` so the patched dates are persisted by the workflow engine. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/ContainerAvailabilityDomainService.java:39)
