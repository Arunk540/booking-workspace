---
category: stack
title: Build, test and run activityplanworkflow-service
summary: "Maven commands for building, testing, linting and locally running activityplanworkflow-service across its nine modules."
primary_for: [activityplan-build-and-test]
mentions: [activityplan-module-layout, component-test-execution, checkstyle-lint]
scenarios: [how to run the tests, run unit tests activity plan, run component tests, how to build activity plan, run checkstyle lint, run activity plan locally, start the dev server, verify my change, mvn command activityplan, run the service locally, start the service locally]
capabilities: [build, unit-test, component-test, lint, local-run]
domains: [activity-plan, developer-workflow]
entities: [Maven, JUnit5, Checkstyle, Testcontainers]
sources:
  - AGENTS.md
  - pom.xml
  - service/pom.xml
  - componenttest/pom.xml
verified_against: a5fbe3845803a0a11d5f55773a966014b0596e2e
last_updated: "2026-08-11"
related:
  - stack/stack.md
  - architecture/modules.md
  - architecture/cross-cutting.md
---

# Build, test and run — activityplanworkflow-service

Unlike the other two repos in this workspace, this one **does have a root `pom.xml`**, so plain
root-level Maven commands work. Nine modules: `api`, `billing-domain`, `booking-domain`, `common`,
`componenttest`, `event`, `persistence`, `service`, `workflow`. (source: pom.xml)

| Intent | Command |
|---|---|
| Install deps | `mvn install` |
| **Tests** | `mvn test` |
| Lint (Checkstyle) | `mvn checkstyle:check` |
| Build | `mvn clean install` |
| Run locally | `cd service && mvn spring-boot:run` |

(source: AGENTS.md)

Type checking is not a separate step — `mvn compile` serves that role for a statically compiled
Java project, so there is nothing extra to run. (source: AGENTS.md)

## Where shared things live

Shared contracts — DTOs, entities, Avro schemas — live in `common/`. Duplicating one into a module
is the mistake this layout exists to prevent, and it is how two modules end up disagreeing about
the same wire format. (source: AGENTS.md)

## Temporal-specific test constraints

Activities must be idempotent and retry-safe; workflow code must stay deterministic and free of
direct side effects. A test that passes only on the first replay is testing the happy path of a
workflow that Temporal is entitled to re-run. (source: AGENTS.md)
