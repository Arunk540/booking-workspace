# telikos-activityplanworkflow-service

Reactive Spring Boot. It consumes booking events (Kafka, Avro), drives them through Temporal workflows, and stores the
activity plan in MongoDB. It publishes to email, event history, TMS, customs and billing, and signals booking back.
Root `pom.xml` is an 8-module reactor; `componenttest/` is outside it.

## Build and test (verified 26 Nov on develop 149b8d45, JDK 21.0.4)

```bash
mvn clean test -pl workflow -am -Dtest=<Class> -Dsurefire.failIfNoSpecifiedTests=false   # scoped, from repo root
mvn clean install                                                                        # full; needed before component tests
```

```bash verify
mvn -q clean test -pl workflow -am -Dtest=HelperUtilsTest -Dsurefire.failIfNoSpecifiedTests=false
```

- Unit tests live in `workflow`, `booking-domain`, `event`, `persistence`, `api`. `-pl service` has none.
- JDK: Corretto 21.0.11 breaks Lombok here (`TypeTag :: UNKNOWN`). Use 21.0.4.
- Component tests: `cd componenttest && mvn test -Dspring.profiles.active=local` after `mvn clean install -DskipTests`.

## Usually changes too

- Billing: `BillingServiceImpl` + `PopulateBillingDataActivityImpl`. TMS: `TmsServiceImpl`. Constants: `Constants`.
- Workflow logic lives in `ActivityPlanWorkflowImplV2`. The V1 class stays for replay of old runs.

## Things that bite

- Events arrive through `EventProcessorServiceImpl` as signalWithStart, with workflowId = bookingId. Every event lands on the same workflow id.
- Changing workflow code needs `Workflow.getVersion` and a replay test. Breaking open workflows is the main risk.
- `common`, `booking-domain` and `persistence` feed everything: rebuild from the root (`-am`) after changing them.
- Component-test DTOs are separate copies (Gson). If they drift from service DTOs, enums are silently nulled and you get 50 s awaitility timeouts.
- Each new `${VAR}` without a default must also be passed by the component-test runner, or the container won't boot.

## Where next

`node ~/booking-workspace/.asta-context/ctx.js entry ap` · flows in `.asta-context/repos/telikos-activityplanworkflow-service/runtime/`.
