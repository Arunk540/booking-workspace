---
name: contmark-code-review-checklist
description: Spring review — axes, severity, output format. Apply rules from convention skills already loaded; this file adds only what isn't there.
---

# Code Review Checklist

Stage 3 review wrapper. The **rules** live in the convention/domain skills already loaded at Stage 2 — re-stating them here would just duplicate context. This file adds: review axes, severity classification, output format, and a small set of *cross-cutting* checks that no convention skill owns.

> Apply rules from whichever of these are loaded (per project.yml `$skills.stack` / `$skills.domain` or the Stage 2 fallback): `spring-java-conventions` · `spring-mvc-patterns` · `java-reactive-patterns` · `kotlin-conventions` · `kafka-patterns` · `temporal-workflow-patterns` · `db-migration-guardrails`. Do **not** re-read them at Stage 3.

---

## Review axes (apply in order)

1. **Correctness** — every plan AC traced end-to-end through changed files. "When X, system should Y" passes?
2. **Architecture** — layer/model boundaries respected (per convention skill). No dead code, no Map<String,Object> where typed model exists.
3. **Readability** — guard clauses, sensible names, methods <50 lines (per `execution-core §Code Quality`).
4. **Security** — JWT propagation present (per convention skill). No secrets in code/config. Inputs validated at boundaries.
5. **Performance** — no `.block()` outside Temporal activities (reactive). Indexed Mongo queries. Batched Kafka ops where possible.

---

## Cross-cutting checks (not in any convention skill)

- [ ] New YAML keys present in **all** env profiles (`application*.yml` + `helm/*-values.yml`)?
- [ ] Exceptions handled at the right layer — not silently swallowed?
- [ ] Behavior differences from `main` actually demonstrated (test passes, log/output captured)?
- [ ] Out-of-scope issues **noted** in PR description, not silently fixed?

---

## Severity

| Label | Action |
|---|---|
| **Critical** | Plan scenario broken — blocks pipeline → loop back to Implementer (max 2 cycles) |
| **Required** | Config/wiring/AC unmet — must fix this review cycle |
| **Nit** | Style — note in PR, don't block |
| **Simplify** | Refactor opportunity — separate task, don't block |

---

## Output

```
## Review Findings
1. [{SEV}] {File:line} — {Issue} — Fix: {action}
...

Decision: APPROVE | REMEDIATE
```

`REMEDIATE` if any Critical or Required is open. Else `APPROVE`.
