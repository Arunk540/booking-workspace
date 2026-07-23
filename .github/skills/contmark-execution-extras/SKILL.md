---
name: contmark-execution-extras
description: Pipeline routing, classification, phase ownership, self-improvement protocol. Load only at Stage 0/1/3/5.
---

# Execution Extras

Stage-scoped. Loaded on demand — not at boot. Baseline (paths, lessons format, guard, terminal, build, commit, principles) → `execution-core`.

## Classification Signals (Stage 0)

| Category | Keywords |
|---|---|
| Unit test | "unit test", "junit", "mockito", "stepverifier", "write tests for" |
| Component test | "component test", "cucumber", "bdd", "feature file", "scenario" |
| Implementation | "add", "create", "implement", "new endpoint", "new activity", "modify" |
| Exploration | "where is", "how does", "explain", "find", "show me" |

## Sub-Classification & Agent Routing (Stage 0)

| Sub-Classification | Signals | Plan | Impl | Review | UT | CT |
|---|---|:---:|:---:|:---:|:---:|:---:|
| `new-feature` | new endpoint/activity/consumer | ✅ | ✅ | ✅ | ✅ | ✅* |
| `bug-fix` | fix, bug, defect, broken | ✅ | ✅ | ✅ | ✅ | ❌ |
| `modification` | update, change, modify, extend | ✅ | ✅ | ✅ | ✅ | ❌ |
| `implementation-only` | user says "no tests" | ✅ | ✅ | ✅ | ❌ | ❌ |
| `UT-only` | unit test keywords | ✅ | ❌ | ❌ | ✅ | ❌ |
| `CT-only` | component test keywords | ✅ | ❌ | ❌ | ❌ | ✅* |
| `test` | both UT + CT keywords | ✅ | ❌ | ❌ | ✅ | ✅* |
| `quick` | trivial surface — eligibility below | ❌ | ✅ | self† | ✅ | ❌ |

*CT only when `_pins.yml` `modules.componentTest: present`. Always skip on `none`/absent.
UT and CT run **sequentially** (UT then CT) — zero file overlap, both independently resumable.

†**`quick`** — decided AFTER Stage 0.5 (evidence, never keywords alone). ALL true: single repo · `$req` ≤2 · touch surface ≤2 files (from anchors) · no contract/API/schema/topic/migration/config/security surface · nothing new (endpoint/consumer/workflow).
Pipeline: micro-plan inline (≤10 lines: files · change per file · UT rows) at the SAME human gate → Implement → UT → PR; Reviewer = implementer Pre-READY self-review.
**Escalation:** post-implement diff >2 files OR touches an excluded surface → full Review (+ CT if due) before PR — never ship an escaped quick silently.

## Agent Phase Ownership (Stage 0/1)

| Agent | Authors | Build phase | Never touches |
|---|---|---|---|
| **Implementer** | `src/main/` only | compile (no test execution) | `src/test/`, `componenttest/` |
| **Unit Tester** | `src/test/` only | test-compile (skip main) → test → regression | `src/main/`, `componenttest/` |
| **Component Tester** | `componenttest/` only | CT verify | `src/main/`, `src/test/` |
| **Reviewer** | Nothing — read-only | None | Everything |
| **Orchestrator** | Nothing | None | Everything |

## Self-Improvement Protocol (Stage 3 + 5)

After ANY correction or failed pipeline:
1. Grep `lessons.md` for the same `pattern-name` — exists → skip
2. Append per `execution-core §Lessons Entry Format`
3. Review lessons at session start
4. Same lesson 3+ times → promote via `skill-evolution-loop`, delete entry

Pruning: ≤20 entries. Promoted → delete. Stale (>30 days) → delete.

## Task Tracking

1. Plan → `{workspace_context_dir}/todos.md` with checkable items
2. Mark complete as you go
3. Lessons → `{repo_context_dir}/lessons.md` after corrections
