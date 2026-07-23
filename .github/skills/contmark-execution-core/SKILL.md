---
name: contmark-execution-core
description: Boot-loaded baseline — paths, lessons format, naming contract, live-window guard, terminal, build loop, commits, prohibited actions. Read ONCE at boot.
---

# Execution Core

Read once at boot. Never re-read — content is stable for the session.

## State-File Paths

Payload provides both dirs — never assume `.contmark/` at cwd:

| Dir | Files |
|---|---|
| `{workspace_context_dir}` | `plan.md` · `{slug}-plan.md` · `todos.md` · `handoff.md` |
| `{repo_context_dir}` | `lessons.md` · `incidents.md` |

## Lessons Entry Format

Single format, no exceptions:

```
## YYYY-MM-DD — <pattern-name>
- what:   <exact error or finding>
- rule:   <concrete fix — no generics>
- target: skill → <skill>/SKILL.md | agent → <agent>/.agent.md
```

## Naming Contract (`glossary_hits`)

Each hit maps a ticket word to the real code symbol: `matched → canonical` + enum `values` + `source` file:line.
- Bind to `canonical` — never coin a field/method/enum from a ticket word (ticket "flow" → existing `transportActivity (EXPORT|IMPORT)`, never a new `flow` field).
- Low-confidence or missing mapping → user question **with options**, never a silent bind or a guess.

## Live-Window Guard (smart zone <100K)

`est = conversation chars ÷ 3.5` · `live% = est ÷ modelCap` (claude-* 200K · gpt-4* 128K · gemini-* 1M · default 128K). `pipelineBudget = modelCap`. Check at every stage boundary:

| live% | Action |
|---|---|
| ≥ 50% | WARN — payloads carry paths not blobs; persist ticket/plan to disk |
| ≥ 65% | `CONTEXT_PRESSURE` — compact or split BEFORE the next sub-agent call |
| ≥ 85% | STOP |

## Prohibited Actions

| Prohibited | Reason |
|---|---|
| Agent running a build phase beyond its own | Duplicate work, 60–100s waste |
| Implementer running `test`/`verify`/`package`/`check`/`build` | Test execution belongs to test agents |
| Unit Tester recompiling main without `skip-main-recompile` | Main already compiled |
| Unit Tester skipping full-suite regression | Regressions go undetected |
| Any agent running `clean` (exception: Avro schema change) | Destroys compiled classes next agent reuses |
| Crossing file ownership boundaries | Each agent owns exactly one file subtree |
| Multiple terminal sessions | Lost output, delayed response |

## Terminal Discipline

- One terminal call at a time — read output before the next; chain with `&&`; never parallel calls
- BUILD FAILURE → extract `ERROR`/`FAILED` lines only — never re-read full output

Prefix every command with `timeout {N}`. **Claude Code:** also set `Bash(timeout: N×1000)` — the timers are independent.

| Operation | Timeout | On exit 124 |
|---|---|---|
| Compile | `timeout 180` | Retry once → escalate |
| Unit tests | `timeout 300` | Retry once → escalate |
| CT verify | `timeout 1500` | **Escalate immediately — no retry** |
| Any other | `timeout 120` | Retry once → escalate |

Escalation: `TIMEOUT: {command} exceeded {N}s — last output: {last line} · pipeline stopped`

## Build Loop

RUN your agent command → READ output → BUILD FAILURE: fix in your scope, repeat → BUILD SUCCESS + 0 failures: emit READY. Never hand off a failing build.

## Google Java Style

When `google_checks.xml` is checkstyle config: 2-space indent, 100-char limit, static→third-party→`java.*` imports, braces on all blocks, Javadoc on public API. Never `@SuppressWarnings("checkstyle")`.

## Commit Convention

`<type>(<scope>): <what changed>` — `feat` · `fix` · `refactor` · `test` · `docs` · `chore`.
Implementer → `feat`/`fix` · testers → `test`. `git add <specific files>`, never `git add .`. Never push — Orchestrator owns the PR.

## Core Principles

- **Simplicity First** — simplest change, minimal code impact, one task per sub-agent
- **No Laziness** — root causes only; no temporary fixes; senior standards
- **Minimal Impact** — touch only what's necessary; note out-of-scope issues, don't fix them
- **Verification Before Done** — never claim complete without proof (diff, test run, log)
- **Demand Elegance (balanced)** — >50-line change: pause, ask "simpler way?"; skip for trivial fixes

## Change Sizing & Quality Signals

~100 lines ideal · ~300 acceptable · ~500+ split.

| Signal | Action |
|---|---|
| Deep nesting (3+) | Guard clauses / helpers |
| Long methods (50+) | Split by responsibility |
| Generic names (`data`, `temp`) | Rename |
| Dead code / unused imports | Remove |
