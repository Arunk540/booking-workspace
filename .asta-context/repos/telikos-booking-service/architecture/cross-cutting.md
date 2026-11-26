---
category: architecture
title: cross-cutting concerns
summary: "Summarises the reactive, security, workflow, messaging, and persistence rules that cut across all booking flows."
primary_for: [booking-cross-cutting-concerns]
mentions: [oauth-resource-security, temporal-orchestration, reactive-mongo-patterns]
scenarios: [booking cross cutting, booking security model, workflow orchestration rules, reactive persistence rules, messaging retry model, coding conventions, coding standards, layering rules, can i use block, global invariants, where do external http calls go, how do i publish to kafka, temporal payload rolling deploy compatibility, unknown json fields dropped from workflow history, one click iom pruning removed]
capabilities: [architecture-reasoning, shared-constraint-discovery]
domains: [booking, platform]
entities: [BookingController, KafkaConsumerService, BookingEventsWorkflowImplementation, VersionTolerantPayload, TemporalWorkerConfig]
sources:
  - service/pom.xml
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/VersionTolerantPayload.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/config/TemporalWorkerConfig.java
verified_against: 658219d7b0d44dcec2883faeecbe4409128c72d5
last_updated: "2026-11-26"
related:
  - stack/stack.md
  - operations/retries.md
  - operations/monitoring.md
---

# Cross-cutting concerns

- The runtime is Spring WebFlux with reactive MongoDB, so HTTP, Kafka, and persistence paths are designed around Reactor `Mono`/`Flux` instead of blocking controller methods. (source: service/pom.xml:98)
- OAuth2 resource-server security is wired for both Azure AD and ForgeRock, and the API role mapping hangs off `app.security.access-rights.*`. (source: service/src/main/resources/application.yml:333)
- Temporal is the process backbone: booking workflows run on `${BOOKING_EVENT_TASK_QUEUE}` and peer activity-plan dispatch uses `${TEMPORAL_ACTIVITY_PLAN_TASK_QUEUE}`. (source: service/src/main/resources/application.yml:249)
- Kafka is configured as a `kafka.dedicated` cluster and a `kafka.shared` cluster, plus a multi-tenant bootstrap for SAP TMS execution status. [gap] which topics ride which cluster was not traced. (source: service/src/main/resources/application.yml:112, :169, :202)
- Booking workflow history is bounded; once Temporal history crosses `HISTORY_SIZE_LIMIT`, the workflow continues-as-new with the remaining queue. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:100; limit is `WorkflowConstants.HISTORY_SIZE_LIMIT`, 45 MiB)
- One-click bookings are a cross-cutting variant: milestone completion dynamically inserts the next event's activities mid-queue via `oneClickConfirmationActivityCheck`. They no longer strip intermediate IOM start/end emissions — that pruning (`removeEndEventIfPresent`, and the `sendStartBookingEventToIOM`/`sendEventToIomForToAck` removal in `updateBookingActivityQueue`) was deleted; `removeEndEventIfPresent` is now dead code, never called. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:98, :114, :162)
- Consumer error handling is also layered: business processing retries are short and bounded, but connection-level Kafka retries are effectively infinite. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:53, :77)
- **Temporal payload models must survive rolling deploys.** `VersionTolerantPayload` captures unknown JSON fields via `@JsonAnySetter`/`@JsonAnyGetter` so an old worker round-trips fields it doesn't model instead of dropping them from workflow history; `ServicePlan`, `BookingActivity`, `Invoice`, and `RevenueLineItem` extend it in place of `@JsonIgnoreProperties(ignoreUnknown = true)`. Separately, `TemporalWorkerConfig.getClient()` rebuilds the `WorkflowClient` on a lenient `DataConverter` (`FAIL_ON_UNKNOWN_PROPERTIES=false`) — a single choke point covering every payload model, not just the ones extending `VersionTolerantPayload`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/VersionTolerantPayload.java:27; domain/models/ServicePlan.java:34; temporal/config/TemporalWorkerConfig.java:227)

## Invariants new code must hold

The repo's shared agent context is root `AGENTS.md` (imported by root `CLAUDE.md`) plus `componenttest/AGENTS.md`. (source: CLAUDE.md:4, AGENTS.md)

- **Never block in WebFlux or consumer paths** (`block()`, `Thread.sleep`). Compose with Reactor operators. (source: AGENTS.md:124)
- **`domain/` stays free of infrastructure code; outbound integrations live in `infrastructure/integration/integrators/`.** (source: AGENTS.md:88, :90) A `WebClient` is also built in `api/config/TokenService.java`, so this is a convention, not a guarantee.
- **Workflow ids come from `TemporalWorkflowIdHandler`**, used by `InitiateBookingEventsWorkflow`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/InitiateBookingEventsWorkflow.java)
- [gap] Layering direction `api` → `domain` → `infrastructure`/`persistence` is not stated in `AGENTS.md`; not checked in code.
- [gap] Whether all Kafka publishing goes through `events/audit/dispatchers/`: `BookingKafkaSenderConfig` and `TelikosSharedKafkaProperties` also configure producers; not traced.
- [gap] Whether every error path delegates to `telikos-exception-handler-library` (a dependency, `service/pom.xml:299`); not traced.
