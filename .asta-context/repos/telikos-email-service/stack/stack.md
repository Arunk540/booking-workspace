---
category: stack
title: Technology stack
summary: The service is a Java 21 Maven Spring Boot WebFlux application with Reactor, Temporal worker runtime, reactive MongoDB, Kafka/Avro, SendGrid, OpenPDF, and OAuth2 resource-server security.
primary_for: [email-service-stack]
mentions: [email-service-modules, email-service-cross-cutting, email-event-history-kafka]
scenarios: [email stack overview, email tech stack, email framework list, what email uses, email library versions]
capabilities: [technology-profile]
domains: [email-notification]
entities: [pom.xml, application.yml]
sources: [service/pom.xml, service/src/main/resources/application.yml]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [architecture/modules.md, architecture/cross-cutting.md]
---
# Technology stack

- Build: Maven with `telikos-parent:1.3.6`; compiler target and source are Java 21. (source: service/pom.xml:7)
- Web: `spring-boot-starter-webflux` plus explicit `spring-webflux`; Reactor is also used for Temporal-side orchestration. (source: service/pom.xml:127)
- Messaging: Spring Kafka, reactor-kafka, Confluent Avro serializer/deserializer, and `event-router-library:3.2.14`. (source: service/pom.xml:167)
- State: `spring-boot-starter-data-mongodb-reactive` with auto-index creation enabled in application config. (source: service/pom.xml:283)
- Email/PDF: SendGrid Java `4.4.1` and OpenPDF `1.3.30`. (source: service/pom.xml:279)
- Security/observability: Spring Security OAuth2 resource server, Micrometer Prometheus, actuator probes, MapStruct, and Lombok. (source: service/pom.xml:269)
