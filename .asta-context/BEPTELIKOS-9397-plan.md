# Plan: BEPTELIKOS-9397 — Vessel ETA/ETD two-store source-keyed sync (VTS ⇄ upstream) [Bug]

## Stack
- Maven (`mvn -f service/pom.xml`) · Java · WebFlux · Temporal · Kafka · Mongo · **repo:** telikos-booking-service (single-repo; no cross-repo/contract/Avro impact) · CT present

## Corrected domain model (per Arun) — two stores, source-keyed direction
Vessel ETA (import) / Vessel ETD (export) live in BOTH `booking.references`
(`VESSEL_ETA`/`VESSEL_ETD`) AND `ServicePlan.serviceDates`
(`VESSEL_ARRIVAL/ESTIMATED` / `VESSEL_DEPARTURE/ESTIMATED`), and must stay in sync.

```
 UPSTREAM (user enters ETA/ETD via RFP or editor/amend)
   → value lands in booking.references
   → DIRECTION A: copy/replace into ServicePlan.serviceDates          ← MISSING today

 VTS (vessel schedule response)
   → value lands in ServicePlan.serviceDates (already works)
   → DIRECTION B: copy/replace into booking.references                ← MISSING today (the reported bug)

 PRECEDENCE: a VTS value OVERRIDES a user-entered value — even a user amend
             that arrives AFTER VTS must NOT clobber the VTS value (ticket R3).
```

## Discovery evidence (both directions absent)
- **Dir B writers (serviceDates only, never references):** `VesselTrackingRegistrationActivityImpl.updateVtsResponse` (:302 sync) + `VesselInformationDomainService.applyVesselDates` (:99 async PATCH). Grep confirms NO write-side sets a `VESSEL_ETA`/`VESSEL_ETD` reference anywhere — it is pure passthrough from the inbound IOM payload.
- **Dir A hooks (references present, never copied to serviceDates):** RFP create `InitialReadyForPlanningEventsDomainService.processReadyForPlanning` (:82) and amend `AmendEditRfpEventsDomainService.captureBookingEvents` (:30 → `EDIT_AMEND_READY_FOR_PLANNING` workflow). `createTransitServiceDates` (:387) only handles TRANSIT legs — no vessel ETA/ETD copy exists.
- **Provenance:** `ServiceDate` = {timeStamp, eventTiming, eventTrigger} and `Reference` = {reference, typeCode, typeName, typeEnum} — **neither carries a source field**, and the amend flow does NOT re-fetch the persisted booking (only `newServicePlan`). So there is no existing way to tell a VTS value from a user value → precedence cannot be enforced without a new mechanism.
- Direction (import vs export): `EventsHelperUtils.checkImportExport` (import = origin PORT + dest DOOR).

## Requirement coverage
| # | Requirement | Status |
|---|---|---|
| R2a | VTS overrides vessel serviceDates | covered |
| R2b/DirB | VTS value → `VESSEL_ETA`/`VESSEL_ETD` **reference** | **ABSENT (bug)** |
| DirA | Upstream (RFP/amend) reference → serviceDates | **ABSENT** |
| R3 | VTS overrides user, incl. later amend | **ABSENT — needs precedence mechanism** |
| R4 | Timeout → IOM business exception | already shipped (`VtsDeadlineCalculator`+`VtsCamsChildFanBackActivity`) — out of scope |
| R5 | Import→ETA, Export→ETD (ERD+PortCutoff export = separate) | Phase-1 = ETA/ETD only |

## GRILL — blocking (headless: answer inline)
1. **Precedence mechanism (the crux).** No provenance exists today. Which approach?
   - **(a) add a `source` field to `ServiceDate` (+/or `Reference`)** — VTS writes `source=VTS`; Dir-A sync writes only when the existing entry is absent or `source!=VTS`. Robust, exact R3 semantics. Cost: one nullable field on the Mongo model (no migration) + set it in the VTS paths. *Recommended.*
   - **(b) "existing-value guard" (no new field)** — Dir-A sync skips if a `VESSEL_ARRIVAL/ESTIMATED` serviceDate already exists. Simpler, but can't distinguish a prior *user* value from a VTS value, so a user amend before VTS could be wrongly blocked.
   Which do you want? (I'll build (a) unless you say otherwise.)
2. **Dir-A hook points:** apply the reference→serviceDates copy in BOTH RFP create (`processReadyForPlanning`) and the amend workflow path? And for amend, is merging against the **persisted** booking acceptable (needed to see an existing VTS value for precedence)? *Rec: yes to both.*
3. **Mapping/format (confirm):** import ⇒ `VESSEL_ETA` ⇄ `VESSEL_ARRIVAL/ESTIMATED`; export ⇒ `VESSEL_ETD` ⇄ `VESSEL_DEPARTURE/ESTIMATED`; reference value stored as **UTC ISO** (matching serviceDate & existing `ATA_ENUM` reference). Import = ETA only, export = ETD only for Phase-1?

## Implementation Tasks (Phase-1 — provisional, finalised after answers; assumes precedence option (a))
### Task 1 — provenance + shared sync helpers (`DomainHelperUtils`)
- Add nullable `source` to `ServiceDate` (values e.g. `VTS`/`UPSTREAM`).
- `addOrUpdateBookingReference(servicePlan, typeEnum, typeName, utcValue)` — upsert `booking.references` by `referenceTypeEnum` (mirrors `addOrUpdateServicePlanServiceDate`).
- `syncVesselReferenceFromServiceDate(...)` (Dir B) and `syncVesselServiceDateFromReference(..., respectVtsPrecedence)` (Dir A), each direction-aware via `checkImportExport`.
### Task 2 — Direction B (VTS → references)
- `VesselTrackingRegistrationActivityImpl.updateVtsResponse` and `VesselInformationDomainService.applyVesselDates`: after applying estimated arrival/departure serviceDates (tag `source=VTS`), upsert the matching reference. VTS always wins.
### Task 3 — Direction A (upstream → serviceDates)
- `InitialReadyForPlanningEventsDomainService.processReadyForPlanning` and the amend path: copy `VESSEL_ETA`/`VESSEL_ETD` reference → serviceDate, skipping when the existing serviceDate is `source=VTS`.

## Unit Test Matrix (Phase-1 — provisional)
| # | Class | Scenario | Expected |
|---|---|---|---|
| 1 | `VesselTrackingRegistrationActivityImpl` | import VTS portEta | `VESSEL_ETA` reference = UTC(portEta), serviceDate `source=VTS` |
| 2 | `VesselInformationDomainService` | export PATCH portEtd | `VESSEL_ETD` reference = UTC(portEtd) |
| 3 | RFP service | import booking, user `VESSEL_ETA` ref, no VTS yet | serviceDate `VESSEL_ARRIVAL/ESTIMATED` seeded from ref |
| 4 | amend path | user amend ETA AFTER VTS applied (source=VTS) | VTS serviceDate + reference retained (amend ignored) |
| 5 | VTS path | VTS ETA arrives after user value | both stores overwritten with VTS value |

## CT Scenario (Phase-1)
- NAM import: RFP with user ETA → GET shows serviceDate; then VTS PATCH later ETA → GET shows both reference+serviceDate = VTS value.

**Boundaries:** keep existing serviceDate writes & VTS timeout/IOM logic (R4) intact · ERD/Port-cutoff export references deferred · no Kafka/Avro/API-contract change · stays in telikos-booking-service.
