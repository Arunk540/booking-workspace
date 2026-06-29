---
category: operations
title: monitoring and observability
summary: "Metrics, health probes, and logging surfaces used to observe booking ingestion, workflow fan-out, and platform health."
primary_for: [booking-observability-signals]
mentions: [health-probe-groups, booking-metrics-registry, json-logging-levels]
scenarios: [booking metrics names, booking health probes, booking readiness checks, activity plan metrics, http percentile metrics]
capabilities: [signal-lookup, runtime-observability]
domains: [booking, operations]
entities: [BookingMetricsRegistry, MeterRegistry, Actuator health groups]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/BookingMetricsRegistry.java
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - integrations/ap-temporal.md
  - integrations/iom.md
  - operations/failure-model.md
---

# Monitoring and observability

- `BookingMetricsRegistry` emits counters for service-plan events received, consumer started, bookings received, events acknowledged, IOM publishes, event-history publishes, and activity-plan dispatches. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/BookingMetricsRegistry.java:27)
- Named metrics called out by code include `METRICS_SERVICE_PLAN_EVENT_CONFIRMED`, `METRICS_BOOKING_RECEIVED`, and `METRICS_ACTIVITY_PLAN_STARTED`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/common/BookingMetricsRegistry.java:30)
- HTTP server metrics enable percentile histograms and explicit percentiles at 0.90, 0.95, and 0.99 for `http.server.requests`. (source: service/src/main/resources/application.yml:239)
- Liveness probe group includes `diskSpace` and `ping`; readiness includes `readinessState`, `diskSpace`, `ping`, and `mongo`. (source: service/src/main/resources/application.yml:254)
- Prometheus, health details, metrics endpoint, and env endpoint value visibility are all enabled through Actuator configuration. (source: service/src/main/resources/application.yml:245)
- Logging defaults `net.apmoller.crb.telikos.microservices.*` and `net.apmoller.crb.telikos.libraries.*` to `${LOG_LEVEL:INFO}` while muting noisier Kafka internals to error. (source: service/src/main/resources/application.yml:287)
