---
name: contmark-plan-templates
description: Plan output templates for each pipeline mode. Load at Stage 1 to structure plan.md correctly.
---

# Plan Templates

## Feature Mode

```markdown
# Plan: {FEATURE_NAME} [Feature]

## Stack
- **Build:** Maven | Gradle
- **Language:** Java | Kotlin
- **Stack:** WebFlux | MVC
- **CT Module:** present | absent

## Overview
**Objective:** {What and why — one paragraph}

### Request Flow
{ASCII diagram showing data flow: Actor → Controller → Service → Repository → Response. Adapt for Kafka/Temporal/external APIs.}

**Success Criteria:**
- [ ] {Testable business criterion}

**Boundaries:** Always: {X} | Ask first: {Y} | Never: {Z}

## Implementation Tasks
### Task 1: {Title}
- **Files:** CREATE {paths} | MODIFY {paths}
- **AC:** {What must be true when done}
- **Verify:** compiles, no checkstyle violations

## Unit Test Matrix
| # | Class Under Test | Business Scenario | Expected Behavior |
|---|------------------|-------------------|-------------------|
| 1 | {Class} | {scenario} | {expected} |

## Component Test Scenarios
> Only if CT_MODULE: present. Otherwise: ⚠️ CT Module: not found — CT Scenarios skipped.
> Mock request/response data confirmed by human before writing scenarios.

### Scenario 1: {Business outcome}
Given {precondition}
When {action}
Then {outcome — status code + business state}

## Risks
| Risk | Impact | Mitigation |
|------|--------|------------|

## Implementation Order
models → mappers → services → controller → config
```

## UT-only Mode

```markdown
# Plan: {CLASS_OR_FEATURE} [UT-only]

## Stack
- **Build:** Maven | Gradle
- **Language:** Java | Kotlin
- **Stack:** WebFlux | MVC

## Unit Test Matrix
| # | Class Under Test | Business Scenario | Expected Behavior |
|---|------------------|-------------------|-------------------|
```

## CT-only Mode

```markdown
# Plan: {FEATURE_NAME} [CT-only]

## Stack
- **Build:** Maven | Gradle
- **Language:** Java | Kotlin
- **Stack:** WebFlux | MVC
- **CT Module:** present

## Component Test Scenarios
> Mock data confirmed by human.

### Scenario 1: {Business outcome}
Given / When / Then
```

## Test Mode (UT + CT)

```markdown
# Plan: {CLASS_OR_FEATURE} [Test]

## Stack
- **Build:** Maven | Gradle
- **Language:** Java | Kotlin
- **Stack:** WebFlux | MVC
- **CT Module:** present | absent

## Unit Test Matrix
| # | Class Under Test | Business Scenario | Expected Behavior |
|---|------------------|-------------------|-------------------|
| 1 | {Class} | {scenario} | {expected} |

## Component Test Scenarios
> Only if CT_MODULE: present. Otherwise: ⚠️ CT Module: not found — CT Scenarios skipped.

### Scenario 1: {Business outcome}
Given {precondition}
When {action}
Then {outcome — status code + business state}
```

No spec, tasks, or risks section — test-only mode.
