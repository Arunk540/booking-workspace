---
name: contmark-token-usage-prediction
description: Token usage report + waste-signal scan. Load ONLY when the runtime exposes real usage counters (harness metrics or IDE cache). The live-window guard lives in execution-core — not here.
---

# Token Usage — Report % + Build Waste Payload

**Precondition:** real usage counters available (harness-reported tokens, VS Code `state.vscdb`, Claude JSONL, or IntelliJ plugin logs). None available → emit `token_block: unavailable` and STOP — never estimate by re-scanning the conversation (that scan is itself `REPEATED_READ` waste).

The stage-boundary guard (50/65/85 thresholds, model caps) is `execution-core §Live-Window Guard` — agents run it inline without loading this skill.

## Budgets

```
modelCap: claude-* 200K | gpt-4* 128K | gemini-* 1M | default 128K
liveWindow = pipelineBudget = modelCap        ← the REAL window; raise ONLY if the
                                                runtime verifiably isolates sub-agent windows
stage ceilings (% of pipelineBudget):
  plan 10% | implement 40% | unit-test 20% | component-test 24%
```

## Report

```
live%     = currentThreadTokens ÷ liveWindow    × 100
stage%    = stageTokens         ÷ stageCeiling  × 100
pipeline% = totalTokens         ÷ pipelineBudget × 100
```

Append to PR body (claude 200K example):
```
live       118K / 200K  59%  ⚠ past smart zone — compact next stage
plan        18K /  20K  90%
implement   96K /  80K 120%  [$kafkaSkill]  ⚠ over ceiling · one-shot 62% (target 80%)
unit-test   34K /  40K  85%
pipeline   162K / 200K  81%
```
`pipeline% > 100` → `RUNAWAY_PIPELINE` — record for PR body + evolution.

## Waste signals

At each occurrence record `$agent` + `$activeSkill`.

| Signal | Pattern | Agent |
|---|---|---|
| `RETRY_STORM` | edit→run→edit 3+ times in one stage | $implementer |
| `COMPILE_LOOP` | same error string 2+ times | $implementer |
| `TEST_CHURN` | same test file edited 3+ times | $unitTester |
| `EXPLORATION_DRIFT` | file reads >30% of stage tokens, zero edits | $planner |
| `REDUNDANT_MCP` | same MCP tool + same key param 2+ times | $agent |
| `LARGE_OUTPUT` | tool result >2K tokens AND called 3+ times | $implementer |
| `TOOL_BLAST` | >15 tool calls in one stage | $agent |
| `REPEATED_READ` | same file read 3+ times, zero edits between | $agent |

One-shot targets: implement ≥80% · unit-test ≥85% · component-test ≥75%.
Routing threshold: 3+ occurrences OR one-shot misses 3 cycles → build payload. Exception `REDUNDANT_MCP`: route at FIRST occurrence.
Hint = the `lessons.md` entry written at correction time — read it, never invent it.

```
{ signal, agent: $agent, skill: $activeSkill, occurrences, hint: <lessons.md entry> }
```

Pass each payload to `skill-evolution-loop`.

## Execute

```
1. Counters — verify real usage source; absent → token_block: unavailable, STOP
2. Report  — build token block; flag RUNAWAY_PIPELINE if pipeline% > 100
3. Scan    — 8 signals, record $agent + $activeSkill per occurrence
4. Payload — per signal at threshold, with lessons.md hint → skill-evolution-loop
```
