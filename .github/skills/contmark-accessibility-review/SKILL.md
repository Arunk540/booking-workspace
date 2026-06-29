---
name: contmark-accessibility-review
description: "Checklist and step-by-step guide for reviewing accessibility and interaction quality in React components and pages."
---

# Skill: Accessibility Review

Use this skill when reviewing or auditing a component or page for accessibility compliance. Projects using this skill target **WCAG 2.1 AA**.

---

## Step 1 — Check MDS Component Usage

MDS components have built-in accessibility. Verify they are used correctly:

- [ ] **Labels provided** — All `McInput`, `McSelect`, `McTypeahead`, `McTextarea` have a `label` prop.
- [ ] **Error messages connected** — Form inputs with validation use `invalid` and `errormessage` props.
- [ ] **Required fields marked** — Inputs with required validation use the `required` prop.
- [ ] **Icon-only buttons labelled** — `McButton` with `hiddenlabel` or icon-only has `aria-label`.

```tsx
{/* ✅ Correct */}
<McInput label="Email address" required invalid={!!errors.email} errormessage={errors.email?.message} />
<McButton icon="close" hiddenlabel aria-label="Close dialog" />

{/* ❌ Missing label */}
<McInput placeholder="Enter email" />
<McButton icon="close" hiddenlabel />
```

---

## Step 2 — Audit Custom Interactive Elements

Any `<div>`, `<span>`, or non-semantic element used as an interactive control needs manual ARIA:

### Checklist for Custom Controls

- [ ] Has appropriate `role` attribute (`button`, `checkbox`, `tab`, `switch`, etc.)
- [ ] Has `tabIndex={0}` for keyboard focusability
- [ ] Has `aria-label` or visible text content
- [ ] Handles `onClick` **and** `onKeyDown` (`Enter` and `Space` for buttons, `Enter` for checkboxes)
- [ ] Has `aria-checked` / `aria-expanded` / `aria-selected` if stateful

```tsx
{/* ✅ Accessible custom checkbox */}
<div
  role="checkbox"
  aria-checked={isChecked}
  aria-label="Mark all as read"
  tabIndex={0}
  onClick={() => handleToggle()}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  }}
/>

{/* ❌ Inaccessible — no role, no keyboard, no label */}
<div onClick={() => handleToggle()} style={{ cursor: "pointer" }}>
  Toggle
</div>
```

---

## Step 3 — Verify Keyboard Navigation

Test the entire flow using only the keyboard:

- [ ] **Tab order** — All interactive elements reachable via `Tab` / `Shift+Tab` in logical order.
- [ ] **Focus visible** — Every focusable element shows a visible focus indicator (MDS provides defaults — verify they aren't overridden).
- [ ] **Escape closes overlays** — Modals, drawers, dropdowns dismiss on `Escape`.
- [ ] **Focus trapping** — Modal and drawer components trap focus inside (MDS `McModal`/`McDrawer` handle this).
- [ ] **Focus return** — When an overlay closes, focus returns to the triggering element.
- [ ] **No keyboard traps** — User can always navigate away from any element.
- [ ] **Arrow keys** — Tab components, menus, and radio groups support arrow key navigation.

### How to Test

1. Place cursor at the top of the page.
2. Press `Tab` repeatedly — verify every interactive element receives focus in a logical reading order.
3. Press `Enter` / `Space` on buttons and links — verify they activate.
4. Open a modal — verify focus moves into it and `Tab` stays trapped inside.
5. Press `Escape` — verify the modal closes and focus returns to the trigger.

---

## Step 4 — Validate Colour & Contrast

- [ ] **Text contrast** — Normal text meets **4.5:1** ratio against background.
- [ ] **Large text / UI components** — Meets **3:1** ratio.
- [ ] **No colour-only meaning** — Status, errors, success indicators pair colour with icons or text labels.
- [ ] **MDS tokens used** — No hard-coded colour values that might break contrast.

```tsx
{/* ✅ Status with icon + text */}
<span>
  <McIcon icon="check-circle" />
  Confirmed
</span>

{/* ❌ Colour-only status */}
<span style={{ color: "green" }}>●</span>
```

### How to Check

- Use browser DevTools → inspect element → check computed colour against background.
- Use axe DevTools extension or Lighthouse accessibility audit.
- Verify in both light theme (the project default) and any dark/high-contrast modes if applicable.

---

## Step 5 — Review Images & Icons

- [ ] **Informative images** — Have descriptive `alt` text.
- [ ] **Decorative images** — Have `alt=""` (empty string).
- [ ] **No `alt` omitted** — Every `<img>` has an `alt` attribute.
- [ ] **Icon-only actions** — Parent element or button has `aria-label`.
- [ ] **SVG icons** — Have `aria-hidden="true"` if decorative, or `role="img"` + `aria-label` if informative.

```tsx
{/* ✅ */}
<img src="/booking-icon.png" alt="Booking confirmation" />
<img src="/decorative-bg.png" alt="" />
<McButton icon="trash" hiddenlabel aria-label="Delete booking" />

{/* ❌ */}
<img src="/booking-icon.png" />
```

---

## Step 6 — Audit Dynamic Content & Live Regions

- [ ] **Loading states** — Container has `aria-busy="true"` while loading, `aria-live="polite"` for updates.
- [ ] **Toast notifications** — Use `role="alert"` or `aria-live="assertive"`.
- [ ] **Search results** — Results container has `aria-live="polite"` to announce updates.
- [ ] **Form errors** — Error messages are programmatically associated (MDS `errormessage` prop handles this).
- [ ] **No surprise focus changes** — Content updates don't unexpectedly move focus.

```tsx
{/* ✅ Live region for async content */}
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? <McLoadingIndicator /> : <ResultsList data={results} />}
</div>

{/* ✅ Alert for urgent notification */}
<McNotification role="alert" appearance="error">
  Session expired. Please log in again.
</McNotification>
```

---

## Step 7 — Review Forms

- [ ] **Labels** — Every input has an associated label (MDS `label` prop).
- [ ] **Fieldsets** — Related groups of controls use `<fieldset>` + `<legend>`.
- [ ] **Required indicators** — Required fields use MDS `required` prop (adds both visual indicator and `aria-required`).
- [ ] **Error messages** — Displayed adjacent to the input and associated via `errormessage` prop.
- [ ] **Submit feedback** — Success/failure of form submission is announced to screen readers.

---

## Quick Reference: ARIA Patterns Used in This Codebase

| Pattern | Attributes | Example Context |
|---------|-----------|----------------|
| Custom checkbox | `role="checkbox"`, `aria-checked`, `aria-label`, `tabIndex={0}` | Notification panel "mark all read" |
| Descriptive link | `aria-label="Booking {id} - opens in new tab"` | Booking ID links in tables |
| Loading region | `aria-busy={isLoading}`, `aria-live="polite"` | Data tables, search results |
| Icon-only action | `aria-label="Delete"` on parent `McButton` | Table row actions |
| Modal dialog | Handled by MDS `McModal` — `role="dialog"`, `aria-modal`, focus trap | Booking event modals |

---

## Summary Checklist

Copy this into your PR description when submitting UI changes:

```markdown
### Accessibility Review
- [ ] MDS components used with correct label/error/required props
- [ ] Custom interactive elements have role, tabIndex, keyboard handlers, aria-label
- [ ] Keyboard navigation works end-to-end (Tab, Enter, Space, Escape)
- [ ] Focus visible on all interactive elements
- [ ] Modals/drawers trap focus and return focus on close
- [ ] Colour contrast meets WCAG AA (4.5:1 text, 3:1 UI)
- [ ] No colour-only meaning — icons/text paired with colour
- [ ] All images have alt text (or alt="" for decorative)
- [ ] Dynamic content uses aria-live / aria-busy
- [ ] Form inputs have labels and error messages
- [ ] Lighthouse accessibility score ≥ 90
```

---

## Use This Skill When

- Reviewing or auditing a React component or page before submitting a PR
- A feature introduces new interactive elements (forms, modals, dropdowns, custom controls)
- Running an accessibility audit on an existing page that has never been reviewed
- The PR description includes UI changes visible to users

## Do Not Use This Skill When

- Reviewing backend-only changes (API, service layer, database migrations)
- Reviewing pure styling changes with no structural HTML/ARIA changes
- Reviewing automated test files — accessibility testing belongs in Cypress component tests, not this skill

## Common Mistakes to Avoid

- **Relying on MDS for all accessibility** — MDS components handle their own ARIA, but custom wrappers, containers, and layout elements still need manual review
- **Skipping keyboard navigation testing** — visual review is not sufficient; every interactive flow must be verified via keyboard-only navigation
- **Using colour alone for status** — every status indicator must pair colour with an icon or text label
- **Forgetting focus return** — when a modal or drawer closes, focus must return to the element that triggered it
- **Missing `aria-live` on dynamic content** — search results, loading states, and notifications that update without a page reload need live region announcements

## Evaluation Cases

| # | Scenario | Expected behaviour |
|---|----------|--------------------|
| 1 | New `McInput` without a `label` prop | Flagged; label added |
| 2 | Custom `<div>` acting as a button | Flagged; `role="button"`, `tabIndex={0}`, `onKeyDown` handler required |
| 3 | Modal opens but focus stays on background | Flagged; focus must move into modal and be trapped |
| 4 | Error message shown only in red colour | Flagged; icon or text must accompany colour indicator |
| 5 | `<img>` tag with no `alt` attribute | Flagged; descriptive or empty `alt` required |

## Metadata

| Field | Value |
|---|---|
| Owner | Frontend Platform Team |
| Last reviewed | 2026-05-20 |
| Supported tools | Claude Code, GitHub Copilot |
| Supported repos | solar-inland-ui, telikos-ui, any React project |
| Security classification | Internal |
| Evaluation status | Not evaluated |
