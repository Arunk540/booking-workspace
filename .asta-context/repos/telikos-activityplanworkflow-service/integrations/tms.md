---
category: integrations
title: sap tms integration
summary: AP builds Avro TransportOrder payloads from booking service-plan data, publishes them synchronously to the configured TMS topic, and updates AP status around the publish.
primary_for: [activity-plan-tms-integration]
mentions: [activity-plan-rfp-tms-runtime, activity-plan-kafka-contracts]
scenarios:
  - activity plan tms topic
  - tms transport order
  - activity plan tms publish
  - send tms sync
  - tms activity status
  - transport order schema version
  - facility type values
  - scp booking operational facility
  - operational facility as transit
  - scp multistage container
  - why is my facility transit
  - place of delivery transit
  - container stuffing location transit
  - which facilities qualify for the scp transit conversion
  - facility qualifies as transit
  - operational facility eligibility
capabilities: [tms-dispatch]
domains: [tms-dispatch, kafka, activity-plan]
entities: [TmsServiceImpl, PublishTmsActivityImpl, KafkaProducerServiceImpl, TransportOrder, FacilityTypeEnum]
peer_systems: [sap-tms]
direction: outbound
protocol: kafka
topic_or_endpoint: TMS_TOPIC
sources:
  - booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/TmsServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishTmsActivityImpl.java
  - event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java
  - service/src/main/resources/application.yml
  - common/src/main/resources/avro/TransportOrder.v9.avsc
  - common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/dto/enums/FacilityTypeEnum.java
verified_against: a5fbe3845803a0a11d5f55773a966014b0596e2e
last_updated: 2026-08-11
related:
  - runtime/rfp-tms-flow.md
  - contracts/kafka-events.md
---

# SAP TMS integration

- `TmsServiceImpl` maps booking-derived transport orders and only publishes payloads that still contain `servicePlanLegs`. (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/TmsServiceImpl.java:139)
- Topic binding comes from `spring.kafka.producer.topics.tms-topic: ${TMS_TOPIC}`. (source: service/src/main/resources/application.yml:73)
- `PublishTmsActivityImpl` updates AP state around TMS dispatch using activity name and id resolved from workflow utilities. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishTmsActivityImpl.java:31)
- Kafka delivery is synchronous because `KafkaProducerServiceImpl.sendMessageToTms` blocks on `kafkaProducer.send(...).get()`. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:177)
- Success and failure both feed the `activityplan.tms.event.sent` metric with status tags. (source: event/src/main/java/net/apmoller/telikos/microservices/activityplan/event/kafka/KafkaProducerServiceImpl.java:193)
- **Payload schema is `TransportOrder.v9.avsc`; v8 no longer exists in the tree.** v9 adds `standardReasonCode`, document `source` and `documentSentAt`, `dangerousPackageCount`, `chassisServiceType`, and a nested `VehicleProfile` (parties, telecommunication numbers, party-role relationships) under `servicePlanLegs.bookingEquipments.transportAssetRequirement`. Anything asserting on the TMS payload shape must read v9. (source: common/src/main/resources/avro/TransportOrder.v9.avsc)
- `FacilityTypeEnum.COMMERCIAL` now carries the value `"COMMERCIAL"` — it previously mapped to `"OPERATIONAL"`. A consumer still expecting the old string sees an unmatched facility type rather than an error. Added alongside: `RAIL_TERMINAL`, `TERMINAL`, `DEPOT`, `RAILHEAD`. (source: common/src/main/java/net/apmoller/telikos/microservices/activityplan/common/dto/enums/FacilityTypeEnum.java)

## SCP bookings: operational facilities become TRANSIT

- Applies **only to SCP bookings** — `booking.receiveChannel.communicationMediaTypeCode == "SCP"`.
  Every other channel leaves the facility untouched.
  (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/TmsServiceImpl.java:633)
- A facility qualifies only when its `facilityType` is `OPERATIONAL` **and** its `locationFunction`
  is `PLACE_OF_DELIVERY` or `CONTAINER_STUFFING_LOCATION`. An OPERATIONAL facility in any other
  function is left alone.
  (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/TmsServiceImpl.java:679)
- When it qualifies, `locationFunction` is rewritten to `"TRANSIT"` and the cargo load/unload
  start/end events **inside that facility's own block** become transit-time events. Blocks are
  delimited by cargo-start events: the start location owns the first block, the end location owns
  the last — so converting one end never disturbs the other's events.
  (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/TmsServiceImpl.java:642)
- Symmetric across direction: export blocks are delimited by `CARGO_LOAD_*`, import by
  `CARGO_UNLOAD_*`. Handling only the export events silently skips every import SCP booking.
