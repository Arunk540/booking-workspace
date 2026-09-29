---
category: integrations
title: sap tms exchange
summary: "Business exchange with SAP TMS: outbound SEND_TO_TMS initiation from booking and inbound Kafka feedback/execution events from SAP."
primary_for: [sap-tms-exchange]
mentions: [sap-country-gating, ack-feedback-processing, execution-status-processing]
scenarios: [sap exchange routing, sap exchange feedback, sap tms execution, send to sap tms, sap exchange topics, chassis vendor on transport order, actual chassis vendor, recommended chassis vendor, ZA ZR party role, chassis on tms execution, nam transport leg replace by freight order, nam actual departure arrival fcl ecl, driver id zdriverid alternative code, nam container execution status resolver, tare weight wiped by tms execution status, equipment profile omitted tms message]
capabilities: [sap-integration-mapping, feedback-reconciliation]
domains: [booking, sap-tms]
entities: [BookingSendToTmsDomainService, SapFeedbackConsumerService, SapTmsExecutionStatusConsumerService, ProcessTmsExecutionImpl, NamContainerExecutionStatusResolver, DomainHelperUtils]
sources:
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/BookingSendToTmsDomainService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapFeedbackConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/consumer/SapTmsExecutionStatusConsumerService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/mapper/SapTmsExecutionStatusTransportOrderMapper.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessTmsExecutionImpl.java
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/NamContainerExecutionStatusResolver.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/DomainHelperUtils.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/RentalChassisBillableDurationCalculator.java
verified_against: dbe41b122b0e4dd1daaa248204c70c2b809caed2
last_updated: "2026-09-29"
related:
  - runtime/confirm-send-to-tms-flow.md
  - runtime/sap-tms-feedback-flow.md
  - operations/flags-and-lists.md
peer_systems:
  - sap-tms
direction: bidirectional
protocol: kafka
topic_or_endpoint: "KAFKA_SAP_TMS_FEEDBACK_TOPIC + KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC"
---

# SAP TMS exchange

- Outbound business initiation starts at `POST /bookings/{bookingId}/send-to-tms`, which validates country/status and emits the `SEND_TO_TMS` workflow event. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/inland/service/api/BookingSendToTmsDomainService.java:43)
- `ProcessSendToTmsImpl` is the last in-repo branching point before downstream TMS handling and chooses SAP-vs-non-SAP side effects together with NAM CAMS/VTS registration inserts. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessSendToTmsImpl.java:39)
- Inbound acknowledgement feedback arrives on `${KAFKA_SAP_TMS_FEEDBACK_TOPIC}` and is processed by `SapFeedbackConsumerService`. (source: service/src/main/resources/application.yml:155)
- Inbound execution-status feedback arrives on `${KAFKA_SAP_TMS_EXECUTION_STATUS_TOPIC}` and is processed by `SapTmsExecutionStatusConsumerService`. (source: service/src/main/resources/application.yml:168)
- Ack feedback reconciles transport-order acknowledgement state and then republishes AP and IOM ack events through the `SAP_TMS_ACK_FEEDBACK` activity list. (source: service/src/main/resources/application.yml:379)
- Execution-status feedback updates transport-order and execution status state, then sends an IOM end event through the `SAP_TMS_EXECUTION_STATUS` activity list. (source: service/src/main/resources/application.yml:385)
- `SapTmsExecutionStatusTransportOrderMapper` now maps each inbound `workProcessStatus` to a typed `WorkProcessStatus` (name enum + start/end datetimes + status code) and splits them into leg-level vs plan-level lists: a `"ContainerExecutionStatus"` status is added to the plan-level list and also drives `mapTransportPlanStatus`, everything else stays leg-level. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/mapper/SapTmsExecutionStatusTransportOrderMapper.java)
- `ProcessTmsExecutionImpl` extracts the plan-level `CONTAINER_DELIVERY_EXECUTION` work process (skipping spec-only entries with no `workProcessStatus`) and, only when that status becomes `EXECUTED`, captures the final-destination ATA once — it is never overridden by later execution-status messages. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessTmsExecutionImpl.java)
- `NamContainerExecutionStatusResolver.resolve` now derives `EXECUTED` from **only** the ECL/FCL legs required by the booking's `OrderTypeEnum` (`statusDefiningLegs`), not from every applicable leg — a still-open non-ECL/FCL leg no longer blocks `EXECUTED`. Order types with no ECL/FCL concept (chassis/trailer repositioning, or a null order type) keep the old all-legs behavior. It requires **every hop** of a required indicator, not just one leg per indicator — a round trip with multiple ECL/FCL hops stays `IN_EXECUTION` until all of them individually report `EXECUTED`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/NamContainerExecutionStatusResolver.java:90, :22)
- `RentalChassisBillableDurationCalculator.resolveChassisLegs` takes the **first hop** of the start indicator and the **last hop** of the end indicator across potentially several FCL/ECL legs, instead of the first leg found — a chassis move split over multiple hops is no longer billed from a middle hop. `RentalChassisReferenceApplier` now scopes leg collection to the booking equipment's `uniqueIdentifierNonUuid` (`DomainHelperUtils.collectTransportLegsForEquipment`), replacing a prior single-container assumption — each container in a multi-container order now gets its own chassis billable-duration/vendor calculation. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/RentalChassisBillableDurationCalculator.java:262; domain/common/DomainHelperUtils.java:2969)
- For NAM bookings, `ProcessTmsExecutionImpl.updateTransportPlan` replaces stored transport legs at **freight-order-number** granularity (`overwriteNamTransportLegs`) instead of the per-leg merge non-NAM bookings use, and `DomainHelperUtils.applyNamActualTimes` sets plan actual departure/arrival from the FCL/ECL leg pair (by order type + direction) rather than by leg position. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessTmsExecutionImpl.java:930; domain/common/DomainHelperUtils.java:1105)
- On a container's first TMS message, the stored plan has no leg yet for the owning FCL/ECL indicator; `applyNamActualTimes` now clears that actual time instead of letting the inbound message's own last-leg value stand in — an import round trip no longer shows the laden leg's arrival as the container's `ACTUAL_TIME_OF_ARRIVAL` before the empty-return leg reports. `ACTUAL_TIME_OF_DEPARTURE`/`ARRIVAL` sent to IOM are likewise read from the **stored** plan (`findNamActualTimesPlan`/`ownsNamActualTimes`), not the inbound message, since one inbound message only ever carries one freight order. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/domain/common/DomainHelperUtils.java:1165, :964)
- `SapTmsExecutionStatusTransportOrderMapper.fetchDrivers` now also maps `driverId`, read from the party's `alternativeCodes` entry whose `alternativeCodeName` is `ZDriverID` (same ZD1/ZD2-role parties as name/phone). (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/mapper/SapTmsExecutionStatusTransportOrderMapper.java:883, :930)
- Equipment `tareWeight` is only overwritten when the inbound TMS message actually carries one (`setIfPresent`) — later execution-status messages often omit `equipmentProfile` entirely, and applying them naively would wipe a tare weight captured earlier. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessTmsExecutionImpl.java:754, :804)

## Chassis vendors on the transport order

- Chassis vendors arrive as party **roles**, not as a party function like the carrier — `ZA` is the
  ACTUAL chassis vendor and `ZR` the RECOMMENDED one. Looking for them where the carrier is found
  returns nothing.
  (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/temporal/activity/ProcessTmsExecutionImpl.java)
- Both are mapped onto **every** transport leg (`TransportLeg::setActualChassisVendor` /
  `setRecommendedChassisVendor`), not onto the order as a whole.
- A party carrying the role but a blank `partyCode` is skipped and logged rather than written as an
  empty vendor — so a missing chassis vendor downstream is a data problem upstream, not a mapping bug.
