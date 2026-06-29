---
name: contmark-component-library
description: "How to use the Maersk Design System (MDS) component library — including MCP server lookups, import patterns, styled-component overrides, and design token usage."
---

# Skill: Component Library (MDS)

Use this skill when building or modifying UI in any React project using MDS. The Maersk Design System (MDS) is the only permitted component library.

---

## Step 1 — Look Up the Component API

Before writing any MDS code, resolve the component API through these tiers in order:

### Tier 1: MDS MCP Server (preferred)

The MDS MCP server is registered and provides these tools:

| Tool | Use When |
|------|----------|
| `get_components_documentation` (arg: `component`) | Need props, documentation, events, slots, CSS parts for a specific component (e.g. `button`, `table`, `select`) |
| `get_design_tokens_documentation` (arg: `brand: "maersk"`) | Need token names for colours, spacing, borders, shadows |
| `get_styles_documentation` (arg: `type`) | Need CSS utility classes from foundations (`color`, `typography`, `content`) |
| `get_css_grid_documentation` (arg: `type`) | Need grid/layout CSS classes (`container-grid`, `gap`, `flex-box`, `viewport-grid`) |
| `get_css_breakpoints_documentation` | Need responsive breakpoints |
| `get_layout_patterns_documentation` | Need page layout patterns |
| `get_setup_documentation` | Setting up MDS in the project |
| `get_install_documentation` (arg: `packageManager: "npm"`) | Need install commands |

**Always call the MCP server first.** Do not guess component APIs from memory.

### Tier 2: npm Package Metadata (fallback)

If MCP is unavailable, read metadata directly from installed packages:

```
node_modules/@maersk-global/mds-components-core-<name>/metadata.json
node_modules/@maersk-global/mds-design-tokens/maersk/metadata.json
node_modules/@maersk-global/mds-foundations/css/_color.metadata.json
node_modules/@maersk-global/mds-foundations/css/_typography.metadata.json
```

### Tier 3: Existing Codebase

Search the codebase for existing usage of the same component to follow established patterns.

---

## Step 2 — Import the Component

Two import styles exist in this codebase. Use **deep imports** for better tree-shaking:

```typescript
// ✅ Deep import (preferred)
import { McButton } from "@maersk-global/mds-react-wrapper/components-core/mc-button";
import { McInput } from "@maersk-global/mds-react-wrapper/components-core/mc-input";
import { McTable } from "@maersk-global/mds-react-wrapper/components-core/mc-table";

// ✅ Barrel import (acceptable, used widely in the codebase)
import { McButton, McModal, McIcon } from "@maersk-global/mds-react-wrapper";
```

Import **types** from the core package:

```typescript
import type { TableColumn } from "@maersk-global/mds-components-core/mc-table/types";
```

---

## Step 3 — Use the Component in JSX

```tsx
{/* Button */}
<McButton
  variant="primary"
  icon="star"
  onClick={() => handleSave()}
>
  Save Changes
</McButton>

{/* Input with event handling */}
<McInput
  label="Email"
  type="email"
  placeholder="user@maersk.com"
  onInput={(e) => setEmail(e.detail.value)}
/>

{/* Card with slots */}
<McCard heading="Bulk Booking" body="Create bulk orders quickly">
  <div slot="actions">
    <McButton href="/bulk-upload/booking" icon="arrow-right" appearance="inverse" variant="filled" hiddenlabel />
  </div>
</McCard>

{/* Modal */}
<McModal heading="Notification settings" width="600px" height="fit-content" open={isOpen}>
  {/* modal content */}
</McModal>

{/* Table */}
<McTable columns={columns} data={rows} />
```

Add `data-cy` attributes on key elements for Cypress testability:

```tsx
<McInput data-cy="search-input" label="Search" />
<McButton data-cy="submit-btn" variant="primary">Submit</McButton>
```

---

## Step 4 — Apply Styling with Design Tokens

### CSS Custom Properties

```css
.container {
  padding: var(--mds_foundations_sizing_m);
  color: var(--mds_brand_appearance_primary_default_text-color);
  background-color: var(--mds_brand_appearance_primary_default_background-color);
  border-radius: var(--mds_foundations_border-radius_m);
  font-family: var(--mds_brand_typography_headline_font-family);
  font-size: var(--mds_brand_typography_headline_medium_desktop_font-size);
}
```

### Never Hard-Code

```css
/* ❌ */
padding: 16px;
color: #1A1A1A;
border-radius: 4px;
font-family: "Maersk Headline";

/* ✅ */
padding: var(--mds_foundations_sizing_m);
color: var(--mds_brand_appearance_primary_default_text-color);
border-radius: var(--mds_foundations_border-radius_m);
font-family: var(--mds_brand_typography_headline_font-family);
```

### MDS Foundations CSS Classes

Use MDS utility classes on containers:

```tsx
<div className="mds">
  <h1 className="mds-headline--medium">Page Title</h1>
  <p className="mds-text--medium">Body text</p>
</div>
```

---

## Step 5 — Customize with Styled-Components (When Needed)

Wrap MDS components with `styled()` for layout/spacing overrides:

```typescript
import { McStepIndicator } from "@maersk-global/mds-react-wrapper/components-core/mc-step-indicator";
import styled from "styled-components";

export const StyledStepIndicator = styled(McStepIndicator)`
  display: block;
  margin: 40px auto;
  width: 60%;
`;
```

Use `::part()` selectors to target shadow DOM internals:

```typescript
export const StyledMcModal = styled(McModal)`
  &::part(footer) {
    display: flex;
    justify-content: flex-end;
  }
`;

export const StyledMcDrawer = styled(McDrawer)`
  &::part(footer) {
    box-shadow: ${({ theme }) => theme.boxShadows.card[9]};
  }
`;

export const StyledMcNotification = styled(McNotification)`
  margin-bottom: 10px;
  &::part(notification) {
    white-space: pre;
  }
`;
```

### Style File Convention

Create a separate `.style.tsx` or `.style.ts` file co-located with the component:

```
MyComponent/
  MyComponent.tsx
  MyComponent.style.tsx    ← styled-components go here
  MyComponent.type.ts
  MyComponent.spec.tsx
  index.ts
```

---

## Rules

1. **Never** install alternative UI libraries (Material UI, Chakra, Ant, Tailwind, etc.).
2. **Always** look up the MCP server or metadata before using an MDS component — do not guess props.
3. **Always** use design tokens for colours, spacing, typography, and elevation.
4. Place style overrides in a co-located `.style.tsx` file, not inline.
5. Use `::part()` to reach shadow DOM — do not pierce shadow DOM with `>>>` or other hacks.
6. The global imports (`fonts.css`, `design-tokens-px.css`, `foundations.css`) are already in `_app.tsx` — do not re-import them.

---

## Use This Skill When

- Building or modifying UI in a React project using MDS (Maersk Design System)
- Looking up MDS React wrapper component props, events, or slots
- Applying design tokens (colours, spacing, typography) instead of hard-coded values
- Overriding MDS component styles via `::part()` or styled-components

## Do Not Use This Skill When

- Working on Vue projects — use `assets/frontend/vue/skills/component-library` for Vue/MDS patterns
- Building UI with non-MDS components — all standard UI elements must use MDS
- Writing backend or API code with no UI involvement

## Common Mistakes to Avoid

- **Guessing MDS component props from memory** — always call `get_components_documentation` via MCP server first; prop APIs change between MDS versions
- **Placing style overrides inline on the component** — overrides go in a co-located `.style.tsx` file using styled-components
- **Piercing shadow DOM with `>>>` or other hacks** — use `::part()` exclusively for shadow DOM styling
- **Re-importing global CSS** — fonts, design tokens, and foundations are already in `_app.tsx`; re-importing causes duplication
- **Using raw hex or pixel values instead of design tokens** — all colour, spacing, and typography values must use MDS design tokens

## Evaluation Cases

| # | Scenario | Expected behaviour |
|---|----------|--------------------|
| 1 | Agent needs MDS button props | `get_components_documentation` called with `component: "button"` before writing any code |
| 2 | Custom colour applied with `#1A1A1A` | Replaced with design token from `get_design_tokens_documentation` |
| 3 | Style override added inline on component | Moved to co-located `.style.tsx` file |
| 4 | Agent tries `>>>`  to style shadow DOM | Blocked; replaced with `::part()` selector |
| 5 | MCP server unavailable | Falls back to `node_modules/@maersk-global/mds-components-core-<name>/metadata.json` |

## Metadata

| Field | Value |
|---|---|
| Owner | Frontend Platform Team |
| Last reviewed | 2026-05-20 |
| Supported tools | Claude Code, GitHub Copilot |
| Supported repos | solar-inland-ui, any React MDS project |
| Security classification | Internal |
| Evaluation status | Not evaluated |
