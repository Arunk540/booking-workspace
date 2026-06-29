---
name: contmark-component-testing-cucumber
description: Cucumber BDD component tests — features, step defs, Testcontainers, stubs, triage, handoff. Load for componenttest/ work.
---

# Component Testing — Cucumber BDD

End-to-end testing with real infrastructure via Docker/Testcontainers.

---

## What CT Validates

Full flows through real service: Kafka → Workflow → Activity → DB → REST API. Full Spring context, all infrastructure via containers (MongoDB, Kafka, Schema Registry, Temporal).

---

## External Stub Policy

- Core service execution stays real — no Spring bean mocking
- Stub **only** external boundaries not in the component stack
- Deterministic stub setup in `Given` steps; reset between scenarios
- If `maven-failsafe-plugin` or `cucumber.execution.parallel.enabled=true` is configured, verify ALL external stub components (WireMock, HTTP clients, shared state) are thread-safe and port-isolated before adding new stubs.

---

## File Organization

| Type | Location |
|------|----------|
| Features | `componenttest/src/test/resources/features/` |
| Given/When/Then steps | `steps/{Given,When,Then}StepDefinitions.java` |
| Hooks | `steps/CommonStepDefinitions.java` |
| Test data | `componenttest/src/test/resources/testData/` |

---

## Step Definition Rules

- **Always reuse existing steps** — read all step files first
- New steps go in correct Given/When/Then file — never create new classes
- **Never** `@Before`/`@After` outside `CommonStepDefinitions`
- **Never** `@SpringBootTest` or `@ExtendWith(MockitoExtension.class)`
- **Never** mock beans — full app against real containers

---

## Coverage Checklist

- [ ] Primary happy path
- [ ] Error/rejection path
- [ ] End-to-end with feedback (workflow → feedback → completed)
- [ ] Request/response field-level assertions (not just HTTP status)
- [ ] DB state assertions

---

## Test Data Policy (MANDATORY)

- **Never invent mock data by assumption** — confirm with human first
- Existing `testData/*.json` may not apply to new scenarios — confirm explicitly
- If stub response shape unknown → ask, don't fabricate

---

## Failure Classification

| Symptom | Owner | Action |
|---------|-------|--------|
| `Undefined step` / `PendingException` | CT Agent | Add step |
| Field assertion fails (test data) | CT Agent | Fix JSON |
| Temporal `UNAVAILABLE` | CT Agent | Increase health delay |
| Wrong DB field value | Production | HANDOFF |
| Service container crash | Production | HANDOFF |
| Wrong API response | Production | HANDOFF |

---

## Handoff Protocol

```
CT failure requiring production fix.
Scenario: '<TITLE>' tag @<TAG>
Feature: componenttest/src/test/resources/features/<File.feature>
Failure: <assertion error>
Expected: <X>  Actual: <Y>
Likely: <service class>
Constraint: Do NOT modify componenttest/ or src/test/.
```

After 2 unsuccessful cycles → escalate to user.

---

## Run Commands

```bash
# Maven
mvn verify -pl componenttest -Dspring.profiles.active=local -Dcucumber.filter.tags="@TAG"

# Gradle
./gradlew :componenttest:test -Dspring.profiles.active=local
```

---

## Parallel Safety

- `SharedContext` must use `ThreadLocal`
- Stub setup/teardown per scenario
- Use unique IDs per scenario for DB isolation

