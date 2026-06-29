---
name: contmark-pr-delivery-and-triage
description: Orchestrator-only PR delivery — create PR, secrets scan, post-PR health check, Jira update. Load at Stage 6.
---

# PR Delivery & Triage

Agents commit. Pipeline endpoint delivers PR. No user confirmation.

---

## PR Body Formatting (MANDATORY)

Never use `\n` escape sequences — use actual multiline strings. GitHub renders `\n` as literal text.

---

## Quality Gate (Before Push)

Only secrets scan at delivery time — build/test already verified by responsible agents:

```bash
grep -rn "password\|secret\|api_key\|token" --include="*.java" --include="*.kt" --include="*.yml" $(git diff --name-only HEAD)
```

Failure → remove immediately, do NOT push.

---

## Agent Commit Protocol

Sub-agents commit per execution-standards §Commit convention. Orchestrator never commits — pushes and creates PR only.

---

## PR Delivery (End of Pipeline)

```
1. CURRENT_BRANCH = git branch --show-current
2. Check existing PR: gh pr list --head CURRENT_BRANCH --state open
3. IF exists: git push → update PR body if needed
4. IF not: create FEATURE_BRANCH = feature/<jira-id>-<slug>
   → git checkout -b FEATURE_BRANCH
   → git push -u origin FEATURE_BRANCH
   → create PR via GitHub MCP (base = CURRENT_BRANCH)
```

**Rules:**
- Auto-delivery — never ask permission
- One branch = one PR
- No force-push
- Base = branch you were on (never hardcode `main`)
- MCP-first, `gh` CLI fallback
- Push failure → report exact git error + provide retry command · never silently exit

---

## PR Body Template

```markdown
## What
[Summary]
## Why
[Ticket/motivation]
## How
[Approach]
## Test Coverage
- [ ] Unit tests  - [ ] Component tests
## Impact Assessment
[Blast radius]
## Agent Work Summary
| Agent | Commits | Summary |
## Companion PRs           ← workspace mode only; omit in single-repo
- <sibling-repo-key> — <PR_URL>
- …
```

---

## Workspace Mode (multi-repo)

`cwd` already scoped to the current repo by the outer loop in `orchestrate`/`solo.*`. This skill always operates on `cwd` — one invocation creates one PR for the current repo. Per-repo iteration in the wrapper naturally produces **one PR per repo**.

Workspace-specific behaviour:

1. Read `$previous_repos[]` from agent context. Each entry: `{key, pr_url, commit_sha}`.
2. Render `## Companion PRs` section listing sibling-repo PR URLs.
3. After the workspace loop completes, the wrapper agent back-fills earlier PRs with the full sibling list via `github/add_issue_comment` (carries the same `## Companion PRs` block as a comment).
4. Jira update fires per repo as usual; PR URL in the comment is the current repo's.

Branch naming in workspace mode: `feature/<jira-id-or-slug>` per repo. **No cross-repo branch coordination.** Each repo's PR is independent at the git level; linkage is body-only.

Single-repo mode: omit the `## Companion PRs` section. Behaviour unchanged from today.

---

## Jira Update (MANDATORY when ticket · skip if absent)

Run after PR URL known. Never skip.

1. `transitionJiraIssue` → "In Review" (fetch transitions first if unknown)
2. `addCommentToJiraIssue`:

🚀 *PR Raised — Implementation Delivered*
*PR:* <PR_URL> · *Branch:* <FEATURE_BRANCH> · *Pipeline:* <mode>
*Changes:* <what, files, approach — derived from plan + agent output>
*Tests:* UT ✅/❌ <n passed/failed> · CT ✅/❌/SKIPPED <n passed/failed>
*Next:* Awaiting PR review and merge.

---

## Post-PR Health Check

1. Check status ~30 min after push
2. Green → done. Failed → route to responsible agent
3. After 2 failed fix cycles → escalate to user

| Failure in | Route to |
|-----------|----------|
| `src/main/` | Implementer |
| `src/test/` | Unit Tester |
| `componenttest/` | Component Tester |

---

## Who Does What

| Agent | Commits? | Pushes? | Creates PR? |
|-------|----------|---------|-------------|
| Implementer/UT/CT | ✅ | ❌ | ❌ |
| **Orchestrator** | ❌ | ✅ | ✅ |
| Standalone agent | ✅ | ✅ | ✅ |
