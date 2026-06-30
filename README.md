# Booking Workspace

> A **multi-repo, AI-assisted workspace** for the Telikos Booking domain.  
> This repository does **not** contain application source code. It stores the shared context, knowledge indexes, cross-repo flow maps, and the agent/skill suite used to analyse and implement tasks across the three related services.

---

## What this workspace is

When working on the Telikos booking domain, the three service repos are cloned locally into this workspace folder and worked on as a set. This repo exists to:

| Purpose | How |
|---|---|
| Store the context of each service — how it works, its modules, its flows | `.contmark/repos/<service>/` |
| Provide index files so agents can identify and trace flows across repos | `.contmark/_global_index.json`, `_repo_router.json`, `_scenarios.json`, `_symbols.json` |
| Hold cross-repo contracts and dependency graph | `.contmark/workspace.yml`, `_global_links.json` |
| Provide a ready set of agents and skills to process and implement any given task | `.github/agents/`, `.github/skills/` |

The three service repos are **pulled and worked on locally**. They are **never pushed** from this workspace — they are excluded via `.gitignore`.

---

## Repos in this workspace

| Repo | Domains | Role |
|---|---|---|
| `telikos-booking-service` | booking, service-plan, RFP, TMS dispatch, vessel tracking, customs, IOM | Entry point — manages booking lifecycle and RFP flow |
| `telikos-activityplanworkflow-service` | activity plan, workflow orchestration, billing, customs, TMS dispatch | Orchestrates activity planning via Temporal workflows |
| `telikos-email-service` | email notification, SendGrid, invoice dispatch | Handles all outbound email triggered by AP/workflow events |

### Dependency chain

```
telikos-booking-service
    └──▶ telikos-activityplanworkflow-service
              └──▶ telikos-email-service
```

There is also a back-channel: `telikos-activityplanworkflow-service` signals back to `telikos-booking-service` via `BOOKING_WORKER_TASK_QUEUE` (Temporal task queue).

---

## Workspace layout

```
booking-workspace/
│
├── .contmark/                        ← Workspace intelligence hub (pushed)
│   ├── workspace.yml                 ← Repo registry, routing rules, cross-repo contracts
│   ├── _global_index.json            ← Unified symbol/class index across all repos
│   ├── _global_links.json            ← Cross-repo dependency graph
│   ├── _repo_router.json             ← Task-to-repo routing map
│   ├── _scenarios.json               ← Curated end-to-end scenario map
│   ├── _symbols.json                 ← Key domain symbols and class identifiers
│   ├── diagrams.md                   ← Flow diagrams
│   ├── lessons.md                    ← Captured learnings from past tasks
│   ├── todos.md                      ← Pending tasks and follow-ups
│   ├── resolve-task.js               ← Script to route a task to the correct repo
│   ├── check-drift.js                ← Script to detect stale context vs source code
│   │
│   └── repos/                        ← Per-repo curated context (pushed)
│       ├── telikos-booking-service/
│       │   ├── _index.json           ← Symbol + flow index for this repo
│       │   ├── architecture/         ← Module breakdown, cross-cutting concerns
│       │   ├── contracts/            ← API contracts, Kafka events, DB schemas
│       │   ├── domain/               ← Core domain concepts
│       │   ├── integrations/         ← How it talks to SAP TMS, VTS, CAMS, IOM, customs, AP
│       │   ├── navigation/           ← Entry points, key classes, usage scenarios
│       │   ├── operations/           ← Failure model, retries, monitoring, feature flags
│       │   ├── runtime/              ← Step-by-step runtime flows (RFP, TMS, customs, vessel)
│       │   └── stack/                ← Tech stack summary
│       │
│       ├── telikos-activityplanworkflow-service/
│       │   ├── (same structure)
│       │   └── runtime/              ← billing flow, cancellation email, customs SDE, RFP→TMS
│       │
│       └── telikos-email-service/
│           ├── (same structure)
│           └── runtime/              ← booking email, invoice dispatch, notification workflow, SendGrid webhook
│
├── .github/                          ← Agents and skills (pushed)
│   ├── agents/                       ← 14 contmark agents (plan, implement, review, test, etc.)
│   └── skills/                       ← 36 domain skill packs (Spring, Kafka, Temporal, Maven, etc.)
│
├── telikos-booking-service/          ← LOCAL ONLY — cloned service source (not pushed)
├── telikos-activityplanworkflow-service/  ← LOCAL ONLY (not pushed)
├── telikos-email-service/            ← LOCAL ONLY (not pushed)
│
├── .gitignore                        ← Excludes the three service folders above
└── README.md                         ← This file
```

---

## Agents available

The `.github/agents/` folder contains ready-to-use Contmark agents:

| Agent | Purpose |
|---|---|
| `contmark.cia` | Read Jira story, analyse context, produce implementation brief |
| `contmark.plan` | Break down task into a step-by-step implementation plan |
| `contmark.implement` | Implement code changes across service repos |
| `contmark.review` | Code review against conventions |
| `contmark.unit-test` | Generate and validate unit tests |
| `contmark.component-test` | Cucumber BDD component tests |
| `contmark.explore` | Explore repo context and understand a code area |
| `contmark.orchestrate` | Orchestrate multi-step tasks across agents |
| `contmark.git.commit` | Stage, commit, and push changes |
| `contmark.security.scan` | Security hardening review |
| `contmark.frontend` | React/frontend feature implementation |
| `contmark.ui-review` | UI accessibility and design-system review |
| `contmark.solo.copilot` | Copilot solo mode |
| `contmark.solo.claude` | Claude solo mode |

---

## Skills available

The `.github/skills/` folder contains 36 skill packs covering:

- **Spring** — Java conventions, MVC patterns, reactive (WebFlux), Kafka consumers
- **Temporal** — Workflow patterns, carrier model, worker registration
- **Testing** — Unit tests (JUnit 5 / Mockito), Cucumber component tests
- **Build** — Maven profiles, Gradle profiles
- **DB** — Migration guardrails, schema-change safety
- **Jira** — Story intelligence, triage, CIA workflow
- **Delivery** — PR delivery, secrets scan, post-PR triage
- **Documentation** — Technical docs, user guides, spec-driven development
- **Other** — Kotlin conventions, security hardening, code review checklist, agent routing pipelines

---

## How to use this workspace

1. **Clone** the three service repos into this workspace folder locally.
2. **Pull** latest from each service repo before starting a task.
3. Give a task to an agent (e.g. a Jira story, a bug fix, a feature request).
4. The agent uses `.contmark` context to understand flows and locate the right code.
5. Changes are made in the local service repos.
6. **Commit and push** workspace metadata updates (`.contmark/`, docs) back to this repo.

---

## What to commit here vs what stays local

| Commit & push | Keep local only |
|---|---|
| `.contmark/` updates (new knowledge, flow notes, index refreshes) | `telikos-booking-service/` source code |
| `.github/` agent or skill updates | `telikos-activityplanworkflow-service/` source code |
| `README.md` and root docs | `telikos-email-service/` source code |
| `lessons.md`, `todos.md`, `diagrams.md` | `.idea/workspace.xml`, `.idea/tasks.xml` |

---

## Maintenance

```zsh
# Check for uncommitted workspace changes
git status

# Detect stale context vs source code
node .contmark/check-drift.js

# Commit workspace metadata only
git add .contmark .github README.md
git commit -m "chore: update workspace context"
git push
```
