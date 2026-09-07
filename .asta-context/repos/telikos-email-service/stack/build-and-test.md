---
category: stack
title: Build, test and run email-service
summary: "Maven commands for building, testing and linting email-service, which are all run from inside a module, plus the docker compose path for running it locally."
primary_for: [email-build-and-test]
mentions: [email-module-layout, component-test-execution, checkstyle-lint, local-docker-compose]
scenarios: [how to run the tests, run unit tests email service, run component tests, how to build email service, run checkstyle lint, run email service locally, docker compose email, verify my change, mvn command email, run the service locally, start the service locally]
capabilities: [build, unit-test, component-test, lint, local-run]
domains: [email-notification, developer-workflow]
entities: [Maven, JUnit5, Checkstyle, Docker Compose]
sources:
  - AGENTS.md
  - service/pom.xml
  - componenttest/pom.xml
  - perftest/pom.xml
verified_against: e1b2569ff79b08fe17152b587dfeac3a15b2db52
last_updated: "2026-08-11"
related:
  - stack/stack.md
  - architecture/modules.md
  - architecture/cross-cutting.md
---

# Build, test and run — email-service

**There is no root `pom.xml`, and commands are run from inside a module** — `service/`,
`componenttest/` or `perftest/`. Running Maven at the repo root does nothing useful.
(source: AGENTS.md)

| Intent | Command |
|---|---|
| Install deps | `cd service && mvn clean install` |
| **Tests** | `cd service && mvn test` (or from `componenttest/` / `perftest/`) |
| Lint (Checkstyle) | `cd service && mvn checkstyle:check` |
| Build | `cd service && mvn clean package` |
| **Run locally** | `cd service && docker compose up --build` — after `mvn clean install` |

(source: AGENTS.md)

Checkstyle configuration lives under `service/src/main/resources/checkstyle`, not at the repo root
where a search would usually look for it. (source: AGENTS.md)

## The style this codebase expects

- Reactive (WebFlux): avoid blocking calls in reactive chains. Some known exceptions already exist
  in `domain/` — they are documented as anti-patterns, not as precedent. Do not add new ones.
- DTOs and domain models are **mutable Lombok POJOs**
  (`@Data @Builder @AllArgsConstructor @NoArgsConstructor`), not records. A new record-based type
  will not match the rest of the codebase or its mappers.
- Domain services compose through interfaces, never concrete implementations: persistence goes via
  `*DataService` interfaces, external HTTP/Kafka via gateway/integration classes.

(source: AGENTS.md)
