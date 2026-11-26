---
category: stack
title: Build, test and run booking-service
summary: "Maven commands for building, unit-testing, component-testing and linting booking-service, plus the module layout that makes the usual root-level command fail."
primary_for: [booking-build-and-test]
mentions: [booking-module-layout, component-test-execution, checkstyle-lint]
scenarios: [how to run the tests, run unit tests booking service, run component tests, how to build booking service, run checkstyle lint, run booking service locally, verify my change, mvn command booking, run the service locally, start the service locally]
capabilities: [build, unit-test, component-test, lint]
domains: [booking, developer-workflow]
entities: [Maven, JUnit5, Mockito, StepVerifier, Cucumber, Testcontainers, Checkstyle]
sources:
  - CLAUDE.md
  - service/pom.xml
  - componenttest/pom.xml
  - perftest/pom.xml
verified_against: cf8cb392d09686d16ba800291da20d5644191555
last_updated: "2026-11-03"
related:
  - stack/stack.md
  - architecture/modules.md
  - architecture/cross-cutting.md
---

# Build, test and run — booking-service

**There is no root `pom.xml`.** `service/`, `componenttest/` and `perftest/` are separate Maven
modules. A bare `mvn test` at the repo root does not build the service — every command below is
either `-pl service` or run from inside a module. (source: CLAUDE.md)

| Intent | Command |
|---|---|
| Install deps | `mvn clean install -DskipTests` |
| **Unit tests** (the usual one) | `mvn test -pl service` |
| All tests incl. component | `mvn test` |
| Lint (Checkstyle) | `mvn checkstyle:check -pl service` |
| Build, skip tests | `mvn clean package -DskipTests -pl service` |
| Full build | `mvn clean install -pl service` |

(source: CLAUDE.md)

## The two test tiers

- **Unit** — JUnit 5 + Mockito, and `reactor-test` `StepVerifier` for reactive chains. A reactive
  method asserted with a plain `assertEquals` is usually asserting on an unsubscribed `Mono`, which
  passes without ever running the code. (source: CLAUDE.md) (source: service/pom.xml)
- **Component** — Cucumber BDD driving real integration flows under Testcontainers, in
  `componenttest/`. Surefire is disabled there (`skipTests=true`), so component tests do NOT run in
  the surefire phase — they are their own module and their own run.
  (source: componenttest/pom.xml) (source: CLAUDE.md)
- `perftest/` is JMeter load testing and is not part of a normal verification pass. (source: CLAUDE.md)

## What "verified" means before finishing a change

Run the tests for the area touched; run lint/build when compiled code changed; for a bug fix add or
update a regression test. If verification could not be run, say what was attempted and what blocked
it rather than reporting success. (source: CLAUDE.md)

## Deeper local rules

Per-module `AGENTS.md` files (`service/`, `api/`, `domain/`, `events/`, `infrastructure/`,
`temporal/`, `componenttest/`) were removed; a single root `CLAUDE.md` now covers the whole repo.
(source: CLAUDE.md)
