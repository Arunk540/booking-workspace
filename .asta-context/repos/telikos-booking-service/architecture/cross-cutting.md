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
verified_against: 4850c3efe7babc8364a044fed070268d6945002f
last_updated: "2026-09-07"
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
- One-click bookings are a cross-cutting variant: milestone completion dynamically inserts the next event's activities mid-queue via `oneClickConfirmationActivityCheck`. They no longer strip intermediate IOM start/end emissions — that pruning (`removeEndEventIfPresent`, and the `sendStartBookingEventToIOM`/`sendEventToIomForToAck` removal in `updateBookingActivityQueue`) was deleted; `removeEndEventIfPresent` is now dead code, never called. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/workflow/BookingEventsWorkflowImplementation.java:121, :164, :191)
- Consumer error handling is also layered: business processing retries are short and bounded, but connection-level Kafka retries are effectively infinite. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/KafkaConsumerService.java:47)
- **Temporal payload models must survive rolling deploys.** `VersionTolerantPayload` (new) captures unknown JSON fields via `@JsonAnySetter`/`@JsonAnyGetter` so an old worker round-trips fields it doesn't model instead of dropping them from workflow history; `ServicePlan`, `BookingActivity`, `Invoice`, and `RevenueLineItem` extend it in place of `@JsonIgnoreProperties(ignoreUnknown = true)`. Separately, `TemporalWorkerConfig.getClient()` now rebuilds the `WorkflowClient` on a lenient `DataConverter` (`FAIL_ON_UNKNOWN_PROPERTIES=false`) — a single choke point covering every payload model, not just the ones extending `VersionTolerantPayload`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/VersionTolerantPayload.java:27; domain/models/ServicePlan.java:26; temporal/config/TemporalWorkerConfig.java:160)

## Invariants new code must hold

These are the rules a change is rejected for breaking, not preferences. (source: AGENTS.md)

- **Layering is one-directional:** `api` → `domain` → `infrastructure`/`persistence`. Never skip a
  layer and never reverse one.
- **`.block()` is forbidden in production code.** Every chain is `Mono<T>` / `Flux<T>`; a blocking
  call inside a reactive chain does not fail loudly, it starves the event loop under load.
- **All external HTTP goes through** `infrastructure/integration/integrators/`. A `WebClient`
  constructed anywhere else bypasses the shared timeout, retry and error handling.
- **All Kafka publishing goes through** `events/audit/dispatchers/`.
- **Temporal workflow ids come from `TemporalWorkflowIdHandler`** — never hand-built. A manually
  formatted id silently starts a second workflow instead of signalling the existing one.
- **Errors delegate to the `telikos-exception-handler` shared library.** Swallowing an exception
  quietly is the one failure this codebase has no way to detect.
