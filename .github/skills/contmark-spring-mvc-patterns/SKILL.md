---
name: contmark-spring-mvc-patterns
description: Spring MVC (non-reactive) — ResponseEntity, @ControllerAdvice, @Transactional, JPA, @KafkaListener. Load for starter-web.
---

# Spring MVC Patterns (Non-Reactive)

Synchronous thread-per-request patterns for `spring-boot-starter-web` services.

> **Which skill?** Check dependencies: `starter-web` → this skill. `starter-webflux` → `java-reactive-patterns`.

---

## Key Differences from WebFlux

| Aspect | MVC | WebFlux |
|--------|-----|---------|
| Returns | `T`, `ResponseEntity<T>` | `Mono<T>`, `Flux<T>` |
| DB | JPA, `MongoRepository` | Reactive Mongo, R2DBC |
| Kafka | `@KafkaListener` | `KafkaReceiver` |
| Transactions | `@Transactional` | Not available |
| HTTP client | `RestClient` | `WebClient` |

---

## Controller

```java
@RestController
@RequestMapping("/api/v1/examples")
@Validated
@RequiredArgsConstructor
public class ExampleController {
    private final ExampleService exampleService;

    @PostMapping
    public ResponseEntity<ExampleApplication> create(
            @RequestHeader("Authorization") String authToken,
            @RequestBody @Valid ExampleApplication request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exampleService.create(request, authToken));
    }
}
```

Rules: thin controller, delegate immediately, forward `authToken`, use Swagger meta-annotations.

---

## Service

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ExampleServiceImpl implements ExampleService {
    private final ExampleDomainService domainService;
    private final ExampleMapper mapper;

    @Override
    public ExampleApplication create(ExampleApplication request, String authToken) {
        var result = domainService.create(mapper.toDomain(request), authToken);
        log.info("Created: {}", result.getId());
        return mapper.toApplication(result);
    }
}
```

---

## Error Handling — @ControllerAdvice

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(DataNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(DataNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage()).toList();
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("VALIDATION_ERROR", String.join(", ", errors)));
    }
}
```

---

## @Transactional

- Place on **service layer** methods, never controllers
- `@Transactional(readOnly = true)` for reads
- MongoDB requires replica set for transactions

---

## Repository

```java
// JPA
public interface ExampleRepository extends JpaRepository<ExampleEntity, String> {
    Optional<ExampleEntity> findByName(String name);
}

// MongoDB (blocking)
public interface ExampleRepository extends MongoRepository<ExampleEntity, String> {
    Optional<ExampleEntity> findByName(String name);
}
```

Kotlin: return `T?` instead of `Optional<T>`.

---

## Kafka — @KafkaListener

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ExampleConsumer {
    private final ExampleService domainService;

    @KafkaListener(topics = "${kafka.topics.example}", groupId = "${kafka.group-id}")
    public void consume(ConsumerRecord<String, ExampleEvent> record) {
        if (record.value() == null) return;
        domainService.process(eventMapper.toDomain(record.value()));
    }
}
```

---

## Outbound HTTP — RestClient (Spring Boot 3.2+)

```java
restClient.get().uri("/api/v1/external/{id}", id)
    .header("Authorization", authToken)
    .retrieve().body(ExternalResponse.class);
```

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Return `Mono<T>` from MVC controller | Return `T` / `ResponseEntity<T>` |
| `@Transactional` on controllers | Service layer only |
| Mix `starter-web` + `webflux` | One per module |
| `Thread.sleep()` | `@Scheduled` or `ScheduledExecutorService` |
| Catch exceptions in controller | Use `@ControllerAdvice` |

