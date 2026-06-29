---
name: contmark-unit-testing-java
description: Unit test conventions — JUnit 5, Mockito, StepVerifier, ≥80% coverage, service/controller/Kotlin. Load for src/test/.
---

# Unit Testing (Java & Kotlin)

JUnit 5 + Mockito patterns for reactive and non-reactive microservices.

---

## Infrastructure

| Concern | Tool |
|---------|------|
| Framework | JUnit 5 + `@ExtendWith(MockitoExtension.class)` |
| Mocking | `@Mock` + `@InjectMocks` |
| Reactive assertions | `StepVerifier` |
| Test data | `Stubs` utility class |
| Location | Mirror `src/main/` under `src/test/` |

---

## Coverage: ≥ 80%

- All `if`/`else` branches exercised
- All exception paths triggered and verified
- All null/empty guards tested

---

## Assertion Rules

| ✅ Do | ❌ Don't |
|-------|---------|
| Assert field values: `assertEquals("CONFIRMED", result.getStatus())` | `assertNotNull(result)` as sole check |
| Validate exception type AND message | Catch-and-ignore |
| `verify()` for delegation as business behavior | `verify(times(1))` as sole assertion |

**Don't test impossible scenarios** — only paths production code actually handles.

---

## JWT Coverage (MANDATORY)

Every service/controller test must verify token forwarding:
```java
verify(domainService).process(any(), eq("Bearer test-token"));
```

---

## Pattern: Reactive Service Test

```java
@ExtendWith(MockitoExtension.class)
class ExampleServiceImplTest {
    @InjectMocks private ExampleServiceImpl serviceImpl;
    @Mock private ExampleDomainService domainService;
    @Mock private ExampleMapper mapper;

    @Test
    void testCreate_success() {
        when(domainService.create(any(), any())).thenReturn(Mono.just(domain));
        when(mapper.toResponse(any())).thenReturn(response);

        StepVerifier.create(serviceImpl.create(request, "Bearer token"))
            .assertNext(r -> assertEquals("expected", r.getField()))
            .verifyComplete();
    }
}
```

## Pattern: Non-Reactive Service Test

```java
@Test
void testCreate_success() {
    when(domainService.create(any(), any())).thenReturn(domain);
    var result = serviceImpl.create(request, "Bearer token");
    assertEquals("expected", result.getField());
    verify(domainService).create(any(), eq("Bearer token"));
}
```

## Pattern: Temporal Activity Test

```java
@Test
void testProcess_success() {
    when(domainService.process(any())).thenReturn(Mono.just(expectedResult));
    var result = activityImpl.processExample(carrier);
    assertEquals("expectedValue", result.getPayload().getField());
}

@Test
void testProcess_error_closesWorkflow() {
    when(domainService.process(any())).thenReturn(Mono.error(new RuntimeException("err")));
    var result = activityImpl.processExample(carrier);
    assertTrue(result.isCloseWorkFlow());
}
```

## Pattern: MockMvc Controller Test

```java
@WebMvcTest(ExampleController.class)
class ExampleControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private ExampleService exampleService;

    @Test
    void testCreate_returnsCreated() throws Exception {
        when(exampleService.create(any(), any())).thenReturn(response);
        mockMvc.perform(post("/api/v1/examples")
                .header("Authorization", "Bearer token")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"test\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("test"));
        verify(exampleService).create(any(), eq("Bearer token"));
    }
}
```

---

## Required Coverage by Class Type

- **Activity:** happy path + error→closeWorkflow + null from `.block()`
- **Service:** happy path + not-found exception + JWT forwarding
- **Controller:** HTTP status + auth header forwarded + response body fields

---

## Test Naming

`test{Action}_{Condition}` — e.g. `testSave_duplicateKey_throwsException`

Kotlin: backtick names — `` `create should throw when entity missing` ``

---

## Kotlin-Specific

- `lateinit var` with `@Mock`/`@InjectMocks`
- `whenever()` from `mockito-kotlin` (not `Mockito.when()`)
- `runTest { }` for suspend function tests
- `StepVerifier` for reactive returns (same as Java)

---

## Key Rules

- **ALWAYS** `@ExtendWith(MockitoExtension.class)`
- **ALWAYS** use `Stubs` utility for test data
- **NEVER** sole `assertNotNull` assertion
- **NEVER** test impossible business scenarios
- Agent owns `test` command — never compile production code

