---
category: operations
title: failure model
summary: "Practical failure surfaces and their observable outcomes across API validation, workflow orchestration, Kafka ingress, and external peer integration."
primary_for: [booking-failure-surfaces]
mentions: [poison-message-ack, vts-hold-timeout, duplicate-booking-insert]
scenarios: [booking failure modes, booking poison messages, workflow timeout behavior, integration failure surfaces, duplicate insert recovery]
capabilities: [incident-triage, blast-radius-estimation]
domains: [booking, operations]
entities: [BookingController, KafkaConsumerService, SaveToDatabaseActivityImpl, VesselTrackingRegistrationActivityImpl]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - operations/retries.md
  - operations/monitoring.md
  - runtime/customs-vessel-flow.md
---

# Failure model

- API failures are mostly synchronous validation failures: malformed booking ids, missing party emails, missing transport plans, missing document numbers, and invalid customs payloads fail before workflow initiation. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:110)
- Poisoned dedicated Kafka records are retried three times and then acknowledged, so downstream loss is possible unless logs and metrics catch the skip quickly. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:61)
- Duplicate booking inserts during READY_FOR_PLANNING or DRAFT_CANCELLATION regenerate booking ids and close the current workflow, which can create extra workflow noise but avoids total event loss. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/SaveToDatabaseActivityImpl.java:44)
- SEND_TO_TMS idempotency can close the workflow early when that work process is already STARTED, so repeated API calls may look like no-ops by design. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java:55)
- VTS HTTP failures do not arm the wait child; only successful-but-pending VTS responses create the deadline hold. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/VesselTrackingRegistrationActivityImpl.java:91)
- If the VTS hold is armed and no feedback arrives before deadline, the child workflow emits a timeout fan-back event; feedback after that point is already late. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/VtsWaitChildWorkflowImpl.java:50)
