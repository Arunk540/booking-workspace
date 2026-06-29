---
name: contmark-token-usage-prediction
description: Stage 3 token usage scan — % vs model cap, payload for evolution loop. Load when monitoring or trimming skill bloat.
---

# Token Usage — Scan, Show %, Build Payload

Runs in Stage 3. `$activeSkill` and agent variables already in working memory.
Reads active model directly from context — no pre-set required.

## Model cap

```
claude-*  → 200K  |  gpt-4*  → 128K  |  gemini-*  → 1M  |  default → 128K
pipelineBudget = modelCap × 2.5
stage ceilings (% of pipelineBudget):
  plan 10% | implement 40% | unit-test 20% | component-test 24%
```

## Calculate

Content rates:
```
prose         → chars ÷ 4
code          → chars ÷ 3
mixed/output  → chars ÷ 3.5
system prompt → chars ÷ 4   (re-sent every call — never skip)
```

Tool schema rates — re-sent with every API call, never skip:
```
IDE simple   (list_dir, run_in_terminal, show_content)          →  80 tokens each
IDE complex  (read_file, grep_search, edit, apply_patch)        → 120 tokens each
GitHub MCP   (get_issue, push_files, create_pr, search_code)    → 250 tokens each
Atlassian MCP (getJiraIssue, getConfluencePage, searchCQL)      → 300 tokens each
custom / unknown                                                 → 120 tokens each
```

Tool results — every MCP response, terminal output, file read, search result:
```
all tool results → chars ÷ 3.5
```

```
input  = user msgs + all tool results + tool schemas + system prompt
output = assistant msgs + tool call args
```

## Show %

```
call%     = thisCallTokens ÷ modelCap × 100
pipeline% = totalTokens ÷ pipelineBudget × 100
stage%    = stageTokens ÷ stageCeiling × 100
```

Print — append block to PR body in Stage 4:
```
plan        21K /  50K  42%
implement   98K / 200K  49%  [$kafkaSkill]  ⚠ one-shot 62% (target 80%)
unit-test   41K / 100K  41%
pipeline   184K / 500K  37%
```
`pipeline% > 100` → `RUNAWAY_PIPELINE`. STOP. Do not proceed to Stage 4.

## Waste signals

Scan conversation. At each occurrence record `$agent` running + `$activeSkill` active.

| Signal              | Pattern                                              | Agent        |
|---------------------|------------------------------------------------------|--------------|
| `RETRY_STORM`       | edit→bash→edit 3+ times in one stage                 | $implementer |
| `COMPILE_LOOP`      | same error string 2+ times                           | $implementer |
| `TEST_CHURN`        | same test file edited 3+ times                       | $unitTester  |
| `EXPLORATION_DRIFT` | file reads >30% of stage tokens, zero edits          | $planner     |
| `REDUNDANT_MCP`     | same MCP tool + same key param called 2+ times       | $agent       |
| `LARGE_OUTPUT`      | terminal/MCP result >2K tokens AND called 3+ times   | $implementer |
| `TOOL_BLAST`        | >15 tool calls in a single stage                     | $agent       |
| `REPEATED_READ`     | same file read 3+ times, zero edits between reads    | $agent       |

One-shot targets: implement ≥ 80% | unit-test ≥ 85% | component-test ≥ 75%

Routing threshold: 3+ occurrences this conversation OR one-shot misses 3 cycles → build payload.
Exception — `REDUNDANT_MCP`: route at first occurrence. One duplicate MCP call is already waste.
Hint = `lessons.md` entry written by `$agent` at time of correction. Read it — never invent it.

```
{ signal, agent: $agent, skill: $activeSkill, occurrences, hint: <lessons.md entry> }
```
Pass payload to `skill-evolution-loop` (already loaded in Stage 3).

## Execute

```
1. Model   — read active model from context → set modelCap + pipelineBudget
2. Count   — scan all messages + tool results + schemas, attribute to stage
3. Show %  — build token block, flag RUNAWAY_PIPELINE if pipeline% > 100
4. Scan    — detect all 8 signals, record $agent + $activeSkill at each occurrence
5. Hint    — read matching lessons.md entry for each signal at threshold
6. Payload — pass to skill-evolution-loop for each signal at threshold
```