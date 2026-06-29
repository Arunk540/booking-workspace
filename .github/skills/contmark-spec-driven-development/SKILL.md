---
name: contmark-spec-driven-development
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when requirements are unclear, ambiguous, or only exist as a vague idea.
---

# Spec-Driven Development

## Overview

Write a structured specification before writing any code. The spec is the shared source of truth between you and the human engineer — it defines what we're building, why, and how we'll know it's done. Code without a spec is guessing.

## Spec File Convention

All spec-driven development artifacts must be stored using this structure:

spec/<feature-name>/spec.md
spec/<feature-name>/plan.md
spec/<feature-name>/task.md

Do not store spec artifacts in a flat `specs/` directory.
Each feature must have its own folder under `spec/`.

## When to Use

- Starting a new project or feature
- Requirements are ambiguous or incomplete
- The change touches multiple files or modules
- You're about to make an architectural decision
- The task would take more than 30 minutes to implement

**When NOT to use:** Single-line fixes, typo corrections, or changes where requirements are unambiguous and self-contained.

## The Gated Workflow

Spec-driven development has four phases. Do not advance to the next phase until the current one is validated.

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │        │          │
   ▼          ▼        ▼          ▼
 Human      Human    Human      Human
 reviews    reviews  reviews    reviews
```

### Phase 1: Specify

Start with a high-level vision. Ask the human clarifying questions until requirements are concrete.

**Surface assumptions immediately.** Before writing any spec content, list what you're assuming:

```
ASSUMPTIONS I'M MAKING:
1. This feature lives in src/lib/features/<feature-name>/ (not a shared utility)
2. Authentication follows the project's established auth guard pattern
3. Server state uses RTK Query injected on httpBaseApi (not raw fetch/axios)
4. UI uses MDS components from @maersk-global/mds-react-wrapper (not custom HTML or third-party libs)
5. Routing follows the project's established pattern (e.g. Pages Router)
→ Correct me now or I'll proceed with these.
```

Don't silently fill in ambiguous requirements. The spec's entire purpose is to surface misunderstandings *before* code gets written — assumptions are the most dangerous form of misunderstanding.

**Write a spec document covering these six core areas:**

1. **Objective** — What are we building and why? Who is the user? What does success look like?

2. **Commands** — Full executable commands with flags, not just tool names.
   ```
   Dev:              npm run dev
   Dev (mocked):     npm run dev-mock
   Build:            npm run build
   Test (Jest):      npm test
   Test (Cypress):   npm run cypress:headless
   Lint:             npm run lint
   Commit:           npm run commit
   ```

3. **Project Structure** — Where source code lives, where tests go, where docs belong.
   ```
   src/pages/              → Next.js Pages Router routes (default exports)
   src/lib/features/       → Feature modules
   src/lib/shared/         → Shared components, hooks, utils, types, constants
   src/lib/apis/           → Auto-generated API types, schemas, API mocks
   src/redux/              → Store, slices (features/), selectors/, services/ (RTK Query)
   src/component/          → Layout and common wrapper components
   src/data-access/        → Environment config (envConfig.util.ts), HTTP client, auth
   src/styles/             → Global SCSS (global.scss)
   src/mocks/              → Test mocks (store, form, resolver)
   src/tests/              → Test utilities and module mocks
   src/translations/       → i18n translation files
   src/plugins/            → Observability (Grafana Faro)
   spec/                   → Specification workspace
   spec/<feature-name>/    → Feature-specific specification artifacts
      spec.md               → Requirements and success criteria
      plan.md               → Technical implementation plan
      task.md               → Ordered implementation tasks
   ```

4. **Code Style** — One real code snippet showing your style beats three paragraphs describing it. Key conventions for this project:
   - Use `@/` path alias for imports from `src/` (e.g., `import { store } from "@/redux/store"`)
   - **Named exports** for all non-page files; pages use default exports
   - **MDS components** from `@maersk-global/mds-react-wrapper` — never custom HTML or third-party UI
   - **MDS design tokens** for spacing, colour, typography — never hard-code values
   - **RTK Query** for all API calls (inject endpoints on `httpBaseApi`)
   - **Typed hooks**: `useAppSelector` / `useAppDispatch` — never untyped `useSelector` / `useDispatch`
   - **React Hook Form + Zod** for forms — never mirror form state in Redux
   - Strict TypeScript: no `any` without eslint-disable + justification

5. **Testing Strategy** — What framework, where tests live, coverage expectations, which test levels for which concerns.
   - **Unit/Integration**: Jest + React Testing Library — co-located `*.spec.ts(x)` next to source
   - **Component (visual)**: Cypress — co-located `*.cy.tsx` next to component
   - Mock MDS web-components with lightweight stubs in Jest (custom elements don't render in jsdom)
   - Use `setupMockStore` from `@/redux/store.tsx` for Redux-dependent tests
   - API mocks go in `src/mocks/` or `src/tests/mocks/`
   - Every new component, hook, utility, and slice **must** ship with tests

6. **Boundaries** — Three-tier system:
   - **Always do:** Use MDS components + design tokens, use RTK Query for API calls, use `@/` path alias, write tests for new code, use named exports (except pages), access env via the project's established environment config utility (never `process.env` directly in components)
   - **Ask first:** Adding npm dependencies, modifying `next.config.js` / `jest.config.ts` / `eslint.config.mjs`, adding new global CSS, schema changes
   - **Never do:** Introduce App Router / server components / `"use client"` directives, install alternative UI libraries (MUI, Chakra, Ant), use raw `fetch`/`axios` in components, use `any` without justification, commit `.env` files or secrets, add default exports to non-page files, disable ESLint rules globally

**Spec template:**

```markdown
# Spec: [Feature Name]

## Objective
[What we're building and why. User stories or acceptance criteria.]

## Tech Stack
[React framework — e.g. Next.js 15 Pages Router], TypeScript (strict), MDS components from @maersk-global/mds-react-wrapper,
[State management — e.g. Redux Toolkit + RTK Query], [Form library — e.g. React Hook Form + Zod], SCSS + MDS tokens
[Add any feature-specific dependencies here]

## Commands
Dev: npm run dev
Build: npm run build
Test: npm test
Cypress: npm run cypress:headless
Lint: npm run lint

## Feature Location
src/lib/features/<feature-name>/   → Components, hooks, types, constants, API slices
src/pages/<route>/                 → Page entry point (default export)
src/redux/services/                → RTK Query endpoint injection
spec/<feature-name>/spec.md        → Feature specification
spec/<feature-name>/plan.md        → Technical implementation plan
spec/<feature-name>/task.md        → Ordered implementation tasks
[Adjust paths as needed]

## Code Style
[Example snippet showing component pattern with MDS, typed hooks, @/ imports]

## Testing Strategy
Unit/Integration: Jest + RTL (*.spec.tsx co-located with source)
Component: Cypress (*.cy.tsx co-located with component)
Coverage: meaningful behaviour coverage — test what, not how

## Boundaries
- Always: [MDS components, RTK Query, named exports, @/ imports, tests for new code]
- Ask first: [New dependencies, config file changes, new global styles]
- Never: [App Router, alternative UI libs, raw fetch, untyped any, secrets in code]

## Success Criteria
[Specific, testable conditions — e.g., "List loads within 2s", "Form validates all required fields"]

## Open Questions
[Anything unresolved that needs human input]
```

**Reframe instructions as success criteria.** When receiving vague requirements, translate them into concrete conditions:

```
REQUIREMENT: "Make the list page faster"

REFRAMED SUCCESS CRITERIA:
- List page LCP < 2.5s on 4G connection
- API data fetch completes in < 500ms
- No layout shift during skeleton-to-content transition (CLS < 0.1)
- Pagination renders without re-fetching already-cached pages
→ Are these the right targets?
```

This lets you loop, retry, and problem-solve toward a clear goal rather than guessing what "faster" means.

Save the specification at:

spec/<feature-name>/spec.md

### Phase 2: Plan

With the validated spec, generate a technical implementation plan:

1. Identify the major components and their dependencies
2. Determine the implementation order (what must be built first)
3. Note risks and mitigation strategies
4. Identify what can be built in parallel vs. what must be sequential
5. Define verification checkpoints between phases

The plan should be reviewable: the human should be able to read it and say "yes, that's the right approach" or "no, change X."

Save the implementation plan at:

spec/<feature-name>/plan.md

### Phase 3: Tasks

Break the plan into discrete, implementable tasks:

- Each task should be completable in a single focused session
- Each task has explicit acceptance criteria
- Each task includes a verification step (test, build, manual check)
- Tasks are ordered by dependency, not by perceived importance
- No task should require changing more than ~5 files

**Task template:**
```markdown
- [ ] Task: [Description]
  - Acceptance: [What must be true when done]
  - Verify: [How to confirm — test command, build, manual check]
  - Files: [Which files will be touched]
```
Save the task breakdown at:

spec/<feature-name>/task.md

### Phase 4: Implement

Execute tasks one at a time following `incremental-implementation` and `test-driven-development` skills. Use `context-engineering` to load the right spec sections and source files at each step rather than flooding the agent with the entire spec.

## Keeping the Spec Alive

The spec is a living document, not a one-time artifact:

- **Update when decisions change** — If you discover the data model needs to change, update the relevant spec artifact first, then implement.
- **Update when scope changes** — Features added or cut should be reflected in the spec files.
- **Commit the spec artifacts** — All spec files belong in the `spec/` directory in version control alongside the code.
- **Use one folder per feature** — Each feature must use:
  - `spec/<feature-name>/spec.md`
  - `spec/<feature-name>/plan.md`
  - `spec/<feature-name>/task.md`
- **Reference the spec in PRs** — Link back to the relevant spec section that each PR implements.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is simple, I don't need a spec" | Simple tasks don't need *long* specs, but they still need acceptance criteria. A two-line spec is fine. |
| "I'll write the spec after I code it" | That's documentation, not specification. The spec's value is in forcing clarity *before* code. |
| "The spec will slow us down" | A 15-minute spec prevents hours of rework. Waterfall in 15 minutes beats debugging in 15 hours. |
| "Requirements will change anyway" | That's why the spec is a living document. An outdated spec is still better than no spec. |
| "The user knows what they want" | Even clear requests have implicit assumptions. The spec surfaces those assumptions. |

## Red Flags

- Starting to write code without any written requirements
- Asking "should I just start building?" before clarifying what "done" means
- Implementing features not mentioned in any spec or task list
- Making architectural decisions without documenting them
- Skipping the spec because "it's obvious what to build"

## Verification

Before proceeding to implementation, confirm:

- [ ] The spec covers all six core areas
- [ ] The human has reviewed and approved the spec
- [ ] Success criteria are specific and testable
- [ ] Boundaries (Always/Ask First/Never) are defined
- [ ] The spec files are saved under `spec/<feature-name>/`
- [ ] `spec.md`, `plan.md`, and `task.md` are all present

---

## Common Mistakes to Avoid

- **Starting to code before the spec is approved** — writing "exploratory" code is fine, but committing it before the spec is reviewed embeds unreviewed decisions
- **Silent assumptions** — every implicit assumption must be surfaced explicitly in the spec; the spec exists to expose misunderstandings
- **Treating the spec as a one-time document** — update the spec when scope, data models, or decisions change; an outdated spec is a liability
- **Skipping the task breakdown** — large plans without granular tasks cause untracked work and unclear done/not-done state
- **Not committing spec artifacts to version control** — spec files belong in `spec/<feature-name>/` alongside code; they are the record of intent

## Evaluation Cases

| # | Scenario | Expected behaviour |
|---|----------|--------------------|
| 1 | User describes a vague feature ("make it faster") | Agent reframes as concrete, testable success criteria before writing any spec |
| 2 | Agent starts writing code before spec approval | Blocked; agent surfaces assumptions and waits for human review |
| 3 | New feature with clear requirements | Full spec produced covering all six core areas; saved at `spec/<feature-name>/spec.md` |
| 4 | Scope changes mid-implementation | Spec updated first; then implementation resumes |
| 5 | Single-line fix or typo | Skill correctly identifies this as out of scope; no spec produced |

## Metadata

| Field | Value |
|---|---|
| Owner | Frontend Platform Team |
| Last reviewed | 2026-05-20 |
| Supported tools | Claude Code, GitHub Copilot |
| Supported repos | solar-inland-ui, telikos-ui, any React project |
| Security classification | Internal |
| Evaluation status | Not evaluated |