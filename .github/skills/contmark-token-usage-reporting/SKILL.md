---
name: contmark-token-usage-reporting
description: >
  Team-level and session-level token usage report generation. Formats raw token metrics
  collected by token-usage-prediction into human-readable summaries for PR bodies,
  sprint retrospectives, and engineering dashboards. Covers per-stage breakdown,
  one-shot rate trending, waste classification, and cost estimation.
  Load this skill when the Orchestrator or a team lead needs to produce a structured
  token usage report from collected session data. Not for data collection — use
  token-usage-prediction for that.
---

# Token Usage Reporting

Turns raw token usage snapshots (collected by `token-usage-prediction`) into structured
reports for PR bodies, sprint reviews, and team dashboards.

> **Scope:** Read-only formatting and calculation. No file writes beyond the report output.
> All source data comes from `token-usage-prediction` output — this skill never reads IDE cache files directly.

---

## Use This Skill When

- The Orchestrator has completed a pipeline and `token-usage-prediction` produced a usage snapshot
- A team lead wants a sprint-level roll-up of token consumption across multiple sessions
- An agent is producing the PR body and must append the standard token usage block
- A developer wants to understand which pipeline stage consumed the most tokens in a session
- Comparing cost between two agent configurations or prompt strategies

## Do Not Use This Skill When

- Collecting raw token data from IDE caches — use `token-usage-prediction` for that
- Triggering skill evolution — use `skill-evolution-loop` for that
- The `token-usage-prediction` stage was skipped (no data available) — omit the report block silently

---

## Part 1 — PR Body Token Block (Per-Session)

Append this block at the **bottom of every PR body**, after all other sections.

### Format

```markdown
---
### Token Usage Summary

| Stage | Tokens In | Tokens Out | Total | 1-Shot? |
|-------|-----------|------------|-------|---------|
| Plan | 12,400 | 2,100 | 14,500 | ✅ |
| Implement | 38,200 | 8,900 | 47,100 | ✅ |
| Review | 9,800 | 1,600 | 11,400 | ✅ |
| Unit Test | 14,300 | 3,200 | 17,500 | ✅ |
| Component Test | 11,100 | 2,800 | 13,900 | ✅ |
| **Total** | **85,800** | **18,600** | **104,400** | |

**One-shot rate:** 5/5 stages (100%)
**Estimated cost:** ~$0.31 (GPT-4o) / ~$0.47 (Claude Sonnet)
**Waste signals:** None detected
```

### Calculation Rules

| Metric | Formula |
|---|---|
| Total tokens | `tokens_in + tokens_out` per stage, summed |
| One-shot rate | `stages_completed_in_one_attempt ÷ total_stages × 100%` |
| Estimated cost | Apply current model pricing to `tokens_in` and `tokens_out` separately |
| Waste signal | Any stage with `retry_count > 0` or `tokens_in > stage_baseline × 1.5` |

### Baseline Token Budgets (Per Stage)

| Stage | Baseline (tokens in) | Threshold (flag if exceeded) |
|---|---|---|
| Plan | 15,000 | 22,500 |
| Implement | 40,000 | 60,000 |
| Review | 12,000 | 18,000 |
| Unit Test | 15,000 | 22,500 |
| Component Test | 12,000 | 18,000 |
| PR Delivery | 5,000 | 7,500 |

---

## Part 2 — Sprint Roll-Up Report

Aggregate multiple session snapshots (typically 1 sprint = 2 weeks).

### Format

```markdown
## Token Usage Report — Sprint 42 (2026-05-06 → 2026-05-20)

### Summary
- **Total sessions:** 12
- **Total tokens consumed:** 1,247,300
- **Average tokens per PR:** 103,942
- **Overall one-shot rate:** 88%
- **Estimated total cost:** ~$3.74

### By Stage (Aggregated)
| Stage | Avg Tokens | One-Shot Rate | Top Waste Signal |
|-------|-----------|---------------|-----------------|
| Plan | 13,200 | 95% | — |
| Implement | 44,100 | 82% | Stale workspace mini-skills |
| Review | 10,800 | 91% | — |
| Unit Test | 16,200 | 88% | Missing mock patterns |
| Component Test | 13,400 | 90% | — |

### Top Waste Patterns This Sprint
1. **Stale workspace mini-skills** — 3 sessions × ~8,000 extra tokens each → re-sync stale mini-skills (check-drift.js → skill-evolution-loop)
2. **Missing mock patterns** — unit-testing-java skill lacks `@MockBean` examples for Kafka consumers

### Recommended Actions
- [ ] Re-sync stale `.contmark/` mini-skills for `telikos-booking-service` (check-drift.js flagged)
- [ ] Add `@MockBean` Kafka consumer example to `unit-testing-java` skill
```

---

## Part 3 — Waste Classification

When `token-usage-prediction` flags waste signals, classify them before including in the report.

| Waste signal | Classification | Recommended action |
|---|---|---|
| `retry_count > 2` on Implement stage | **High waste — skill gap** | Trigger `skill-evolution-loop` on the active skill |
| `tokens_in > 2× baseline` on any stage | **High waste — context bloat** | Check if `.contmark/` mini-skills or skill content has grown stale (run check-drift.js) |
| `retry_count == 1` on Review stage | **Medium waste — review ambiguity** | Review `code-review-checklist` trigger description |
| All stages green, total > 150,000 | **Low waste — large story** | Normal; note in report but no action needed |
| `1-shot rate < 70%` across sprint | **Systemic waste** | Full sprint retrospective; review top 3 triggering skills |

---

## Common Mistakes to Avoid

- **Including token data when `token-usage-prediction` was skipped** — omit the PR block entirely if no snapshot exists; never fabricate numbers
- **Reporting total tokens without the per-stage breakdown** — the breakdown is where actionable insights live
- **Conflating retry tokens with first-attempt tokens** — count retry attempts separately to avoid inflating one-shot rate
- **Applying a single cost rate to all models** — always note the model name alongside the cost estimate
- **Omitting waste signals from the PR body** — waste signals are the primary value of this report; surfacing them drives skill improvement

---

## Evaluation Cases

| # | Input | Expected output |
|---|-------|-----------------|
| 1 | `token-usage-prediction` snapshot with 5 stages, all 1-shot | PR body block with 100% one-shot rate, no waste signals |
| 2 | Snapshot with Implement stage at retry_count = 2 | PR body block flags "High waste — skill gap" on Implement; `skill-evolution-loop` triggered |
| 3 | Sprint data for 10 sessions | Sprint roll-up with aggregated averages, top 2 waste patterns, recommended actions |
| 4 | `token-usage-prediction` was skipped (no data) | No token block added to PR; no error surfaced |
| 5 | Implement stage tokens_in = 95,000 (baseline 40,000) | Classified as "High waste — context bloat"; recommendation to run check-drift.js |

---

## Metadata

| Field | Value |
|---|---|
| Owner | Telikos Engineering |
| Last reviewed | 2026-05-20 |
| Supported tools | Claude Code, GitHub Copilot |
| Supported repos | All backend services |
| Security classification | Internal |
| Evaluation status | Not evaluated |
| Dependencies | token-usage-prediction, skill-evolution-loop |
