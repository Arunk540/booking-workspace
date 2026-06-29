---
name: contmark-execution-core
description: Boot-loaded baseline — terminal, timeouts, build loop, commits, prohibited actions, quality. Read ONCE at boot.
---

# Execution Core

Baseline rules every stage relies on. **Read once at boot.** Do not re-read in later stages — content is stable for the session.

> Routing, classification, phase ownership, lessons protocol → `execution-extras` (loaded only when needed).

---

## Prohibited Actions

| Prohibited | Reason |
|---|---|
| Agent running a build phase beyond its own | Duplicate work, 60–100s waste |
| Implementer running `test`/`verify`/`package`/`check`/`build` | Test execution belongs to test agents |
| Unit Tester recompiling main without `skip-main-recompile` | Wastes 60–100s; main already compiled |
| Unit Tester skipping full-suite regression | Regressions go undetected |
| Any agent running `clean` (exception: Avro schema change) | Destroys compiled classes next agent reuses |
| Crossing file ownership boundaries | Each agent owns exactly one file subtree |
| Multiple terminal sessions | Lost output, delayed response |

---

## Terminal Session Discipline

- One `run_in_terminal` / `Bash` at a time — always read output before the next
- Chain with `&&` in one call — never split
- Always read actual output — never assume
- One session per turn — never open new windows
- Never issue parallel terminal calls
- BUILD FAILURE → extract `ERROR`/`FAILED` lines only — never re-read full output

### Timeout Rules

Prefix every command with `timeout {N}`. **Claude Code:** also set `Bash(timeout: N×1000)` — both timers are independent, one does not protect the other.

| Operation | Timeout | On exit 124 |
|---|---|---|
| Compile | `timeout 180` | Retry once → still fails → escalate |
| Unit tests | `timeout 300` | Retry once → still fails → escalate |
| CT verify | `timeout 1500` | **Escalate immediately — no retry** |
| Any other | `timeout 120` | Retry once → still fails → escalate |

CT never retries on timeout — a second attempt wastes another 40 min on the same hang.

**Escalation format:** `TIMEOUT: {command} exceeded {N}s — last output: {last line} · pipeline stopped`

---

## Build Loop Discipline

RUN your agent command → READ output → IF BUILD FAILURE: fix in your scope, REPEAT → WHEN BUILD SUCCESS + 0 failures: emit READY. Never hand off with a failing build.

---

## Google Java Style

When `google_checks.xml` is checkstyle config: 2-space indent, 100-char limit, static→third-party→`java.*` imports, braces on all blocks, Javadoc on public API. Never suppress with `@SuppressWarnings("checkstyle")`.

---

## Commit Convention

`<type>(<scope>): <what changed>` — Types: `feat` · `fix` · `refactor` · `test` · `docs` · `chore`.
Agent types: Implementer → `feat`/`fix` · Unit Tester → `test` · Component Tester → `test`.
`git add <specific files>` → `git commit`. Never `git add .`. Never push — Orchestrator handles PR.

---

## Change Sizing

~100 lines ideal · ~300 acceptable · ~500+ split.

---

## Code Quality Signals

| Signal | Action |
|---|---|
| Deep nesting (3+ levels) | Extract guard clauses / helpers |
| Long methods (50+ lines) | Split by responsibility |
| Generic names (`data`, `temp`) | Rename to describe content |
| Dead code / unused imports | Remove |
