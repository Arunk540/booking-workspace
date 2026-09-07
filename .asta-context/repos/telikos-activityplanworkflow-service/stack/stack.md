---
category: stack
title: stack profile
summary: The repo is a Java 21 Maven multi-module Spring Boot WebFlux service with Temporal, Kafka Avro, MongoDB, MapStruct, Lombok, and Cucumber component tests.
primary_for: [activity-plan-stack-profile]
mentions: [activity-plan-module-architecture, activity-plan-cross-cutting-architecture]
scenarios:
  - activity plan tech stack
  - java webflux service
  - activity plan build tool
  - temporal kafka mongo
  - component test stack
capabilities: [stack-identification]
domains: [platform, build-and-runtime]
entities: [ActivityplanworkflowApplication]
sources:
  - pom.xml
  - workflow/pom.xml
  - service/pom.xml
  - event/pom.xml
  - componenttest/pom.xml
  - service/src/main/resources/application.yml
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - architecture/modules.md
  - operations/monitoring.md
---

# Stack profile

- Root `pom.xml` declares an eight-module Maven reactor and compiles with Java 21. (source: pom.xml:14)
- `ActivityplanworkflowApplication` is a Spring Boot app and the event module brings in `spring-boot-starter-webflux` and actuator support. (source: service/src/main/java/net/apmoller/telikos/microservices/activityplan/ActivityplanworkflowApplication.java:24)
- Temporal is provided by `io.temporal:temporal-sdk:1.29.0`, while `TemporalClientConfig` enables TLS client setup. (source: workflow/pom.xml:41)
- Kafka uses Confluent Avro serializers in the event module and Avro code generation in the common and component-test modules. (source: event/pom.xml:35)
- Persistence is MongoDB with both reactive and blocking Spring Data starters. (source: persistence/pom.xml:19)
- Mapping and boilerplate are standardized on MapStruct 1.5.3 and Lombok 1.18.30. (source: pom.xml:45)
- Component tests are a separate Maven module with Temporal testing, Spring Kafka, Avro, and a component-test parent. (source: componenttest/pom.xml:7)
