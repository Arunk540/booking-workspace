---
name: contmark-llm-wiki
description: 'LLM wiki — scaffold/ingest/page format/citations/Q&A/lint. Trigger: /llm-wiki or wiki requests.'
argument-hint: 'What would you like to do? (e.g. "ingest latest changes", "scaffold a new wiki", "lint the wiki", "how does X work?")'
---

# LLM Wiki Skill

A Karpathy-style knowledge base system where Claude maintains structured wiki pages from raw source code.

## Scaffold a new wiki project

If the user wants to create a new wiki for their team, run:

```bash
npx @maersk-global/contmark-shared-skills create-wiki
```

This interactively asks ~10 questions and generates a full project with:
- `CLAUDE.md` — wiki governance rules customized for the team's services
- `wiki_updater/` — Python CLI to auto-update pages via Claude API
- `scripts/sync-raw.sh` — sync source repos into `raw/`
- `.github/workflows/` — GitHub Actions automation (optional)
- `mcp_server/` — MCP server for serving wiki pages from GitHub (optional)
- `skill/` — Claude Code skill installer (optional)

---

## Wiki governance rules

The following rules apply to any project that has adopted the LLM wiki pattern (i.e. has a `raw/` folder, `wiki/` folder, and a `CLAUDE.md` governing this skill).

### Ingest workflow

When the user adds or updates sources in `raw/` and asks you to ingest them:

1. Read the full source document
2. Discuss key takeaways with the user before writing anything
3. Create a summary page in `wiki/` named after the source
4. Create or update concept pages for each major idea or entity
5. Add wiki-links (`[[page-name]]`) to connect related pages
6. Update `wiki/index.md` with new pages and one-line descriptions
7. Append an entry to `wiki/log.md` with the date, source name, and what changed

A single source may touch 10–15 wiki pages. That is normal.

### Page format

Every wiki page should follow this structure:

```markdown
# Page Title

**Summary**: One to two sentences describing this page.

**Sources**: List of raw source files this page draws from.

**Last updated**: Date of most recent update.

---

Main content goes here. Use clear headings and short paragraphs.

Link to related concepts using [[wiki-links]] throughout the text.

## Related pages

- [[related-concept-1]]
- [[related-concept-2]]
```

### Citation rules

- Every factual claim should reference its source file
- Use the format `(source: filename)` after the claim
- If two sources disagree, note the contradiction explicitly
- If a claim has no source, mark it as needing verification

### Question answering

When the user asks a question about the wiki content:

1. Read `wiki/index.md` first to find relevant pages
2. Read those pages and synthesize an answer
3. Cite specific wiki pages in your response
4. If the answer is not in the wiki, say so clearly
5. If the answer is valuable, offer to save it as a new wiki page

Good answers should be filed back into the wiki so they compound over time.

### Lint / audit

When the user asks you to lint or audit the wiki:

- Check for contradictions between pages
- Find orphan pages (no inbound links from other pages)
- Identify concepts mentioned in pages that lack their own page
- Flag claims that may be outdated based on newer sources
- Check that all pages follow the page format above
- Report findings as a numbered list with suggested fixes

### Rules

- **Never** modify anything in the `raw/` folder
- **Always** update `wiki/index.md` and `wiki/log.md` after changes
- Keep page names lowercase with hyphens (e.g. `my-concept.md`)
- Write in clear, plain language
- When uncertain about how to categorize something, ask the user

### Context loading rule

For explanation, onboarding, architecture, and general understanding:
- Read `wiki/index.md` first, then the relevant page under `wiki/`

For dependency or impact questions:
- Read the relevant wiki page first, then `graphify-out/GRAPH_REPORT.md` if it exists

For exact implementation, function signatures, API contracts:
- Read the relevant wiki page first, then verify against files in `raw/`

`wiki/` is the preferred context layer. `raw/` is the source of truth.
Never make code-level claims from `wiki/` alone if the answer depends on exact implementation.

### wiki_updater CLI

If the project has a `wiki_updater/` package installed:

```bash
# Update all wiki pages for a specific repo
python -m wiki_updater --repo <repo-key>

# Update only pages affected by recent commits (CI mode)
python -m wiki_updater --changed-only

# Update a single page
python -m wiki_updater --page wiki/path/to/page.md

# Preview without writing (dry run)
python -m wiki_updater --repo <repo-key> --dry-run
```
