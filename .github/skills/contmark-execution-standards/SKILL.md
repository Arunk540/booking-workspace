---
name: contmark-execution-standards
description: DEPRECATED — split into execution-core (boot) + execution-extras (routing/lessons). Use those directly.
---

# Execution Standards (DEPRECATED)

This skill is now split for token efficiency:

| Need | Load |
|---|---|
| Terminal discipline, timeouts, build loop, commits, prohibited actions, code-quality signals | `execution-core` — once at boot |
| Pipeline routing, classification, phase ownership, core principles, lessons protocol | `execution-extras` — Stage 0/1/3/5 only |

> Old agents that `Read execution-standards` will reach this file; update them to load `execution-core` once at boot and `execution-extras` only when routing / capturing lessons. Reading both still gives full coverage but uses more tokens than necessary.

No content here intentionally — content lives in the two skills above.
