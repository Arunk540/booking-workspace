# telikos-booking-service

Reactive Spring Boot (WebFlux). It owns the booking / service-plan lifecycle on Temporal and MongoDB, and exchanges
Kafka events with ap, SAP TMS, CAMS, VTS and customs. There is no root `pom.xml`: build with `-f service/pom.xml`.

## Build and test (verified 26 Nov on develop 658219d7b, JDK 21.0.4)

```bash
mvn -f service/pom.xml clean test -Dtest=<Class>       # scoped; `clean` is mandatory (MapStruct)
mvn -f service/pom.xml clean verify                    # full: unit + checkstyle + jacoco, CI does this
```

```bash verify
mvn -q -f service/pom.xml clean test -Dtest=DomainHelperUtilsRfpValidationTest
```

- Checkstyle runs at `validate` (google_checks, violationSeverity warning) and fails the build.
- Component tests: `componenttest/`, run `mvn -f componenttest/pom.xml verify -Dspring.profiles.active=local` (needs Docker).

## Usually changes too (from 12 months of develop history)

- New constants and status strings: `BookingConstants`. Shared mapping and derivation helpers: `DomainHelperUtils`.
- Enums come in pairs: API `XApplicationEnum` and domain `XEnum`. A new value goes in both, plus their mapper.
- TMS execution: `ProcessTmsExecutionImpl` + `SapTmsExecutionStatusTransportOrderMapper`.
- Ready for Planning: `ProcessReadyForPlanningImpl` and its amend twin `ProcessEditAmendReadyForPlanningImpl`.

## Things that bite

- `ServicePlanMongoTemplate` has several save methods. Each persists only some fields. Check which one your path calls.
- Activity payloads extend `VersionTolerantPayload`: mutate and return the same instance. `toBuilder()` drops unknown fields.
- Main workflow `BookingEventsWorkflowImplementation`: continueAsNew on history size; any logic change needs `Workflow.getVersion`.
- LaunchDarkly: inject the reactor client, return the publisher in the chain, pass an explicit default. Never evaluate a flag inside a workflow.
- Never block (`block()`, `Thread.sleep`) in WebFlux or consumer paths.
- Vessel ETA has two directions: VTS writes it through `VesselTrackingRegistrationActivityImpl`; `booking.references` VESSEL_ETA/ETD is passthrough. Fix both, plus the precedence between them.

## Where next

`node ~/booking-workspace/.asta-context/ctx.js entry booking` · flows in `.asta-context/repos/telikos-booking-service/runtime/`.

[gap] Why each Kafka topic version (v8/v10) exists; check `.asta-context/repos/telikos-booking-service/contracts/kafka-events.md` against the code before relying on it.
