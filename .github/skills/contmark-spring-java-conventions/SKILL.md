---
name: contmark-spring-java-conventions
description: Spring Java conventions — annotations, MapStruct, thin controllers, error handling, YAML propagation. Load for src/main/java/.
---

# Spring Java Conventions

Implementation conventions for Java Spring Boot + MongoDB + Temporal + Kafka. Applies to both reactive and non-reactive.

> **Kotlin:** see `kotlin-conventions` · **Non-reactive:** see `spring-mvc-patterns`.

---

## Class Annotations

| Type | Annotations |
|------|-------------|
| Controller | `@RestController`, `@RequestMapping`, `@Validated`, `@RequiredArgsConstructor`, `@Slf4j` |
| Service | `@Service`, `@RequiredArgsConstructor`, `@Slf4j` |
| DTO / Request / Response | `@Builder`, `@Getter`, `@Setter` (never `@Data`) |
| Service / Domain model | `@Builder`, `@Data`, `@AllArgsConstructor`, `@NoArgsConstructor` |
| Persistence entity | `@Builder`, `@Data`, `@AllArgsConstructor`, `@NoArgsConstructor`; `@Document` on root only |
| Mapper | `componentModel = "spring"`, `unmappedTargetPolicy = IGNORE` |
| Activity | `@ActivityInterface` + `@ActivityMethod` (interface); `@Service` (impl) |

---

## 3-Tier Model Boundaries

| Model | Allowed In | Never In |
|-------|-----------|----------|
| `*Application` | api/ | infrastructure/, persistence/ |
| Domain (plain) | domain/, api/service/, temporal/ | — |
| `*Entity` | infrastructure/, persistence/ | api/controller/ |

Map at every boundary. Never expose Entity in controllers. Never import Application into persistence.

---

## Controller Rules

- Thin — delegate immediately to service interface
- JWT `authToken` header on every endpoint; forward downstream
- Swagger meta-annotations from `api/swagger/` — never inline `@Operation`
- No business logic

---

## Error Handling

- Domain exceptions: `InvalidDataException`, `DataNotFoundException`
- Reactive: `.onErrorMap()` for translation — never try-catch in reactive chains
- Activities: catch → log → `setCloseWorkFlow(true)`

---

## YAML Propagation

New config key in `application.yml` → **must** propagate to all env profiles in `helm/*-values.yml`.

---

## General Rules

- Lombok everywhere (Java) — replaces boilerplate
- No unused code — only add consumed enums/fields
- Clean imports — don't reorganize in untouched files
- Layer lock — implement only requested layer
- Index MongoDB queries, batch Kafka ops, minimize `.block()`
