---
name: contmark-project-profile
description: Declarative project stack + skill pins via .contmark/project.yml. Skips runtime detection. Load at boot.
---

# Project Profile

A one-time file at `.contmark/project.yml` declaring the project's stack, modules, features, and pinned skills. Replaces runtime stack detection (Maven vs Gradle, Java vs Kotlin, WebFlux vs MVC, CT module presence) on every pipeline run.

> **Why:** detection burns 3–5K tokens per run reading `pom.xml`, globbing `src/main/kotlin`, grep-checking dependencies. The project doesn't change between sessions — declare it once.

---

## Boot protocol

```
1. Read .contmark/project.yml
   → present  → parse into $stack, $modules, $features, $skills.* — SKIP detection
   → absent   → run minimal detection (see below), offer to write project.yml at end
2. Read every path in $skills.always[]                  ← single round of loads
3. Continue to Stage 0
```

If `$skills.always[]` is set, **do not** consult the agent's lookup table for build/convention skills — the profile is authoritative.

---

## Schema (`.contmark/project.yml`)

```yaml
stack:
  build: maven           # maven | gradle
  language: java         # java | kotlin
  framework: webflux     # webflux | mvc

modules:
  service: <path>        # e.g. src/main/java/com/maersk/foo
  test: src/test/java
  componentTest: componenttest    # or `none` to skip Stage 4b

features:
  kafka: true|false
  temporal: true|false
  database: mongo|postgres|dynamo|none
  avro: true|false

skills:
  always:    [execution-core, project-profile]
  stack:     [spring-java-conventions, java-reactive-patterns]
  build:     [maven-build-profiles]
  domain:    [kafka-patterns, temporal-workflow-patterns]
  review:    [code-review-checklist]
  test:      [unit-testing-java, component-testing-cucumber]
  pr:        [pr-delivery-and-triage]
  plan:      [plan-templates]

profiles:
  application: [local, dev, test, prod]
  helm: helm/*-values.yml
```

All fields optional except `stack.*`. Missing `skills.*` arrays fall back to the agent's lookup table for that category.

---

## Minimal detection (fallback when project.yml absent)

Only when no profile exists. After detection, write a draft `project.yml` to `.contmark/project.yml.draft` and ask the user to review + rename.

```
build:     pom.xml at root → maven · build.gradle(.kts) at root → gradle
language:  src/main/kotlin/ present → kotlin · else java
framework: grep starter-webflux → webflux · grep starter-web → mvc
ctModule:  componenttest/ exists → present · else absent
```

Stop at the four signals above. Do not deep-scan for kafka/temporal/db — those load on actual code triggers.

---

## Agent contract

- **Read project.yml exactly once per session, at boot.** Do not re-read in later stages — the profile is stable.
- **Skill lookup tables in agent prose are a fallback.** When `skills.*` is populated, prefer it.
- **Adding a new skill type?** Add the key to `skills.*` first; the agent will pick it up next run.

---

## Example — Java + WebFlux + Kafka + Temporal project

```yaml
stack:
  build: maven
  language: java
  framework: webflux

modules:
  service: foo-service
  test: src/test/java
  componentTest: componenttest

features:
  kafka: true
  temporal: true
  database: mongo
  avro: true

skills:
  always:  [execution-core, project-profile]
  stack:   [spring-java-conventions, java-reactive-patterns]
  build:   [maven-build-profiles]
  domain:  [kafka-patterns, temporal-workflow-patterns, db-migration-guardrails]
  review:  [code-review-checklist]
  test:    [unit-testing-java, component-testing-cucumber]
  pr:      [pr-delivery-and-triage]
  plan:    [plan-templates]

profiles:
  application: [local, dev, test, prod]
  helm: helm/*-values.yml
```

---

## Example — Kotlin + MVC + Postgres (no CT)

```yaml
stack:
  build: gradle
  language: kotlin
  framework: mvc

modules:
  service: src/main/kotlin
  test: src/test/kotlin
  componentTest: none

features:
  kafka: false
  temporal: false
  database: postgres
  avro: false

skills:
  always: [execution-core, project-profile]
  stack:  [kotlin-conventions, spring-mvc-patterns]
  build:  [gradle-build-profiles]
  domain: [db-migration-guardrails]
  review: [code-review-checklist]
  test:   [unit-testing-java]
  pr:     [pr-delivery-and-triage]
  plan:   [plan-templates]
```

---

## Authoring guidance

When the user clones a new service, run once:

```bash
npx copilot-shared init-project    # writes .contmark/project.yml.draft
```

Review the draft, rename to `project.yml`, commit. From then on, every Telikos agent run reads it instead of re-detecting.
