---
name: contmark-generate-technical-documentation
version: 1.0.0
description: Structured technical docs from code/APIs/architecture — READMEs, API references, architecture overviews.
---

# Generate Technical Documentation

## Purpose

Produce accurate, developer-facing technical documentation directly from source code, API definitions, architecture diagrams, or design notes.

## When to use

Load this skill when:
- Writing or regenerating a project `README.md`
- Documenting a REST / GraphQL / gRPC API
- Producing an architecture overview or decision record (ADR)
- Adding inline code documentation that belongs in a separate reference doc
- Updating docs after a code change

## Input expectations

Provide one or more of the following:
- **Source files** — the code to document (file paths or pasted content)
- **API spec** — OpenAPI YAML/JSON, GraphQL schema, or Protobuf definition
- **Architecture notes** — free-form description, diagram, or bullet list
- **Target audience** — engineering, platform team, consumer, or open-source contributor
- **Doc type** — README / API reference / architecture overview / ADR / runbook

## Output expectations

| Doc type | Sections included |
|---|---|
| README | Overview, quick start, install, usage, config, contributing, license |
| API reference | Endpoint table, request/response schemas, error codes, examples |
| Architecture overview | Context, components, interactions, data flow, constraints |
| ADR | Status, context, decision, consequences, alternatives considered |
| Runbook | Purpose, prerequisites, steps, rollback, escalation |

## Output format rules

- Use Markdown
- Keep section headers at `##` or `###` (never `#` inside a doc — that is reserved for the title)
- Code samples must use fenced code blocks with language hint (` ```typescript `, ` ```yaml `, etc.)
- Tables for structured data (endpoints, config keys, error codes)
- Avoid marketing language — docs are for developers, not sales
- Be precise: state types, defaults, and constraints for every config option

## Guardrails

- Only document what is actually in the provided source — do not invent behaviour
- If the source is incomplete, mark gaps with `<!-- TODO: verify -->` comments
- Do not expose secrets, credentials, or internal URLs in generated docs
- Prefer short sentences and active voice
- Maximum line length: 100 characters (for version-control friendliness)

## Example — README structure

```markdown
# project-name

Short one-line description.

## Overview

2–3 sentence context: what it does, why it exists, who uses it.

## Quick Start

​```bash
npm install
npm run dev
​```

## Installation

Detailed installation steps…

## Configuration

| Key | Type | Default | Description |
|-----|------|---------|-------------|

## Usage

…

## Contributing

…

## License

…
```
