---
name: contmark-generate-user-guide
version: 1.0.0
description: End-user guides and how-to docs from specs. Audience-aware (end-user, admin, operator). Load on /generate-user-guide.
---

# Generate User Guide

## Purpose

Produce clear, task-oriented documentation that helps non-technical users or product users understand how to use features confidently.

## When to use

Load this skill when:
- Writing a user-facing how-to guide for a new feature
- Creating onboarding documentation for a product
- Translating technical docs into user-friendly language
- Building a step-by-step walkthrough for a UI workflow
- Writing admin or operator guides for platform tooling

## Input expectations

Provide one or more of the following:
- **Feature description** — what the feature does in plain language
- **Technical spec or design doc** — for reference (will be simplified)
- **Target audience** — end-user / administrator / operator / developer
- **User goal** — what the user is trying to achieve
- **Screenshots or UI descriptions** — where relevant

## Output expectations

Every user guide produced by this skill must include:

1. **Title** — clear, task-oriented (e.g. "How to book a multimodal shipment")
2. **Overview** — what this guide covers and who it is for (2 sentences max)
3. **Before you begin** — prerequisites (accounts, permissions, data)
4. **Steps** — numbered, one action per step, written in imperative mood
5. **Expected outcomes** — what the user sees/gets when steps complete
6. **Troubleshooting** — 2–4 common issues and their fixes
7. **Related guides** — links to adjacent topics (if applicable)

## Tone and language rules

| Audience | Tone | Vocabulary |
|---|---|---|
| End-user | Friendly, encouraging | Plain English, no jargon |
| Administrator | Professional, precise | Technical where required |
| Developer | Concise, direct | Technical terms expected |

- Use active voice: "Click **Save**" not "The save button should be clicked"
- Refer to UI elements in **bold**: **Submit**, **Settings**, **New Booking**
- Avoid ambiguous words: "should", "might", "can sometimes"
- Use "you" — address the reader directly

## Output format rules

- Markdown
- Steps are ordered lists (`1.`, `2.`, …)
- Prerequisites are unordered lists
- Notes and warnings use blockquotes with a label:
  ```
  > **Note:** This step is only required for admin accounts.
  > **Warning:** Clicking Delete cannot be undone.
  ```

## Guardrails

- Do not describe behaviour that is not confirmed in the input — flag unknowns
- Do not include internal implementation details in user guides
- Screenshots are described as `[Screenshot: caption]` placeholders — do not invent image content
- Keep steps atomic: one action = one step
- Never assume prior product knowledge unless stated in the audience definition

## Example output structure

```markdown
# How to [Achieve Goal]

## Overview
This guide explains how to [goal] using [product/feature].
Intended for: [audience].

## Before You Begin
- [ ] You have a [role] account
- [ ] [Other prerequisite]

## Steps

1. Navigate to **[Section]**.
2. Click **[Button]**.
3. Fill in the **[Field]** with [description].
4. Click **Save**.

## Expected Outcome
After completing these steps, you will see [result].

## Troubleshooting

**Problem:** [Common issue]
**Solution:** [Fix]

## Related Guides
- [Link to related guide]
```
