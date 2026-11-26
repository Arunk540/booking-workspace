# booking-workspace

Three Telikos services worked on as a set. Each service checkout loads its own file
(`services/<svc>/CLAUDE.md`) as `CLAUDE.local.md`.

| svc | repo | role |
|---|---|---|
| booking | `telikos-booking-service` | booking / service-plan lifecycle, RFP, TMS dispatch, VTS, CAMS, customs |
| ap | `telikos-activityplanworkflow-service` | activity plan on Temporal; billing, TMS, customs, email events |
| email | `telikos-email-service` | outbound email (SendGrid), PDFs |

Flow: booking → Kafka → ap → Kafka → email. ap signals booking back over the Temporal
`BOOKING_WORKER_TASK_QUEUE`. IOM is not ours: never change, investigate or work around it.

## Find code first: never grep the repos blind

```bash
node ~/booking-workspace/.asta-context/ctx.js find "<task words>"
node ~/booking-workspace/.asta-context/ctx.js entry <svc> [kafka|rest|workflow|activity]
```

- `find` prints ranked repo/path:line, the matching test, and the docs to read. It indexes develop.
  In a task checkout the paths point into it. Never read or edit `~/booking-workspace/telikos-*`:
  those are Arun's working copies, on his own branches.
- No good hit: retry with the class, topic or enum words. Then `entry`. Only then grep, inside one module.
- Read the hit and the files it calls. Don't read whole packages. Exploration across more than 10 files
  goes to a subagent that returns `file:line` + one line each.
- Flows and contracts: `.asta-context/repos/<repo>/{runtime,contracts,integrations}/`.

## Cross-repo changes

A change crosses services when data or a signal moves between them (Kafka event, Temporal signal, REST).
1. `find` prints a `cross-repo:` block when its hits span services. For each shared type it names, run
   `node ~/booking-workspace/.asta-context/ctx.js flow <Type>`. That gives the schemas, models, mappers
   and users in every repo.
2. Write one plan line per hop: `CONTRACT: <what crosses> · <repo>/<File> (producer) → <repo>/<File> (consumer)`.
3. Each repo has its own `.avsc` copy. Change every copy the hop uses, plus both mappers.

## Docs vs code

When a doc here and the code disagree, follow the code. List each mismatch in your
final reply as `doc → says X, code does Y`.

## Done means

The scoped tests for every changed class pass (commands in the service file), and
the diff touches only what the task needs. "Tests run: 0" is a failure.
