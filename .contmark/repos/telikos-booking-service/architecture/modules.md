---
category: architecture
title: module topology
summary: "Maps the repo modules and the main Java package areas so agents can land work in the right slice first time."
primary_for: [booking-module-topology]
mentions: [component-test-topology, performance-test-topology, package-boundaries]
scenarios: [booking module layout, booking module boundaries, service module packages, component test module, performance test module]
capabilities: [repo-navigation, module-placement]
domains: [booking, engineering-system]
entities: [service module, componenttest module, perftest module]
sources:
  - service/pom.xml
  - componenttest/pom.xml
  - perftest/pom.xml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - architecture/cross-cutting.md
  - stack/stack.md
  - navigation/key-classes.md
---

# Module topology

## Maven modules
- `service/` is the runtime module and carries the production Spring Boot application plus the main dependency graph. (source: service/pom.xml:7)
- `componenttest/` is a separate Maven module for Cucumber-style component tests and Temporal testing dependencies. (source: componenttest/pom.xml:7)
- `perftest/` is a separate Maven module for JMeter-based load tests and does not participate in runtime packaging. (source: perftest/pom.xml:30)

## Package landmarks inside `service`
- Production code is partitioned into `api`, `common`, `domain`, `events`, `infrastructure`, `persistence`, and `temporal`, which is the clearest top-level slice map for new work. (source: not derivable from trace)
- `api` owns REST controllers and request/response models; `domain` owns booking rules and flow selection; `events` owns Kafka ingress and outbound audit dispatch; `temporal` owns workflow orchestration. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/BookingController.java:79)
- `infrastructure` carries Mongo entities and external integrators; `common` carries constants and metrics helpers shared by every slice. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/infrastructure/models/ServicePlanEntity.java:23)

## Test placement
- Unit and slice tests live under `service/src/test/java`, component tests live under `componenttest/src/test/java`, and workload simulations live under `perftest/`. (source: not derivable from trace)
