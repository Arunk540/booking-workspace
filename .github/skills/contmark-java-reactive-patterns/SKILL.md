---
name: contmark-java-reactive-patterns
description: WebFlux patterns — Mono/Flux chains, .block() rules, null safety, errors, Context. Load for reactive code.
---

# Java Reactive Patterns

Generic reactive Java patterns for Spring WebFlux microservices. Technology-agnostic — works with any service using Project Reactor.

---

## Core Principles

| # | Rule | Details |
|---|------|---------|
| 1 | **Reactive only** | `Mono<T>`/`Flux<T>` everywhere in service, domain, and infrastructure layers |
| 2 | **No blocking** | `.block()` only in Temporal activity implementations — nowhere else |
| 3 | **Null safety** | Always guard `.block()` returns and list access |
| 4 | **Error propagation** | Use `.onErrorMap()` for exception translation, not try-catch |
| 5 | **Side-effect logging** | Use `.doOnSuccess()`/`.doOnError()` — never nested `.subscribe()` |
| 6 | **No detached subscribe** | Always return the reactive type to the caller/framework |

---

## Anti-Patterns & Fixes

| ❌ Anti-Pattern | ✅ Correct Pattern |
|----------------|-------------------|
| `.block()` in service/controller | Return `Mono<T>` / `Flux<T>` to caller |
| `Thread.sleep()` | `Mono.delay(Duration.ofSeconds(n))` |
| `CompletableFuture.get()` | `Mono.fromFuture(cf)` |
| Nested `.subscribe()` | `.flatMap()` to chain |
| `try-catch` in `map`/`flatMap` | `.onErrorMap()` or `.onErrorResume()` |
| ThreadLocal for token/tracing | Explicit parameter passing or Reactor `Context` |

---

## Service Layer Pattern

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ExampleServiceImpl implements ExampleService {
    private final ExampleDomainService domainService;
    private final ExampleMapper mapper;

    @Override
    public Mono<ExampleResponse> process(ExampleRequest request, String authToken) {
        return domainService.process(mapper.toDomain(request), authToken)
                .doOnSuccess(result -> log.info("Processed: {}", result.getId()))
                .doOnError(error -> log.error("Failed: {}", error.getMessage()))
                .map(mapper::toResponse);
    }
}
```

---

## Error Propagation Patterns

### Exception Translation
```java
// Domain → API exception translation
.onErrorMap(InfrastructureException.class, 
    e -> new DomainException("Context: " + e.getMessage(), e))
```

### Fallback on Error
```java
// Provide fallback when downstream fails
.onErrorResume(NotFoundException.class, 
    e -> Mono.just(defaultValue))
```

### Empty Stream Handling
```java
// Fail on empty when result is required
.switchIfEmpty(Mono.error(new DataNotFoundException("Entity not found")))

// Provide default when empty is acceptable
.defaultIfEmpty(fallbackValue)
```

---

## Null Safety in Activities (`.block()` context)

When `.block()` is permitted (e.g., Temporal activities):

```java
var result = domainService.process(input).block();

// ALWAYS guard .block() returns
if (result == null) {
    log.error("Null result from domainService.process");
    // Handle: close workflow, return error, etc.
    return handleNullResult();
}

// ALWAYS guard list access
if (CollectionUtils.isEmpty(result.getItems())) {
    log.warn("Empty items list");
    return handleEmptyList();
}
```

---

## Reactive Chain Debugging Checklist

When diagnosing reactive chain issues:

1. **Blocking calls outside activities** — Search for `.block()`, `.blockFirst()`, `.blockLast()` in non-activity files
2. **Broken chains** — Ensure every operator is connected; look for `Mono`/`Flux` created but never returned
3. **Empty Mono** — Add `.switchIfEmpty()` where null results are unexpected
4. **Error swallowing** — Check that errors propagate through the chain, not caught silently
5. **Logging placement** — Use `.doOnSuccess()`/`.doOnError()`, not try-catch blocks
6. **Context propagation** — ThreadLocals don't survive thread hops; pass tokens explicitly or use `.contextWrite()`

---

## Annotations & Conventions

See `spring-java-conventions` for class annotations, MapStruct configuration, and controller/service conventions. These rules apply equally to reactive and non-reactive services.

