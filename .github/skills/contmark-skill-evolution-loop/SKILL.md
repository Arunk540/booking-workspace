---
name: contmark-skill-evolution-loop
description: Promote lessons.md entries into skill/agent patches (≤10 lines, non-blocking). Load at Stage 5 evolution.
---

# Skill Evolution Loop

Patches skill files and agent.md files from task learnings and token waste signals.
Context captured once from task experience — never run `generate-context`, `copilot-shared`, or any build command.

**Core rules:**
- Direct patch only — no regeneration, no build commands
- One file, ≤10 lines per evolution action
- Non-blocking — never hold PR waiting for evolution
- UT/CT-only pipelines — skip project skill patches unless pattern is generic

## Triggers

**Manual** — after any task revealing a pattern: debugging insight, domain clarification,
workflow discovery, recurring pitfall, integration contract change.

**Automated** — token waste payload from `token-usage-prediction` (Stage 3).

**Code-change** — `check-drift.js` (agent Boot) flags stale mini-skills after a merge → re-sync them (workspace layout below).

## lessons.md — shared handoff point

Single format. No exceptions.

```
## YYYY-MM-DD — <pattern-name>
- what:   <what failed or was missing>
- rule:   <concrete rule to prevent recurrence>
- target: skill → {skill-name}/SKILL.md | agent → {agent-name}/.agent.md
```

- **Writes:** Planner (Phase 2 on reusable gap) · Implementer (correction or build loop) · Unit Tester (correction or HANDOFF) · Component Tester (correction or HANDOFF) · Reviewer (new pattern not already recorded)
- **Reads:** every agent at session start · orchestrator at boot
- **Promotes:** entry seen 2+ times → patch target, delete entry
  Triggered at: orchestrator boot · Planner Phase 5 · Stage 3
- **Max:** ≤20 entries — promote or delete before adding if exceeded

## Routing — target from lesson or payload, routing table as fallback only

```
if lesson.target == skill  → patch $activeSkill (knowledge gap)
if lesson.target == agent  → patch $agent.md    (behavior gap)
if target is null          → use routing table below
```

| Pattern                                 | Fallback target                              |
|-----------------------------------------|----------------------------------------------|
| Generic Java / Kotlin / reactive        | Shared → matching conventions skill          |
| Generic Kafka / Temporal / testing      | Shared → matching domain skill               |
| Generic build / compile                 | Shared → `maven-build-profiles` / `gradle-build-profiles` |
| Service-specific entity / contract      | Repo → `project-context` (legacy) **or** workspace mini-skill |
| Service-specific build quirk            | Repo → `project-context`                    |
| New/changed integration, endpoint, entity (workspace) | Repo → workspace mini-skill via `resolve-skill-target.js` |
| Routing or model issue                  | Shared → `execution-standards`              |

When pattern is specific to one repo → repo skill. When it would recur in any repo → shared skill.

**Workspace layout** (`.contmark/repos/<key>/<category>/`) — resolve the target deterministically, no guess:

```
contmark-workspace/resources/resolve-skill-target.js <root> --category <cat> --keywords "<words>" [--repo <key>]
   → patch <existing slug>  |  create <new slug>   (e.g. a new integration)
```

- **patch**  → add the `(source: path:line)` fact (≤10 lines); stamp `verified_against = HEAD` in `_index.json`
- **create** → write `repos/<key>/<category>/<slug>.md` + its `_index.json` entry, then re-index:
  `generate-indexes.js` → `generate-symbols.js` → `reconcile-router.js` → `validate-indexes.js`
- categories: domain · architecture · stack · runtime · contracts · integrations · operations · navigation

## Update algorithm

1. Resolve target: lesson.target → $activeSkill or $agent.md → fallback routing table
2. Find narrowest section in target file that owns this guidance
3. Check: rule already exists? Tighten wording — never duplicate
4. Same rule in multiple files? Keep best, replace others with a reference
5. Apply patch ≤10 lines · commit: `docs(skill): add <pattern> to <skill-name> [evolution]`

## Execute

```
1. Read    — lessons.md entries + token-usage-prediction payloads (both in Stage 3)
2. Route   — resolve target per entry: skill or agent.md
3. Check   — existing rule? tighten. New? add. Duplicate? reference only.
4. Patch   — apply ≤10 lines to target file
5. Promote — delete entry from lessons.md after patch
6. Commit  — docs(skill): add <pattern> to <skill-name> [evolution]
7. Verify  — never mark Stage 3 done without commit in PR body
```