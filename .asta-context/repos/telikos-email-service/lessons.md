# telikos-email-service — lessons

## build | MapStruct FilerException on `test` without `clean` | status: captured
Running the pinned `mvn -f service/pom.xml test` (or any compile goal) over sources
already processed by a prior `package`/`compile` fails with:
`Internal error in the mapping processor ... Attempt to recreate a file for type ...MapperImpl`
(`javax.annotation.processing.FilerException`). MapStruct re-processes `@Mapper`
classes and cannot overwrite the previously generated `*Impl` in `target/generated-sources`.
**Fix:** always prefix a `clean` — e.g. `mvn -f service/pom.xml clean test`. Same applies
to `clean package`. Treat the `clean` as mandatory for every build/test invocation here.
