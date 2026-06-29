---
name: contmark-gradle-build-profiles
description: Gradle build commands, module detection, Kotlin DSL, kapt/ksp, Avro, agent commands. Load for Gradle projects.
---

# Gradle Build Profiles

Build commands and configuration for Gradle-based Spring Boot projects (`build.gradle.kts`).

---

## Module Detection (MANDATORY — run first)

```bash
grep -E 'include\(' settings.gradle.kts | sed 's/.*include(":\?\(.*\)")/\1/' | tr -d ' '
```

- `SERVICE_MODULE` → has `src/main/kotlin/` or `src/main/java/`
- `CT_MODULE` → has Cucumber/Testcontainers dependencies
- **Single-module** (no `include(`) → omit `:module:` prefix

---

## Agent Commands

| Agent | Command |
|-------|---------|
| Implementer | `./gradlew :{SERVICE_MODULE}:testClasses -PdevCompile` |
| Implementer (compile-only) | `./gradlew :{SERVICE_MODULE}:compileKotlin -PdevCompile` |
| UT (compile tests) | `./gradlew :{SERVICE_MODULE}:compileTestKotlin -x compileKotlin -x compileJava -x kaptGenerateStubsKotlin -x kaptKotlin -PdevCompile` |
| UT (run tests) | `./gradlew :{SERVICE_MODULE}:test -x compileKotlin -x compileJava -x kaptGenerateStubsKotlin -x kaptKotlin -PdevCompile` |
| CT | `./gradlew :{CT_MODULE}:test -Dspring.profiles.active=local` |

**Why `-x` flags:** Skipping main recompile avoids kapt re-processing (saves 30–60s).

---

## Compilation Order

`testClasses` runs: generateAvroJava → compileKotlin (+ kapt) → compileJava → compileTestKotlin

---

## Key Rules

- **Always** `./gradlew` (wrapper) — never global `gradle`
- **Always** `build.gradle.kts` (Kotlin DSL)
- **Never** `./gradlew clean` unless Avro schema changed
- **Always** detect modules from `settings.gradle.kts` — never hardcode

---

## Annotation Processing

| Processor | Tool | Notes |
|-----------|------|-------|
| MapStruct | `kapt` | Required — no KSP support yet |
| Lombok (Java files) | `kapt` | Avoid in pure Kotlin |

kapt config:
```kotlin
kapt {
    arguments {
        arg("mapstruct.defaultComponentModel", "spring")
        arg("mapstruct.unmappedTargetPolicy", "IGNORE")
    }
}
```

---

## Avro Generation

```kotlin
tasks.named("compileKotlin") { dependsOn("generateAvroJava") }
```

---

## gradle.properties

```properties
org.gradle.jvmargs=-Xmx2g -XX:+HeapDumpOnOutOfMemoryError
org.gradle.caching=true
org.gradle.configuration-cache=true
org.gradle.parallel=true
kapt.use.worker.api=true
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `Unresolved reference` to Avro class | Add `dependsOn("generateAvroJava")` |
| MapStruct `Cannot find symbol` | Verify kapt plugin + processor |
| `@SpringBootApplication` not found | Add `kotlin("plugin.spring")` |
| `No beans of type found` | Ensure `plugin.spring` applied (opens final classes) |
| OOM during kapt | `kapt.use.worker.api=true` |

---

## Maven ↔ Gradle Mapping

| Maven | Gradle |
|-------|--------|
| `mvn test-compile -Pdev-compile` | `./gradlew :M:testClasses -PdevCompile` |
| `mvn test -Pskip-main-recompile` | `./gradlew :M:test -x compileKotlin -x compileJava -x kapt* -PdevCompile` |
| `mvn verify -pl CT` | `./gradlew :CT:test` |
| `mvn clean package -DskipTests` | `./gradlew clean :M:bootJar` |

