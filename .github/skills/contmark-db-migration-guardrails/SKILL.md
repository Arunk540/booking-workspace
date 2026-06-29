---
name: contmark-db-migration-guardrails
description: DB schema-change safety — risk class, migration scripts, non-null safety, JPA DDL. MANDATORY for entity/table/column changes.
---

# DB Migration Guardrails

Prevent production startup failures from unsafe schema changes.

---

## Risk Classification

| Change | Risk | Gate |
|--------|------|------|
| New table (no FKs) | Low | Standard review |
| New **nullable** column | Low | Standard review |
| New **non-null** column without default | **Critical** | Tech Lead + migration script + backfill |
| Column rename / type change | **Critical** | Tech Lead + dual-write strategy |
| Index on large table | High | DBA review + maintenance window |
| New FK / relationship | High | Cascade rules reviewed |
| Table/column drop | **Critical** | Two-phase removal |
| Nullable → non-null tightening | **Critical** | Backfill before constraint |

---

## DDL Strategy Risk

| Strategy | Production |
|----------|-----------|
| `validate` | ✅ Safe — fails fast on drift |
| `none` | ✅ Safe — requires explicit scripts |
| `update` | ❌ **Dangerous** — flag as Critical |
| `create`/`create-drop` | ❌ **Never** |

---

## Non-Null Safety (Two-Step)

```sql
-- Step 1: Add nullable with default
ALTER TABLE orders ADD COLUMN status VARCHAR(50) DEFAULT 'LEGACY';
-- Step 2 (after backfill verified): Apply constraint
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
```

---

## Migration Script Requirements

- Location: `src/main/resources/db/migration/V{timestamp}__<description>.sql`
- Idempotent (`IF NOT EXISTS` / `IF EXISTS`)
- Rollback script included
- Tested against clean schema AND schema with existing data
- Committed in same PR as entity change

---

## JPA Annotation Safety

```java
// ❌ UNSAFE on existing table with rows
@Column(nullable = false) private String newField;

// ✅ SAFE — nullable first, tighten via migration
@Column(nullable = true) private String newField;
```

---

## Relationship Safety

For every `@OneToMany`, `@ManyToOne`, `@ManyToMany`:
- Cascade type explicitly defined
- `orphanRemoval` decision documented
- Fetch type explicit (`LAZY` preferred)
- FK column name explicit

---

## ⛔ SCHEMA REVIEW GATE

Raise when: non-null on populated table, column rename/type change, 3+ new columns, new M:N relationship.

```
⛔ SCHEMA REVIEW GATE
Reason: [specific change]
Schema changes: [list]
Required: Tech Lead sign-off before implementation.
```

