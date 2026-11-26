# telikos-email-service

Reactive Spring Boot. It turns ap dispatch events into emails (SendGrid) and PDFs (OpenPDF), on Temporal and MongoDB.
There is no root `pom.xml`: build with `-f service/pom.xml`.

## Build and test (verified 26 Nov on develop a1c94d1, JDK 21.0.4)

```bash
mvn -f service/pom.xml clean test -Dtest=<Class>       # scoped; `clean` is mandatory (MapStruct)
mvn -f service/pom.xml clean verify                    # full
```

```bash verify
mvn -q -f service/pom.xml clean test -Dtest=EmailUtilityTest
```

## Usually changes too

- Dispatch handling: `ActivityPlanDispatchEventsServiceImpl` → `EmailServiceImpl`. Constants: `Constants`. PDFs: `PdfBuilder`.

## Things that bite

- Never block in reactive chains. Some old `.block()` calls exist; don't add new ones.
- DTOs are mutable Lombok POJOs (`@Data @Builder`), not records. Match that style.
- Domain services go through interfaces. Persistence goes through `*DataService`; HTTP and Kafka go through gateway classes.

## Where next

`node ~/booking-workspace/.asta-context/ctx.js entry email` · flows in `.asta-context/repos/telikos-email-service/runtime/`.
