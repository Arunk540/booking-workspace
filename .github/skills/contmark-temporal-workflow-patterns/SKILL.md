---
name: contmark-temporal-workflow-patterns
description: Temporal.io patterns — carrier model, worker registration, YAML routing, getVersion. Load for Temporal code.
---

# Temporal Workflow Patterns

Temporal.io patterns for Java/Kotlin microservices using carrier-based workflow orchestration.

---

## Carrier Model

Every activity receives and returns the same carrier — flows through entire workflow chain.

```java
@Builder @Data @AllArgsConstructor @NoArgsConstructor
public class WorkflowCarrier {
    private DomainPayload payload;
    private String activityName;
    private String currentEventName;
    private String user;
    @Builder.Default private boolean closeWorkFlow = false;  // abort signal
    private AdditionalExecutions additionalExecutions;       // dynamic injection
    private Queue<Queue<WorkflowCarrier>> activitiesQueue;   // continueAsNew state
}
```

- `closeWorkFlow = true` → workflow aborts remaining queue
- `additionalExecutions` → injects extra activities mid-chain

---

## Activity Interface

Signature is always `Carrier → Carrier`:

```java
@ActivityInterface
public interface ProcessExampleActivity {
    @ActivityMethod
    WorkflowCarrier processExample(WorkflowCarrier carrier);
}
```

---

## Activity Implementation

```java
@Service @RequiredArgsConstructor @Slf4j
public class ProcessExampleActivityImpl implements ProcessExampleActivity {
    private final ExampleDomainService domainService;

    @Override
    public WorkflowCarrier processExample(WorkflowCarrier carrier) {
        try {
            var result = domainService.process(carrier.getPayload()).block();
            if (result == null) { carrier.setCloseWorkFlow(true); return carrier; }
            carrier.setPayload(result);
        } catch (Exception e) {
            log.error("Error: {}", e.getMessage());
            carrier.setCloseWorkFlow(true);
        }
        return carrier;
    }
}
```

**Rules:**
- `.block()` allowed only in activities — always guard for null
- Never throw exceptions out — catch, log, set `closeWorkFlow(true)`
- Inject domain services, never infrastructure directly

---

## New Activity Checklist (all 4 mandatory)

1. **Interface** — `@ActivityInterface` + `@ActivityMethod` in `temporal/activity/`
2. **ActivityNameEnums** — add entry matching method name exactly
3. **application.yml** — add method name to event chain
4. **TemporalWorkerConfig** — register impl bean in `registerActivitiesImplementations()`

---

## Workflow Execution Model

1. Starter creates stub → `start(eventName, carrier)`
2. Config reads activity chain from `application.yml`
3. Activities invoked via untyped stubs with timeout
4. `closeWorkFlow` → drains queue, exits
5. Signals via `@SignalMethod` inject events into running workflow
6. `Workflow.continueAsNew()` when history exceeds limit

---

## Error Handling

| Scenario | Action |
|----------|--------|
| `.block()` returns null | `setCloseWorkFlow(true)`, return |
| Domain exception | Catch, log, `setCloseWorkFlow(true)` |
| Collection access | Check `isEmpty()` before accessing |
| Transient failure | Let Temporal retry handle it |

---

## Backward Compatibility

**Breaking changes** (require drain or `Workflow.getVersion()`):
- Rename/remove `@ActivityMethod` name string
- Remove activity from YAML chain
- Change activity method signature
- Remove/rename `@SignalMethod`
- Change workflow branching logic

**Safe changes:**
- Add new activity (new interface + new YAML entry)
- Add new `@WorkflowMethod`

### Workflow.getVersion()

```java
int version = Workflow.getVersion("add-validation", Workflow.DEFAULT_VERSION, 1);
if (version == Workflow.DEFAULT_VERSION) {
    // old path for in-flight workflows
} else {
    // new path for new instances
}
```

Keep old branches until no in-flight workflows remain on that version.

---

## ⛔ WORKFLOW COMPATIBILITY GATE

Raise for any breaking change:
- Check Temporal UI for in-flight workflows on affected task queue
- If in-flight exist: drain OR use `Workflow.getVersion()`
- Get Tech Lead sign-off before proceeding

