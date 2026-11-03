---
category: integrations
title: decision hub nam billing invoice events
summary: For NAM bookings, AP asks Decision Hub which TMS execution events to send to billing as invoice triggers; any failure or non-match falls back to sending every such event present.
primary_for: [activity-plan-decision-hub-integration]
mentions: [activity-plan-billing-integration, activity-plan-billing-runtime]
scenarios:
  - nam billing invoice events
  - decision hub rule call
  - decision hub token refresh
  - which tms events go to billing
  - decision hub rule no match
  - decision hub call fails
capabilities: [decision-hub-rule-lookup]
domains: [billing, nam, decision-hub, activity-plan]
entities: [NamBillingEventsResolver, DecisionHubClient, DecisionHubTokenService, DecisionHubWebClientConfig]
peer_systems: [decision-hub]
direction: outbound
protocol: https
topic_or_endpoint: nam-billing-invoice-events-rules
sources:
  - booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/decisionhub/NamBillingEventsResolver.java
  - booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/decisionhub/DecisionHubClient.java
  - booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/decisionhub/DecisionHubTokenService.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PopulateBillingDataActivityImpl.java
  - service/src/main/resources/application.yml
verified_against: 55f73f4df1c31b8892489af194e7b453774dd7e3
last_updated: "2026-11-03"
related:
  - integrations/billing.md
  - runtime/billing-flow.md
---

# Decision Hub NAM billing invoice events

- `NamBillingEventsResolver.resolveBillableExecutionEvents`, called from `PopulateBillingDataActivityImpl`, decides which of six TMS execution reference types (`ACTUAL_EMPTY_PICKUP/DELIVERY`, `ACTUAL_CARGO_PICKUP/DELIVERY`, `ACTUAL_GATE_IN`, `ACTUAL_EMPTY_RETURN` — `DECISION_HUB_EVENT_NAMES`) are forwarded to billing as invoice triggers for a NAM booking. (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/decisionhub/NamBillingEventsResolver.java:39)
- A booking is "NAM" only if its `BOOKING_COUNTRY` reference code is in `activityplan.billing.nam-country-codes`; non-NAM bookings, or `activityplan.decision-hub.nam-billing-invoice-events.enabled=false`, return no events (billing's legacy behavior is unaffected). (source: .../NamBillingEventsResolver.java:81,145)
- Rule inputs sent to Decision Hub: price-owner party code (`PRICE_OWNER` party), order type, and direction (first word of product name, `EXPORT`/`IMPORT`). **Fail-open on every edge case** — missing inputs, a Decision Hub call error, or no rule match all resolve to "send every present event" rather than none; only an actual rule match can narrow the set. (source: .../NamBillingEventsResolver.java:99-131)
- An event name Decision Hub selects that isn't in `DECISION_HUB_EVENT_NAMES` is logged at WARN and ignored, not sent. Every evaluated booking logs one INFO line with inputs, Decision Hub's selection, what is sent, and what is dropped. (source: .../NamBillingEventsResolver.java:120-142)
- `DecisionHubClient` retries a 401 exactly once with a freshly fetched token (via `DecisionHubTokenService`, which caches/invalidates it); server errors and connection failures retry with `activityplan.decision-hub.max-retries`/`retry-backoff-ms` backoff. Everything else propagates and is caught by the resolver as `DH_ERROR`. (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/decisionhub/DecisionHubClient.java:24-30)
- Config lives under `activityplan.decision-hub.*` (host, consumer-key, iam sub-block for the token endpoint, `nam-billing-invoice-events.enabled`/`resource`/`timeout-ms`), vault-sourced per env under one `decision-hub` vault path. (source: service/src/main/resources/application.yml:185-201)
- The resolver call blocks (`.blockOptional()`), so it must only run inside a Temporal activity (`PopulateBillingDataActivityImpl`), never on a reactive request thread. (source: .../NamBillingEventsResolver.java:29,106-109)
