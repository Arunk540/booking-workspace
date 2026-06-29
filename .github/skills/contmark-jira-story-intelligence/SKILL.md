---
name: contmark-jira-story-intelligence
description: Jira story analysis — fetch, classify, assess, brief via Atlassian MCP. Load before planning a Jira-driven ticket.
---

# Jira Story Intelligence

Protocol for reading Jira stories and producing implementation briefs via Atlassian MCP tools.

---

## Input Normalization

| Input | Action |
|-------|--------|
| `PROJECT-1234` | Use as key |
| `https://site.atlassian.net/browse/PROJECT-1234` | Extract key from URL |
| Multiple keys | Process each, produce combined brief |

---

## Fetch Order (MCP tools)

1. `getJiraIssue` — expand=renderedFields, contentFormat=markdown
2. `getJiraIssueRemoteIssueLinks` — blockers, related
3. `getConfluencePage` — if Confluence URLs in description
4. Epic context — fetch epic summary if story belongs to one

---

## Extract

- Summary, Type, Status, Assignee
- Description (markdown)
- Acceptance Criteria (look for "AC", checkboxes, numbered lists)
- Components, Labels, Linked Issues
- Confluence spec body
- Last 5 comments with implementation context

---

## Classify

**Workflow area:** Create / Modify / Delete / Integrate / Validate / Query

---

## Completeness

| Level | Response |
|-------|----------|
| **Complete** — clear ACs, testable | Full brief |
| **Partial** — gaps exist | Brief + assumptions + gaps |
| **Sparse** — minimal info | Brief + explicit assumptions + open questions |

---

## Brief Template

```markdown
# Implementation Brief: PROJECT-XXXX

## Story Context
- **Key/Tag**: PROJECT-XXXX / @PROJECT-XXXX
- **Summary**: [title]
- **Type/Status**: [type] / [status]
- **Workflow**: [area]
- **Completeness**: [level]

## Requirements
1. [Extracted from ACs]

## Acceptance Criteria
- [ ] AC1
- [ ] AC2

## Codebase Impact
- Related files found
- Recommendation: CREATE new / EXTEND existing

## Assumptions & Risks
- Assumptions: [inferred items]
- Open Questions: [for story author]

## Implementation Guidance
- Patterns to follow from existing code
- Edge cases to consider
```

---

## Rules

- **Read-only** — never modify files
- **MCP-first** — never shell scripts or direct API
- **No fabrication** — never invent requirements not in ticket
- **Confluence resolution** — always fetch linked pages
- **Context preservation** — downstream agents have no Jira access, pass ALL context
