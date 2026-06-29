---
category: architecture
title: cross-cutting concerns
summary: "Summarises the reactive, security, workflow, messaging, and persistence rules that cut across all booking flows."
primary_for: [booking-cross-cutting-concerns]
mentions: [oauth-resource-security, temporal-orchestration, reactive-mongo-patterns]
scenarios: [booking cross cutting, booking security model, workflow orchestration rules, reactive persistence rules, messaging retry model]
capabilities: [architecture-reasoning, shared-constraint-discovery]
domains: [booking, platform]
entities: [BookingController, KafkaConsumerService, BookingEventsWorkflowImplementation]
sources:
  - service/pom.xml
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - stack/stack.md
  - operations/retries.md
  - operations/monitoring.md
---

# Cross-cutting concerns

- The runtime is Spring WebFlux with reactive MongoDB, so HTTP, Kafka, and persistence paths are designed around Reactor `Mono`/`Flux` instead of blocking controller methods. (source: service/pom.xml:91)
- OAuth2 resource-server security is wired for both Azure AD and ForgeRock, and the API role mapping hangs off `app.security.access-rights.*`. (source: service/src/main/resources/application.yml:12)
- Temporal is the process backbone: booking workflows run on `${BOOKING_EVENT_TASK_QUEUE}` and peer activity-plan dispatch uses `${TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE}`. (source: service/src/main/resources/application.yml:218)
- Kafka ingress is split between a dedicated service-plan cluster and a shared cluster for SAP, customs, and container-availability callbacks. (source: service/src/main/resources/application.yml:84)
- Booking workflow history is bounded; once Temporal history crosses `HISTORY_SIZE_LIMIT`, the workflow continues-as-new with the remaining queue. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:99)
- One-click bookings are a cross-cutting variant that alters queue construction and strips intermediate IOM end/start emissions except for the SEND_TO_TMS leg. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:188)
- Consumer error handling is also layered: business processing retries are short and bounded, but connection-level Kafka retries are effectively infinite. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:47)
