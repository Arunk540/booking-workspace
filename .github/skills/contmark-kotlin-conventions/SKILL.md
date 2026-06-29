---
name: contmark-kotlin-conventions
description: Kotlin Spring conventions — data classes, null safety, coroutines vs reactive, MapStruct/kapt. Load for src/main/kotlin/ code.
---

# Kotlin Conventions

Kotlin implementation conventions for Spring Boot microservices (WebFlux or coroutines).

---

## Coroutines vs Reactive — Decision

- **Greenfield Kotlin** → prefer coroutines (`suspend`)
- **Existing Java WebFlux** → stay reactive (`Mono/Flux`) for consistency
- **Bridge:** `kotlinx-coroutines-reactor` — `.awaitSingle()`, `.mono{}`, `.asFlow()`

---

## Core Rules

- **Data classes** replace all Lombok (`@Data`, `@Builder`, etc.)
- **`val`** by default; `var` only when framework requires mutability
- **No `!!`** — use `?.let{}`, `?:`, or safe calls
- **No `@Slf4j`** — use `LoggerFactory.getLogger(javaClass)` or `kotlin-logging`
- **Constructor injection** natively — no `@RequiredArgsConstructor`
- **Nullable `T?`** replaces `Optional<T>`

---

## Data Class Patterns

```kotlin
// DTO
data class ExampleApplication(val id: String? = null, val name: String, val status: String? = null)

// Entity
@Document(collection = "examples")
data class ExampleEntity(@Id val id: String? = null, val name: String, val status: String)
```

- Provide defaults for optional fields (`= null`, `= emptyList()`)
- Use `copy()` for mutations

---

## Controller (Coroutines)

```kotlin
@RestController
@RequestMapping("/api/v1/examples")
@Validated
class ExampleController(private val service: ExampleService) {
    @PostMapping
    suspend fun create(
        @RequestHeader("Authorization") authToken: String,
        @RequestBody @Valid request: ExampleApplication
    ): ExampleApplication = service.create(request, authToken)
}
```

Reactive variant: remove `suspend`, return `Mono<T>`. Same thin-controller rules as Java.

---

## Service (Coroutines)

```kotlin
@Service
class ExampleServiceImpl(
    private val domainService: ExampleDomainService,
    private val mapper: ExampleApplicationMapper
) : ExampleService {
    private val log = LoggerFactory.getLogger(javaClass)

    override suspend fun create(request: ExampleApplication, authToken: String): ExampleApplication {
        val domain = domainService.create(mapper.toDomain(request), authToken)
        log.info("Created: {}", domain.id)
        return mapper.toApplication(domain)
    }
}
```

---

## Null Safety Quick-Ref

| Java | Kotlin |
|------|--------|
| `if (x == null) throw ...` | `x ?: throw DataNotFoundException(...)` |
| `Optional<T>` | `T?` |
| `StringUtils.isBlank(s)` | `s.isNullOrBlank()` |

---

## Sealed Classes for Errors

```kotlin
sealed class DomainError {
    data class NotFound(val entityId: String) : DomainError()
    data class InvalidData(val field: String, val reason: String) : DomainError()
}
```

---

## MapStruct (kapt)

```kotlin
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
interface ExampleMapper {
    fun toDomain(source: ExampleApplication): ExampleDomain
    fun toApplication(source: ExampleDomain): ExampleApplication
}
```

Requires `kotlin("kapt")` plugin + `kapt("org.mapstruct:mapstruct-processor:1.5.5.Final")`.

**Alternative:** Manual mapper with `@Component` — simpler, no kapt overhead.

---

## Coroutine-Reactive Bridge

```kotlin
suspend fun <T> Mono<T>.awaitOrThrow(msg: String): T =
    this.awaitSingleOrNull() ?: throw DataNotFoundException(msg)

fun getExampleMono(): Mono<ExampleDomain> = mono { getExampleSuspend() }
fun getExamples(): Flow<ExampleDomain> = fluxCall().asFlow()
```

Dependency: `org.jetbrains.kotlinx:kotlinx-coroutines-reactor`

---

## Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|-------|
| Lombok in Kotlin | Data classes |
| `!!` assertions | `?.let{}`, `?:` |
| `var` everywhere | `val` default |
| `Optional<T>` | `T?` |
| Mutable collections default | Immutable `List`, `Map`, `Set` |
| `@Slf4j` | `LoggerFactory.getLogger(javaClass)` |
| `BeanUtils.copyProperties()` | `copy()` or explicit mapping |

