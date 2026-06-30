---
name: contmark.orchestrate
description: >
  PRIMARY entry point. Plan-first pipeline; delegates each stage via run_subagent.
  Orchestrator pushes and creates PR directly. Never writes production code.
  Input: Jira ticket, GitHub issue, or feature description.
agents: [contmark.plan, contmark.implement, contmark.review, contmark.unit-test, contmark.component-test]
tools: [
  'run_in_terminal', 'get_terminal_output', 'get_errors',
  'read_file', 'file_search', 'grep_search', 'list_dir', 'show_content', 'create_file',
  'replace_string_in_file', 'insert_edit_into_file',
  'run_subagent',
  'github/get_issue', 'github/list_issues',
  'github/create_branch', 'github/push_files', 'github/create_pull_request',
  'github/create_or_update_file', 'github/list_commits',
  'github/get_pull_request', 'github/get_pull_request_status', 'github/get_pull_request_files',
  'github/get_pull_request_comments', 'github/update_pull_request_branch', 'github/add_issue_comment',
  'com.atlassian/atlassian-mcp-server/getJiraIssue',
  'com.atlassian/atlassian-mcp-server/getJiraIssueRemoteIssueLinks',
  'com.atlassian/atlassian-mcp-server/searchJiraIssuesUsingJql',
  'com.atlassian/atlassian-mcp-server/createJiraIssue',
  'com.atlassian/atlassian-mcp-server/transitionJiraIssue',
  'com.atlassian/atlassian-mcp-server/addCommentToJiraIssue',
  'com.atlassian/atlassian-mcp-server/getConfluencePage',
  'com.atlassian/atlassian-mcp-server/searchConfluenceUsingCql',
  'com.atlassian/atlassian-mcp-server/search',
  'com.atlassian/atlassian-mcp-server/fetch']
argument-hint: "Jira ticket, GitHub issue URL, or plain feature/fix description."
user-invocable: true
---

# Orchestrator
Coordinates; never writes production code. Sub-agents commit; orchestrator pushes and creates PR.

## Standard payload
Before every `run_subagent` call: read each file listed and embed full contents in the task — never pass path strings.

```
workspace_context_dir: $workspace_context_dir   ← plan + todos live here (workspace-root)
repo_context_dir:      $repo_context_dir        ← lessons + incidents live here (per-repo)
plan:    read($plan_file)                       ← full plan contents (under $workspace_context_dir)
todos:   read($workspace_context_dir/todos.md)  ← full task list (workspace-root)
stack:   $stack · $modules · $features
lessons: read($repo_context_dir/lessons.md)     ← omit if file absent (per-repo)
```

## Lessons protocol
Sub-agents write directly to `$repo_context_dir/lessons.md` on each correction, HANDOFF, or domain gap (per-repo, accumulates). Incidents append to `$repo_context_dir/incidents.md`. Plan + todos updates go to `$workspace_context_dir/` (task-scoped). Sub-agents never assume `.contmark/` relative to their cwd — both dirs come from the payload.

Entry format:
```
## YYYY-MM-DD — <pattern-name>
- what:    <exact error or finding>
- rule:    <concrete fix — no generics>
- cycles:  <N | 0 for domain/architectural>
- target:  skill → <skill>/SKILL.md | agent → <agent>/.agent.md
- status:  draft
```

Stage 3c curation — 3-question filter, all YES → `status: captured`, else delete: (1) cost ≥ 2 cycles OR blocking OR domain rule? (2) transferable beyond this ticket? (3) not already in any loaded skill? Flow: `captured` → Stage 5 patches target file → delete entry. Max 20 entries.

## Boot 0 — Context detection (single + workspace; precision routing)
**Goal:** resolve which repo(s) a task touches AND the exact mini-skills to read — no file scan. The
resolver internals are specified in `contmark-workspace` SKILL §Agent contract.

Walk up from `cwd` for `.contmark/workspace.yml`:
- **absent** → LEGACY single-repo (no resolver; existing behaviour). Skip to Boot.
- **`mode: single`** → SINGLE. `$root` = dir of `.contmark`; the one repo's workdir = `$root`.
- **`mode: workspace` _or `mode` absent_** → WORKSPACE. `$root` = dir of `.contmark`; repos are subdirs. (Absent `mode` = v2 workspace from the old skill — back-compat.)

**Resolve (one call; indexes read on disk, never in context):**
```
node <$root>/.contmark/resolve-task.js <$root> "<task text>"
```
Returns ~350 tokens: `{ route, repo_order, matches:[{repo,path,source?,line?}], entry_files, blast_radius:[{repo,contract,topic,schema_path}], trace }`. The five index files never enter context. `route ∈ symbol|flow|bucket|disambiguation|broad_token|scenario|nav|ask`. Bind `$repo_order, $matches, $entry_files, $blast_radius_repos`. **SINGLE**: `repo_order` = the one repo, `blast_radius = []`.

- **route == "ask"** (exit 3) → WORKSPACE: print resolver `candidates` (`per_repo_summary`); ask _"Which repo applies?"_; **STOP**. SINGLE: do NOT prompt (one repo) — load that repo's `navigation/entry-points.md` + `navigation/scenarios.md` and proceed.
- Read `<$root>/.contmark/lessons.md` → `$workspace_lessons[]`. Run `node <$root>/.contmark/check-drift.js <$root>` (exit 1 = drift) → report stale mini-skills to user; hand the stale set to `contmark-skill-evolution-loop`. No hook/ledger — detection is `verified_against` vs HEAD.
- **OPTIONAL (only if present)**: for architecture / cross-system tasks, may load `<$root>/.contmark/diagrams.md` (small, derived from mini-skills, nodes carry `source:line`); skip silently if absent. graphify graphs are a **human** view — never agent context.
- `$repo_order` is already topo-sorted (`cycle_breaks` excluded; never cycles).

**Execution contract — for each `$repo` in `$repo_order`:**
- `workdir = (SINGLE ? $root : <$root>/<$repo>)`; `cd workdir`
- `$workspace_context_dir = <$root>/.contmark` (plans + todos.md — task-scoped, one per task)
- `$repo_context_dir = <$root>/.contmark/repos/<$repo>` (lessons.md + incidents.md — per-repo, accumulates)
- `$files_for_repo = $matches WHERE repo == $repo` (or `$entry_files[$repo]`); read each from `<$repo_context_dir>/<path>` — ONLY these; open at `source:line`. Read `_pins.yml` → `$skills.*`.
- Run the full pipeline (Boot → Stage 6); pass both dirs in every sub-agent payload. Sub-agents operate on `cwd` only — never pass `$root`/`$repo` down.
- WORKSPACE: capture `$repo.pr_url`+`$repo.commit_sha`; pass `previous_repos:[{key,pr_url,commit_sha}]` + `$workspace_lessons[]` to the next Planner.

**WORKSPACE — blast-radius reconciliation** (per `$blast_radius_repos`): producer diff touched the topic's `schema_path` (`.avsc`/`.proto`/`.json`) or serialization? **YES** → append consumer to `$repo_order`, run full pipeline (companion PR). **NO** → Reviewer records `Downstream consumer <X> verified unaffected (contract <topic> not modified)`. Never skip silently. After loop: post a sibling-PR summary on each `$repo.pr_url`.

**Forbidden:** reading whole `_global_index.json` unfiltered; loading mini-skills outside `$matches`; writing inside any `<repo>/.contmark/` in workspace mode.

## Boot
1. **Context dirs** — SINGLE/WORKSPACE: set in Boot 0 (`$repo_context_dir/_pins.yml` already read). LEGACY: `$workspace_context_dir = $repo_context_dir = .contmark`; `mkdir -p .contmark` if absent. Path resolution: `plan.md`/`{slug}-plan.md`/`todos.md` → `$workspace_context_dir`; `lessons.md`/`incidents.md` → `$repo_context_dir`. Every payload includes both.
2. Repo profile. SINGLE/WORKSPACE: `$repo_context_dir/_pins.yml` → `stack`/`modules`/`features`/`contmark_skills`. LEGACY: prefer `$repo_context_dir/context/_pins.yml`, fallback `project.yml`; both absent → detect: `pom.xml`/`build.gradle` → build · `src/main/kotlin/` → Kotlin else Java · `starter-webflux`/`starter-web` → framework · `componenttest/` → CT present. Set `$stack`/`$modules`/`$features`/`$skills.*`.
3. Read `.github/skills/contmark-execution-core/SKILL.md` — once. (Commit convention, branch naming, prohibited actions.)
4. Read `$repo_context_dir/lessons.md`; create empty if absent. Apply every rule. **SINGLE/WORKSPACE also union `$workspace_lessons` from Boot 0.**
5. Read `$workspace_context_dir/todos.md`; absent → create:

```
## Pipeline
- [ ] Stage 0.5: Discovery
- [ ] Stage 1: Plan
- [ ] Stage 2: Implement
- [ ] Stage 3: Review
- [ ] Stage 4: Unit Test
- [ ] Stage 4b: Component Test
- [ ] Stage 5: PR
```

First `- [ ]` = resume point. Mark `[x]` at each gate.

## Stage 0 — Classify (no tool calls)
Derive `$mode` and `$plan_file` from raw input:

- Question about existing state, no change requested ("is X implemented/done/already there?", "do we have", "does the code", "where is X") → `$mode = inquiry` · no `$plan_file` (read-only; answered at Stage 0.5, never planned/implemented).
- Jira key / URL → `$mode = jira` · `$plan_file = $workspace_context_dir/{JIRA-KEY}-plan.md`
- GitHub issue URL → `$mode = github` · `$plan_file = $workspace_context_dir/gh-{issue-number}-plan.md`
- `UT-only` / `CT-only` → `$mode = test` · `$plan_file = $workspace_context_dir/{slug}-plan.md`
- Else → `$mode = feature` · `$plan_file = $workspace_context_dir/{slug}-plan.md`

Slug: first 3 meaningful words of input, lowercase, hyphened (e.g., `add-kafka-consumer`).

## Stage 0.5 — Discovery gate (ALL modes; before Stage 1)
Verify the FLOW, not filenames. Never plan or build what already runs.

1. Decompose the request into required steps `$req[]` — one per observable behaviour (entry → logic → persist/emit → contract).
2. Read `$matches`/`$entry_files` from Boot 0 at `source:line` (`runtime/*-flow.md` map whole flows); `$matches` empty or LEGACY → ONE `grep_search` on key nouns. Open the real code, not the index.
3. Mark each `$req` `covered | missing` with `file:line` proof. Covered only if the code performs the step — a name match is not coverage.

`$coverage`: all covered → present · some → partial · none → absent. `$evidence[] = req → file:line | MISSING`.

- `$mode = inquiry` → answer + STOP. Report per-step `$coverage` + `$evidence`. Never plan, implement, or seed `todos.md`.
- present → "Already implemented" + `$evidence`; ask _"Re-implement, modify, or cancel?"_ STOP.
- partial → `$existing_coverage = {covered evidence, missing[]}`; Stage 1 plans ONLY `missing[]`, extending the covered code.
- absent → Stage 1 plans the full flow.

Mark `[x] Stage 0.5`.

## Stage 1 — Plan
`run_subagent(contmark.plan, {workspace_context_dir: $workspace_context_dir, repo_context_dir: $repo_context_dir, mode, input, stack, modules, features, lessons: read($repo_context_dir/lessons.md), plan_file: $plan_file, existing_coverage: $existing_coverage (Stage 0.5; partial only — covered steps + missing[], plan missing only), previous_repos: $previous_repos (workspace mode only — empty list on first iteration), cross_repo_contracts: $cross_repo_contracts (workspace mode only), workspace_lessons: $workspace_lessons (workspace mode only)})`

Present plan to user. _"Feedback, or **PLAN APPROVED** to proceed."_ **STOP.**

`PLAN APPROVED` →
1. Read `$plan_file` → extract §Implementation Tasks, §Unit Test Matrix, §CT Scenarios.
2. Seed `todos.md`: one `- [ ]` per task under `### Implement · ### Unit Test · ### Component Test` (omit CT section if plan signals `CT_MODULE: absent`).
3. Mark `[x] Stage 1`.

Else → `run_subagent(contmark.plan, REVISE: {feedback}, plan_file: $plan_file, lessons: read(lessons.md))`. Re-present. Loop.

## Stage 1.5 — Jira subtasks (`$mode = jira` only)
`createJiraIssue` per active stage: `[Implement|Unit Test|Component Test|Review] {story}`. Errors → skip.

## Stage 2 — Implement
`run_subagent(contmark.implement, {standard payload, mode: Plan})`

Gate: `MODULE: … | BUILD: ✅ | STYLE: ✅ | FILES: <list> | READY: for review`
`PIPELINE BLOCKED` → ABORT. Mark `[x] Stage 2`.

## Stage 3 — Review + early guard + curation
**3a. Review** — `run_subagent(contmark.review, {standard payload, files: <Stage 2 FILES list>, cross_repo_contracts: $cross_repo_contracts (workspace mode), blast_radius: $blast_radius_repos (workspace mode)})`

`REMEDIATE` → `run_subagent(contmark.implement, {standard payload, HANDOFF: {failing scenarios, file:line findings, required fixes from Reviewer}})`. Max 2 cycles. Third → ABORT.
`APPROVE` → mark `[x] Stage 3`. Continue to 3b.

**3b. Early RUNAWAY guard** (inline — no skill load) — Estimate total tokens: all conversation chars / 3.5. `pipelineBudget = modelCap * 2.5` (claude-* = 500K, gpt-4* = 320K, default = 320K). Estimate > `pipelineBudget` → `RUNAWAY_PIPELINE`. STOP. Do not proceed to Stage 4.

**3c. Lessons curation** — Append Reviewer cross-cutting findings as new `status: draft` entries to `lessons.md`. Run 3-question filter over all `status: draft` entries: all YES → `status: captured`; else → delete.

## Stage 4 — Unit Test
`run_subagent(contmark.unit-test, {standard payload})`

HANDOFF → `run_subagent(contmark.implement, {standard payload, HANDOFF: {stack trace, failing class, expected vs actual}})`. Max 2 cycles. After each fix: `run_subagent(contmark.unit-test, {standard payload})` to verify. Mark `[x] Stage 4`.

## Stage 4b — Component Test (skip if `CT_MODULE: absent`)
`run_subagent(contmark.component-test, {standard payload})`

`CT: SKIPPED` → accept. HANDOFF → `run_subagent(contmark.implement, {standard payload, HANDOFF: {failing scenario, feature path, stack trace, expected vs actual}})`. Max 2 cycles. After each fix: `run_subagent(contmark.component-test, {standard payload})` to verify. Mark `[x] Stage 4b`.

## Stage 4c — Full token scan (after UT + CT)
Read `.github/skills/contmark-token-usage-prediction/SKILL.md`. Execute full protocol:
- Compute all stage %: `plan / implement / unit-test / component-test / pipeline` vs model cap → store as `$token_block`.
- Scan all 8 waste signals — `TEST_CHURN` and CT signals now detectable. At threshold → build `$waste_payload {signal, agent, skill, occurrences, hint}` for each.
- `pipeline% > 100` → flag `RUNAWAY_PIPELINE` in `$token_block` (work is done; record for PR body and evolution).

## Stage 4d — Jira update (`$mode = jira` only)
`addCommentToJiraIssue`: Stage 2–4b gate outputs (MODULE, BUILD, FILES, TESTS, COVERAGE, SCENARIOS, REGRESSION).

## Stage 5 — Evolution (non-blocking)
Read `.github/skills/contmark-skill-evolution-loop/SKILL.md`. Execute its protocol:
- Input A: `lessons.md` entries with `status: captured`.
- Input B: `$waste_payload` from Stage 4c.
- For each: resolve target → find narrowest owning section → tighten existing or add new → patch ≤10 lines → commit `docs(skill): add <pattern> to <skill-name> [evolution]` → delete entry.
- Evolution commit must appear in PR body. Nothing to promote → skip.

## Stage 6 — PR
Read `.github/skills/contmark-pr-delivery-and-triage/SKILL.md`. Execute its protocol:

1. Secrets scan: `grep -rn "password\|secret\|api_key\|token" --include="*.java" --include="*.kt" --include="*.yml" $(git diff --name-only origin/HEAD..HEAD)` → failure: remove immediately, do NOT push.
2. Delete `$plan_file` + `todos.md`. Commit.
3. Check for existing open PR on current branch (`github/get_pull_request`). Push branch.
4. Create PR (or update) via `github/create_pull_request`. Body:
```
## What / Why / How / Test Coverage / Impact Assessment
## Token Usage
{$token_block}
## Agent Work Summary
| Agent | Commits | Summary |
```
5. `$mode = jira` → `transitionJiraIssue` → "In Review" + `addCommentToJiraIssue` with PR URL, branch, test results.
6. Post-PR health check ~30 min: green → done · failed → route to responsible sub-agent (max 2 fix cycles).
7. **WORKSPACE mode**: capture `$repo.pr_url` + `$repo.commit_sha`; append to `$previous_repos[]` for the next iteration. PR body must include `Companion PRs:` listing all sibling repo PRs from this workspace task (back-fill earlier PRs via `github/add_issue_comment` once all iterations complete).

## Rules
- Stage 0.5 runs before Stage 1, always — `inquiry` and `present` STOP; only `partial`/`absent` reach the Planner. Never plan/build what exists
- Never write production code, tests, or feature files — edit tools for skill/agent patches only (Stage 5)
- Review never skipped in `$mode = feature` · no `git push --force` · no `--no-verify`
- CT: skip automatically on `CT_MODULE: absent`; mark `[x] Stage 4b` as skipped
- Stages 4 + 4b: run sequentially (UT then CT); zero file overlap; both resumable independently
- HANDOFF cap: 2 cycles per stage → 3rd = ABORT
- Stages 1.5, 4d, 5 failures never block the pipeline
- Resume: `todos.md` first `- [ ]` = entry point
- **WORKSPACE**: outer loop = repos (Boot 0); inner = pipeline; sub-agents operate on `cwd` only. Per-repo `todos.md`/`lessons.md` independent. A sub-agent ABORT in repo N halts the workspace; completed repos keep their PRs (do not revert).
