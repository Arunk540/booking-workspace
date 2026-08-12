---
category: operations
title: flags and routing lists
summary: "Feature flags, country/channel lists, and toggle-driven routing branches that materially change booking behavior."
primary_for: [booking-feature-switches]
mentions: [one-click-routing-lists, sap-country-list, migration-guard-flag]
scenarios: [booking feature flags, booking routing lists, one click channels, sap tms countries, migration flag]
capabilities: [toggle-audit, routing-explanation]
domains: [booking, operations]
entities: [BookingEventOperationService, MigrateDataController, EventRouterService]
sources:
  - service/src/main/resources/application.yml
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/service/BookingEventOperationService.java
  - service/src/main/java/net/apmoller/crb/telikos/microservices/booking/api/controller/MigrateDataController.java
verified_against: 6ee7d83b6e6a427b680025a1758a40ab4775acca
last_updated: "2026-08-11"
related:
  - runtime/confirm-send-to-tms-flow.md
  - runtime/rfp-flow.md
  - integrations/cams.md
---

# Flags and routing lists

- `app.dataMigration` defaults from `${DATA_MIGRATION:false}` and gates `POST /migrate/rel2/data`. (source: service/src/main/resources/application.yml:304)
- `LIST_OF_ONE_CLICK_CHANNELS` feeds `spring.application.one-click-channels`; matching receive channels set `eventType=ONE_CLICK_BOOKING`. (source: service/src/main/resources/application.yml:31)
- `LIST_OF_ONE_CLICK_COUNTRIES` feeds `spring.application.one-click-countries`; matching start-location countries also set `eventType=ONE_CLICK_BOOKING`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/booking/events/service/BookingEventOperationService.java:87)
- Both one-click lists now default to **empty** (`${LIST_OF_ONE_CLICK_COUNTRIES:}`), not to the literal `[]` they used to. The old default was parsed as a one-element list holding the string `"[]"`, so an unset environment silently produced a list that matched nothing yet was not empty — the two behave differently anywhere the code checks `isEmpty()`. (source: service/src/main/resources/application.yml:31)
- `LIST_OF_SAP_TMS_COUNTRIES` feeds `spring.application.sap-Tms-countries` and is the country gate for SEND_TO_TMS eligibility. (source: service/src/main/resources/application.yml:31)
- `LIST_OF_NAM_COUNTRIES` feeds `spring.application.nam-countries` and controls CAMS/VTS registration branching for SEND_TO_TMS. (source: service/src/main/resources/application.yml:31)
- `LIST_OF_SEND_TO_CUSTOMS_COUNTRIES` feeds `spring.application.send-to-customs-countries` and participates in additional SEND_TO_TMS side effects. (source: service/src/main/resources/application.yml:31)
- `EVENT_ROUTER_RETRY_ENABLED` defaults true under `audit.kafka.retry.enabled` and controls persistence of failed AP/Kafka publishes. (source: service/src/main/resources/application.yml:210)
- `containerAvailability.enabled` defaults false and disables outbound CAMS calls when off. (source: service/src/main/resources/application.yml:65)
- `VESSEL_TRACKING_ENABLED` defaults true and controls VTS registration activity execution. (source: service/src/main/resources/application.yml:74)
- `TEMPORAL_HANDLE_OLD_BOOKINGS_ENABLED` defaults false and alters Temporal handling for older bookings. (source: service/src/main/resources/application.yml:225)
