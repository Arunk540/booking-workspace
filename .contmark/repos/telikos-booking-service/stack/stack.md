---
category: stack
title: stack profile
summary: "Operationally relevant stack facts for booking service builds, runtime libraries, test tooling, and platform integrations."
primary_for: [booking-tech-stack]
mentions: [maven-build-profile, webflux-runtime, temporal-library-stack]
scenarios: [booking stack overview, booking build tool, java framework version, temporal stack details, mongo stack details]
capabilities: [stack-detection, build-selection]
domains: [booking, platform]
entities: [Maven, Spring WebFlux, Temporal, Kafka, MongoDB]
sources:
  - service/pom.xml
  - componenttest/pom.xml
  - service/src/main/resources/application.yml
verified_against: b8888cd92f07b4a564e6f5f6dbaf08f61e52811d
last_updated: "2026-06-18T11:53:42.850+05:30"
related:
  - architecture/modules.md
  - architecture/cross-cutting.md
  - operations/monitoring.md
---

# Stack profile

- Build system: Maven, with the runtime module inheriting from `telikos-parent:1.3.6`. (source: service/pom.xml:7)
- Language/runtime: Java on Spring Boot with Spring WebFlux and reactive MongoDB. (source: service/pom.xml:91)
- Security: Spring OAuth2 resource server plus `telikos-jwt-validator` for token validation helpers. (source: service/pom.xml:101)
- Mapping/tooling: Lombok, MapStruct, Gson, and Spring validation are part of the runtime dependency graph. (source: service/pom.xml:120)
- Messaging: Kafka with Confluent Avro serializers/deserializers and Schema Registry on both dedicated and shared clusters. (source: service/pom.xml:145)
- Workflow: Temporal integration comes from `event-router-library:3.2.25` and task queues configured under `audit.temporal.taskQueue`. (source: service/pom.xml:56)
- Testing: component tests use Cucumber, Serenity, and `temporal-testing`; performance tests use the JMeter Maven plugin. (source: componenttest/pom.xml:33)
