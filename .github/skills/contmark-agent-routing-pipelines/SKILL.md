---
name: contmark-agent-routing-pipelines
description: Agent routing table, pipeline selection, classification signals, orchestration flow, build system detection (Maven/Gradle), project type detection (reactive/non-reactive, Java/Kotlin), and workflow expectations. Canonical source for all agent routing decisions.
---

# Agent Routing & Pipeline Selection

> **Agent naming:** Agent files are renamed at install time using your project name as prefix. `<project>` = your project name.
> **Skill naming:** Skill references always use the original directory name — not renamed.

---

## Two Human Touch Points

```
User → @<project>.orchestrate "requirement"
         │
         ├─→ Classify request (Orchestrator)
         │
         ├─→ 🧑 PLAN (human-interactive: spec + questions + approval)
         │     └─ Planner asks questions, surfaces assumptions
         │     └─ Produces plan with test matrix + CT scenarios
         │     └─ Human approves → PLAN APPROVED signal
         │
         ├─→ 🤖 AUTO-EXECUTE (no human gates)
         │     ├─ Implement → compile → commit locally
         │     ├─ Review → remediate if Critical → commit locally
         │     ├─ [Unit Test ‖ Component Test] → commit locally (parallel, zero file overlap)
         │     └─ PR auto-created with full body
         │
         └─→ 🧑 MERGE (human reviews PR before merging)
```

---

## Pipeline Selection

| Sub-Classification | Pipeline |
|-------------------|---------|
| `new-feature` | Plan 🧑 → Implement → Review → [UT ‖ CT] → auto-PR → Merge 🧑 |
| `bug-fix` | Plan 🧑 → Implement → Review → UT → auto-PR → Merge 🧑 |
| `modification` | Plan 🧑 → Implement → Review → UT → auto-PR → Merge 🧑 |
| `implementation-only` | Plan 🧑 → Implement → Review → auto-PR → Merge 🧑 |
| `UT-only` | Plan 🧑 → UT → auto-PR → Merge 🧑 |
| `CT-only` | Plan 🧑 → CT → auto-PR → Merge 🧑 |
| `test` | Plan 🧑 → [UT ‖ CT] → auto-PR → Merge 🧑 |
| Exploration | Explore (single stage, no delivery) |

> **`‖` = parallel-safe.** UT owns `src/test/`, CT owns `{CT_MODULE}/` — zero file overlap, zero conflict.
> 🧑 = human touch point (Plan approval + PR merge only). PR is auto-created; human reviews only before merge.
> CT column is **always skipped** when `CT_MODULE: absent`, regardless of sub-classification.

---

## Entry Points

| User Action | What Happens |
|---|---|
| `@<project>.orchestrate <task>` | Full pipeline (Plan → auto-execute → PR) |
| `@<project>.explore <question>` | Read-only investigation |
| `@<project>.component-test <task>` | Standalone CT writing + PR |

## Classification Signals

| Category | Keywords |
|----------|----------|
| Unit test | "unit test", "junit", "mockito", "stepverifier", "write tests for" |
| Component test | "component test", "cucumber", "bdd", "feature file", "scenario" |
| Implementation | "add", "create", "implement", "new endpoint", "new activity", "modify" |
| Exploration | "where is", "how does", "explain", "find", "show me" |
### Request Sub-Classification (used by Orchestrator Stage 0)

Every implementation request must be classified into one of these sub-types **before** delegating to the Planner. The sub-classification is included in the context payload and drives exactly which agents run.

| Sub-Classification | Signals | CT Eligible? |
|--------------------|---------|--------------|
| `new-feature` | "add new endpoint", "new activity", "new consumer", "new feature", "implement X from scratch", "build X" | ✅ Yes |
| `bug-fix` | "fix", "bug", "defect", "broken", "incorrect behaviour", "not working", "regression" | ❌ No |
| `modification` | "update", "change", "modify", "extend", "rename", "refactor", "adjust", "rework" | ❌ No |
| `implementation-only` | user explicitly says "no tests" or "implementation only" | ❌ No |
| `UT-only` | "unit test", "junit", "mockito", "stepverifier", "write tests for" | ❌ No (UT only) |
| `CT-only` | "component test", "cucumber", "bdd", "feature file", "scenario" | ✅ CT only |
| `test` | both UT-only and CT-only signals present together | ✅ Yes |

> **CT is only triggered for `new-feature`, `CT-only`, and `test` sub-classifications.**
> Bug fixes, modifications, and refactors **never** trigger the CT agent, even when `CT_MODULE: present`.

---

## Agent Responsibility by Sub-Classification

Each sub-classification maps to a fixed set of agents. The Orchestrator MUST follow this table exactly — no deviations.

| Sub-Classification | Planner | Implementer | Reviewer | Unit Tester | Component Tester |
|--------------------|:-------:|:-----------:|:--------:|:-----------:|:----------------:|
| `new-feature` | ✅ | ✅ | ✅ | ✅ | ✅ *(if CT_MODULE: present)* |
| `bug-fix` | ✅ | ✅ | ✅ | ✅ | ❌ never |
| `modification` | ✅ | ✅ | ✅ | ✅ | ❌ never |
| `implementation-only` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `UT-only` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `CT-only` | ✅ | ❌ | ❌ | ❌ | ✅ *(if CT_MODULE: present)* |
| `test` | ✅ | ❌ | ❌ | ✅ | ✅ *(if CT_MODULE: present)* |

**Boundary rules:**
- The Planner is always first and the only human-interactive agent.
- The Implementer **never** touches `src/test/` or the CT module.
- The Unit Tester **never** touches `src/main/` or the CT module.
- The Component Tester **never** touches production or unit test code.
- The Reviewer is **read-only** except during its own remediation pass.
- The CT agent is **always skipped** when `CT_MODULE: absent`, regardless of sub-classification.
---

## Project Type Detection

| Check | Result | Skill |
|---|---|---|
| `pom.xml` at root | Maven | `maven-build-profiles` |
| `build.gradle.kts` at root | Gradle | `gradle-build-profiles` |
| `src/main/java/` | Java | `spring-java-conventions` + `java-reactive-patterns` |
| `src/main/kotlin/` | Kotlin | `kotlin-conventions` |
| `spring-boot-starter-webflux` | Reactive | `java-reactive-patterns` |
| `spring-boot-starter-web` | Non-reactive | `spring-mvc-patterns` |

---

## Multi-Module Detection

Detect `SERVICE_MODULE` and `CT_MODULE` before any build command.
Full detection scripts and single-module fallback are in the build skills.

---

## Agent Boundaries

| Agent | Owns | Must Never |
|-------|------|-----------|
| **Implementer** | production `src/main/` | Touch `src/test/` or CT module |
| **Unit Tester** | `src/test/` | Touch `src/main/` |
| **Component Tester** | CT module | Touch production or unit test code |
| **Reviewer** | Read-only review | Write files (unless fixing own changes) |
| **Planner** | Read-only plan | Write any files |

## Verification Matrix

Each agent owns one build phase and loops until green before emitting READY.
**Exact commands, skip flags, and module scoping are in the build skills** — do not
duplicate them here.

| Agent | Phase | READY Signal | On Fail |
|-------|-------|-------------|---------|
| **Implementer** | Compile (`src/main/`) | `READY: for review` — BUILD SUCCESS + 0 style violations | Fix in loop |
| **Unit Tester** | Test (`src/test/`, reuse compiled main) | `READY: for next stage` — 0 failures + ≥80% coverage | Prod bug → Implementer |
| **Component Tester** | Verify (CT module) | `READY: for next stage` — 0 failures + regression ✅ | Prod bug → Implementer |

**Orchestrator SUCCESS GATE:** Proceed to next stage only when the previous agent's READY
signal is present and green. Abort and report to user on ❌ or unresolved HANDOFF.

---

## Workflow Expectations

| Expectation | Detail |
|---|---|
| Plan is the human gate | Only the Planner interacts with the human. All other agents are autonomous. |
| Plan includes test matrix | UT matrix + CT scenarios are part of the approved plan — downstream agents follow them. |
| Parallel testing | UT ‡ CT — zero file overlap (`src/test/` vs `{CT_MODULE}/`), safe to parallelize. |
| Auto-PR delivery | PR is created automatically with full body after pipeline completes. Human reviews only before merge. |
| Jira-aware | Orchestrator classifies from ticket type. Planner extracts full AC. No duplication. |
| Detect before act | Check build system, language, paradigm, and module names before executing commands. |
| Build loop mandatory | Every agent loops on its own build phase until green. No agent hands off with a failing build. |
| No duplicate compilation | Orchestrator does NOT re-compile at PR time. Agents already verified their own scope. |

---

## Cross-References

- Execution standards (sizing, scope, commits) → `execution-standards` skill
- PR delivery protocol → `pr-delivery-and-triage` skill
- Maven build commands → `maven-build-profiles` skill
- Gradle build commands → `gradle-build-profiles` skill

---

## Use This Skill When

- The Orchestrator needs to classify an incoming request and select the correct pipeline
- Determining which agents (Plan, Implement, Review, UT, CT) should run for a given task type
- Verifying CT eligibility for a sub-classification
- Understanding the two human touch points and where auto-execution begins
- A project uses an unknown build system and needs detection rules

## Do Not Use This Skill When

- Inside the pipeline execution itself — agents within a running pipeline should not re-read routing rules
- For frontend-only changes — routing for React/Vue projects follows frontend agent conventions
- For pure exploration requests — route directly to the Explorer agent

## Common Mistakes to Avoid

- **Triggering CT for bug-fix or modification sub-classifications** — CT is only for `new-feature`, `CT-only`, and `test` types; never run CT for fixes or refactors
- **Hardcoding `service` or `componenttest` as module names** — always detect via `settings.gradle.kts` or `pom.xml` before any build command
- **Skipping human approval at the Plan phase** — the Planner produces the plan; the human must approve before auto-execution begins
- **Running UT and CT sequentially** — they are parallel-safe and must run in parallel to avoid file-overlap conflicts
- **Creating multiple PRs for one feature** — one branch = one PR; the Orchestrator pushes all commits at the end

## Evaluation Cases

| # | Input | Expected routing |
|---|-------|------------------|
| 1 | "Add new booking endpoint" | `new-feature`: Plan → Implement → Review → [UT ‖ CT] → PR |
| 2 | "Fix null pointer in service" | `bug-fix`: Plan → Implement → Review → UT → PR (no CT) |
| 3 | "Write unit tests for OrderService" | `UT-only`: Plan → UT → PR |
| 4 | "Explore how the carrier model works" | Exploration: single Explorer agent, no delivery |
| 5 | Unknown module name `my-custom-service` | Agent detects via `grep` on settings/pom before using in commands |

## Metadata

| Field | Value |
|---|---|
| Owner | Telikos Engineering |
| Last reviewed | 2026-05-20 |
| Supported tools | Claude Code, GitHub Copilot |
| Supported repos | All backend services |
| Security classification | Internal |
| Evaluation status | Not evaluated |
