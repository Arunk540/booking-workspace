---
name: contmark-maven-build-profiles
description: Maven build profiles, compile commands, module detection, checkstyle, agent commands. Load for Maven projects.
---

# Maven Build Profiles

Build commands for Maven multi-module Spring Boot projects.

---

## Module Detection (MANDATORY — run first)

```bash
grep -E '<module>' pom.xml | sed 's/.*<module>\(.*\)<\/module>.*/\1/' | tr -d ' '
```

- `SERVICE_MODULE` → has `src/main/java/`
- `CT_MODULE` → has Cucumber dependencies
- **Single-module** (no `<modules>`) → use `.`, omit `-pl`

---

## Build Profiles

| Profile | Skips | Used By |
|---------|-------|---------|
| `dev-compile` | JaCoCo, git-commit-id | Implementer + UT |
| `skip-main-recompile` | Main recompile, Avro gen | UT only (combine with dev-compile) |

---

## Agent Commands

| Agent | Command |
|-------|---------|
| Implementer | `mvn test-compile -pl {SERVICE_MODULE} -Pdev-compile` |
| UT (compile tests) | `mvn test-compile -pl {SERVICE_MODULE} -Pdev-compile,skip-main-recompile` |
| UT (run tests) | `mvn test -pl {SERVICE_MODULE} -Pdev-compile,skip-main-recompile` |
| CT | `mvn verify -pl {CT_MODULE} -Dspring.profiles.active=local` |

---

## Compilation Order

`mvn test-compile`: validate (checkstyle) → generate-sources (Avro) → compile (javac + Lombok + MapStruct) → test-compile

---

## Key Rules

- **Never hardcode `service`** — detect from `pom.xml`
- **Never `mvn clean`** — destroys compiled classes (exception: Avro schema change)
- **Checkstyle cache** — `{MODULE}/.checkstyle-cache/` — only changed files re-checked
- **Google style** — 2-space indent, 100-char limit, static→third-party→java imports

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `Undefined Avro type` | `mvn clean package -DskipTests -pl {MODULE}` |
| Checkstyle failure | Check `target/checkstyle-result.xml`, apply Google style |
| MapStruct `cannot find symbol` | Verify `@Mapper` config |
| `maven.main.skip` skips too much | Run Implementer's test-compile first |

