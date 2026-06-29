---
name: contmark-execution-extras
description: Pipeline routing, classification, phase ownership, principles, lessons protocol. Load only at Stage 0/1/3/5.
---

# Execution Extras

Stage-scoped content. Loaded on demand — not at boot.

> Always-on baseline (terminal, build, commit, prohibited actions) → `execution-core`.

---

## Pipeline & Routing  (Stage 0)

### Classification Signals

| Category | Keywords |
|---|---|
| Unit test | "unit test", "junit", "mockito", "stepverifier", "write tests for" |
| Component test | "component test", "cucumber", "bdd", "feature file", "scenario" |
| Implementation | "add", "create", "implement", "new endpoint", "new activity", "modify" |
| Exploration | "where is", "how does", "explain", "find", "show me" |

### Sub-Classification & Agent Routing

| Sub-Classification | Signals | Plan | Impl | Review | UT | CT |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `new-feature` | new endpoint/activity/consumer | ✅ | ✅ | ✅ | ✅ | ✅* |
| `bug-fix` | fix, bug, defect, broken | ✅ | ✅ | ✅ | ✅ | ❌ |
| `modification` | update, change, modify, extend | ✅ | ✅ | ✅ | ✅ | ❌ |
| `implementation-only` | user says "no tests" | ✅ | ✅ | ✅ | ❌ | ❌ |
| `UT-only` | unit test keywords | ✅ | ❌ | ❌ | ✅ | ❌ |
| `CT-only` | component test keywords | ✅ | ❌ | ❌ | ❌ | ✅* |
| `test` | both UT + CT keywords | ✅ | ❌ | ❌ | ✅ | ✅* |

*CT only when `componentTest: present` in project.yml. Always skip CT when `componentTest: none`.

### Project Type Detection  (fallback only — prefer project.yml)

| Signal | Skill to load |
|---|---|
| `pom.xml` at root | `maven-build-profiles` |
| `build.gradle`/`build.gradle.kts` at root | `gradle-build-profiles` |
| `src/main/java/` | `spring-java-conventions` |
| `src/main/kotlin/` | `kotlin-conventions` |
| `spring-boot-starter-webflux` in deps | `java-reactive-patterns` |
| `spring-boot-starter-web` in deps | `spring-mvc-patterns` |

If `.contmark/project.yml` exists, **skip this table entirely** — use `skills.*` from the profile.

---

## Agent Phase Ownership  (Stage 0 / 1)

| Agent | Authors | Build phase | Never touches |
|---|---|---|---|
| **Implementer** | `src/main/` only | test-compile (main + test, no execution) | `src/test/`, `componenttest/` |
| **Unit Tester** | `src/test/` only | test-compile (skip main) → test → regression | `src/main/`, `componenttest/` |
| **Component Tester** | `componenttest/` only | CT verify (CT module only) | `src/main/`, `src/test/` |
| **Reviewer** | Nothing — read-only | None | Everything |
| **Orchestrator** | Nothing — never writes code | None | Everything |

Handoff: Implementer test-compile → Unit Tester test-compile (skip main) + run ALL → Component Tester CT verify.

---

## Core Principles  (Stage 3 + lesson reviews)

- **Simplicity First** — simplest change. Minimal code impact. One task per subagent for focused execution.
- **No Laziness** — root causes only. No temporary fixes. Senior developer standards.
- **Minimal Impact** — touch only what's necessary. Scope discipline; note out-of-scope issues, don't fix them.
- **Autonomous Bug Fixing** — given logs/errors/failing tests, just fix it. Zero context-switching required from user.
- **Verification Before Done** — never mark complete without proof. Diff behavior between main and your changes. Run tests, check logs.
- **Demand Elegance (Balanced)** — for non-trivial changes (>50 lines), pause and ask "more elegant way?" Skip for simple fixes.
- **Plan Mode Default** — any non-trivial task (3+ steps or architectural decisions) enters plan mode. If sideways, STOP and re-plan.

---

## Self-Improvement Protocol  (Stage 3 + 5)

After ANY correction or failed pipeline:
1. Before appending: grep `lessons.md` for same `pattern-name` — exists → skip
2. Append to `.contmark/lessons.md` per Orchestrator lessons policy (date, pattern, exact failure, exact fix, target)
3. Review lessons at session start
4. Same lesson 3+ times → promote to canonical skill via `skill-evolution-loop`, then delete entry

**Pruning:** ≤20 entries. Promoted → delete. Stale (>30 days) → delete.

---

## Task Tracking

1. Plan → `.contmark/todos.md` with checkable items
2. Track → mark complete as you go
3. Lessons → update `.contmark/lessons.md` after corrections
