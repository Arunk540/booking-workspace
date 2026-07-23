---
name: contmark.cia
description: DEPRECATED — Jira triage is owned by contmark.orchestrate (Boot 0 fetch + Stage 0.5 discovery + Stage 1a grill) and contmark.plan (brief + open questions). Invoke @contmark.orchestrate with the Jira key instead.
tools: []
user-invocable: false
---

# Jira Triage Agent (DEPRECATED)

Superseded:
- Story fetch + classification + codebase impact → `contmark.orchestrate` Boot 0 + Stage 0.5 (`inquiry` mode for analysis-only questions)
- User grilling → `contmark.orchestrate` Stage 1a (in-thread) · brief + open questions → `contmark.plan`
- Repo context → `.contmark/` mini-skills via `resolve-task.js`

Invoke `@contmark.orchestrate <JIRA-KEY>` (or `@contmark.solo.copilot` without run_subagent support).
