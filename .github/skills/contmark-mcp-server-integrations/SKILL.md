---
name: contmark-mcp-server-integrations
description: MCP (Model Context Protocol) server configurations for GitHub, Jira, and Context7 — tool references, when to use each server, authentication setup, and agent-specific MCP usage patterns. Use this skill whenever an agent needs to interact with GitHub (PRs, issues, repo operations), Jira (tickets, acceptance criteria, sprint data), or fetch latest library documentation (Temporal, Spring, Java). This skill ensures agents use MCP tools instead of CLI workarounds.
---

# MCP Server Integrations

MCP servers provide agents with direct access to external services. This skill documents which servers are available, when each agent should use them, and authentication requirements.

---

## Available MCP Servers

### 1. GitHub MCP Server (`@modelcontextprotocol/server-github`)

Provides direct GitHub API access for repository operations.

**Key Capabilities:**
| Tool | Purpose | Used By |
|------|---------|---------|
| `create_or_update_file` | Create/update files in a repo | Implement, Orchestrate |
| `create_pull_request` | Create PRs programmatically | All agents (delivery) |
| `list_pull_requests` | List open PRs | Review, Orchestrate |
| `get_pull_request` | Get PR details, diff, status | Review |
| `create_pull_request_review` | Submit PR review comments | Review |
| `merge_pull_request` | Merge approved PRs | Orchestrate |
| `list_issues` | List repo issues | Plan, Explore |
| `get_issue` | Get issue details | Plan |
| `create_issue` | Create new issues | All agents |
| `add_issue_comment` | Comment on issues | All agents |
| `search_code` | Search code across repos | Explore |
| `search_repositories` | Find repositories | Explore |
| `get_file_contents` | Read file from remote repo | Plan, Explore |
| `list_branches` | List branches | Orchestrate |
| `create_branch` | Create feature branches | Implement |
| `list_commits` | View commit history | Review, Explore |

**When to use GitHub MCP vs `gh` CLI:**
- **Prefer MCP** for: creating PRs, reading PR details, submitting reviews, searching code across repos
- **Prefer `gh` CLI** for: complex queries, auth status checks, or when MCP is unavailable
- **Fallback**: if MCP fails, use `gh` CLI as documented in `pr-delivery-and-triage` skill

### 2. Jira MCP Server (`@anthropic/jira-mcp` or `mcp-atlassian`)

Provides direct Jira API access for ticket management.

**Key Capabilities:**
| Tool | Purpose | Used By |
|------|---------|---------|
| `get_issue` | Fetch ticket summary, description, acceptance criteria | **Plan** (full data extraction); Orchestrate (lightweight classification only — reads summary/type for routing) |
| `search_issues` | JQL search for related tickets | Plan, Explore |
| `get_issue_comments` | Read discussion thread | Plan |
| `add_comment` | Post implementation updates | Orchestrate (at delivery) |
| `transition_issue` | Move ticket status (In Progress → Review) | Orchestrate (at delivery) |
| `get_transitions` | List available status transitions | Orchestrate (at delivery) |
| `get_sprint_issues` | List current sprint work | Plan |

**Jira Ownership Boundaries:**

| Agent | Jira Role | What It Does | What It Does NOT Do |
|-------|-----------|-------------|---------------------|
| **Orchestrator** | Classify + Deliver | Reads ticket summary/type for pipeline routing; updates status at delivery | Extract acceptance criteria or constraints |
| **Planner** | Data extraction (sole owner) | Fetches full ticket: AC, description, constraints, related work, comments | Update ticket status |
| **Explorer** | Ad-hoc search | Searches related tickets for context | Modify tickets |
| **Others** | None | — | Call Jira MCP |

**When to use Jira MCP vs asking user:**
- **Always try MCP first** when user provides a Jira key (e.g., `BOOK-1234`)
- If MCP fails or Jira is inaccessible, ask user to paste ticket details
- Never skip acceptance criteria extraction — it's mandatory for Telikos Planner (not Orchestrator)

### 3. Context7 MCP Server (`@upstash/context7-mcp`)

Fetches latest library documentation for accurate, up-to-date code generation.

**Key Capabilities:**
| Tool | Purpose | Used By |
|------|---------|---------|
| `resolve-library-id` | Find Context7 library ID from name | Explore, Plan |
| `get-library-docs` | Fetch documentation for a library | Explore, Implement, Plan |

**Library Quick Reference:**
| Library | Context7 ID | Use When |
|---------|-------------|----------|
| Temporal Java SDK | `/temporalio/sdk-java` | Workflow/Activity definitions, SDK features |
| Temporal Docs | `/temporalio/documentation` | Concepts, best practices |
| Spring Framework | `/spring-projects/spring-framework` | WebFlux, Mono/Flux, reactive chains |
| Spring Boot | `/websites/spring_io_spring-boot_3_4` | Boot configuration, properties |
| Spring Data MongoDB | `/spring-projects/spring-data-mongodb` | Reactive Mongo queries |
| MapStruct | `/mapstruct/mapstruct` | Mapper configuration |
| Project Reactor | `/reactor/reactor-core` | Mono/Flux operators |
| Lombok | `/projectlombok/lombok` | Annotation usage (Java only) |
| Kotlin Coroutines | `/kotlin/kotlinx.coroutines` | Coroutine patterns, Flow, suspend functions |
| Kotlin Language | `/jetbrains/kotlin` | Kotlin language features, stdlib |
| Gradle | `/gradle/gradle` | Build configuration, Kotlin DSL, plugins |
| kotlinx.serialization | `/kotlin/kotlinx.serialization` | Kotlin serialization (if used) |

---

## Agent-Specific MCP Usage

### Telikos Orchestrator
- **GitHub**: Create PRs, check PR status, merge after approval
- **Jira (classify at intake)**: Read ticket summary/type via `get_issue` — only to determine pipeline routing (feature/bug/test). Does NOT extract acceptance criteria.
- **Jira (update at delivery)**: `transition_issue` + `add_comment` to update ticket status after PR creation
- **Context7**: Not typically used directly

### Telikos Planner (sole owner of Jira data extraction)
- **Jira**: Fetch full ticket details — acceptance criteria, constraints, description, related tickets (`search_issues`), discussion thread (`get_issue_comments`), sprint context (`get_sprint_issues`). This is the single source of Jira data for the entire pipeline.
- **GitHub**: Search code in other repos for similar patterns
- **Context7**: Verify framework capabilities before planning

### Telikos Implementer
- **GitHub**: Create branches, commit files (if using GitHub MCP for delivery)
- **Context7**: Fetch latest API docs when implementing new patterns
- **Jira**: Not used — receives requirements through the plan

### Telikos Reviewer
- **GitHub**: Read PR diffs, submit review comments, check CI status
- **Jira**: Not called directly — receives acceptance criteria from the plan context passed by Orchestrator. Works from plan data, not raw Jira.
- **Context7**: Verify patterns against latest docs

### Telikos Explorer
- **GitHub**: Search code across repos, read remote files
- **Context7**: Fetch library docs for accurate explanations
- **Jira**: Search related tickets for ad-hoc context (`search_issues`)

### Telikos Unit Tester / Component Tester
- **Context7**: Fetch testing library docs (JUnit, Mockito, Cucumber)
- **GitHub/Jira**: Not used — receives context through the plan

---

## MCP Configuration

### IntelliJ (GitHub Copilot)

Location: `~/.config/github-copilot/intellij/mcp.json`

```json
{
  "servers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-github-pat>"
      }
    },
    "jira": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://mcp.atlassian.com/v1/sse"],
      "env": {
        "MCP_HEADERS": "x-atlassian-token:no"
      }
    },
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

### VS Code

Location: `.vscode/mcp.json` (workspace) or `~/.config/github-copilot/vscode/mcp.json` (global)

Same server definitions apply.

---

## Authentication

| Server | Auth Method | Setup |
|--------|------------|-------|
| GitHub | Personal Access Token | Create PAT at github.com/settings/tokens with `repo`, `read:org` scopes |
| Jira | OAuth / API Token | Use Atlassian API token from id.atlassian.com/manage-profile/security/api-tokens |
| Context7 | None required | Public documentation access |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MCP server not responding | Check `npx` is available and server package exists |
| GitHub auth failed | Verify PAT has correct scopes; regenerate if expired |
| Jira connection refused | Check Atlassian site URL and API token |
| Context7 returns empty | Library ID may be wrong; use `resolve-library-id` first |
| Tool not available in agent | Verify MCP server is listed in `mcp.json` and agent has tool access |

---

## Use This Skill When

- An agent needs to fetch a Jira ticket, PR, or GitHub issue using MCP tools
- Configuring MCP server availability in `mcp.json` for a new project
- Deciding whether to use MCP tools or CLI fallbacks (`gh`, `jira-cli`) for an operation
- Fetching up-to-date library documentation via Context7 before generating code
- Troubleshooting MCP connection or authentication failures

## Do Not Use This Skill When

- The task does not require external service access (GitHub, Jira, or external libraries)
- Performing Git operations locally — use `git` CLI directly
- The user has not provided a Jira key or GitHub URL — ask for it rather than searching speculatively

## Common Mistakes to Avoid

- **Calling Jira MCP from the Implementer agent** — the Planner is the sole owner of Jira data extraction; the Implementer reads the plan, not Jira directly
- **Using `gh` CLI when MCP is available** — prefer MCP for PR creation and review submission; CLI is a fallback only
- **Skipping `resolve-library-id` before `get-library-docs`** — Context7 IDs are not the same as npm/Maven artifact names; always resolve first
- **Fabricating Jira acceptance criteria** — if MCP fails, ask the user to paste the ticket rather than making up acceptance criteria
- **Using the Orchestrator to extract AC from Jira** — the Orchestrator reads only summary and type for routing; only the Planner reads full ticket content

## Evaluation Cases

| # | Scenario | Expected behaviour |
|---|----------|--------------------|
| 1 | User provides Jira key `BOOK-1234` | Planner uses `get_issue` MCP tool; Orchestrator reads summary/type only |
| 2 | MCP Jira fails with 401 | Agent reports failure; asks user to paste ticket content; does not fabricate |
| 3 | Agent needs latest Spring Boot 3.x docs | Uses `resolve-library-id` then `get-library-docs` via Context7 |
| 4 | PR needs to be created | `create_pull_request` via GitHub MCP; falls back to `gh pr create` only if MCP unavailable |
| 5 | New project has no `mcp.json` | Agent creates `mcp.json` with all three servers configured per auth setup |

## Metadata

| Field | Value |
|---|---|
| Owner | Telikos Engineering |
| Last reviewed | 2026-05-20 |
| Supported tools | Claude Code, GitHub Copilot |
| Supported repos | All backend services |
| Security classification | Internal |
| Evaluation status | Not evaluated |

