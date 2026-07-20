---
category: integrations
title: billing workflow integration
summary: AP starts or signals Temporal billing workflows for finance, cost, and invoice-dispatch feedback, then projects billing responses back into AP and booking milestones.
primary_for: [activity-plan-billing-integration]
mentions: [activity-plan-billing-runtime, activity-plan-booking-integration]
scenarios:
  - activity plan billing queue
  - billing signal with start
  - activity plan cost workflow
  - invoice dispatch billing
  - billing feedback queue
capabilities: [billing-dispatch, billing-feedback]
domains: [billing, temporal, activity-plan]
entities: [EventProcessorServiceImpl, BillingWorker, BillingProducerWorker, BillingProducerWorker2]
peer_systems: [telikos-billing-workflow]
direction: outbound
protocol: temporal-signal
topic_or_endpoint: BILLING_SECOND_TASK_QUEUE
sources:
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingWorker.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingProducerWorker.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingProducerWorker2.java
  - booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/BillingServiceImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PopulateBillingDataActivityImpl.java
  - service/src/main/resources/application.yml
verified_against: 7798712a7734edab3d5702cb92271fe7c607933c
last_updated: 2026-07-20
related:
  - runtime/billing-flow.md
  - operations/retries.md
---

# Billing workflow integration

- Standard billing start/update uses workflow type `BillingWorkflow`, task queue `activityplan.billingSecondTaskQueue`, workflow id `bookingId + "_BILLING"`, and `signalWithStart`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:267)
- FSD completion targets the cost workflow on `activityplan.billingCostTaskQueue` with workflow id `bookingId + "_COST"`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:545)
- Invoice dispatch feedback targets workflow id `bookingId + "_INVOICEDISPATCH"` on `activityplan.invoiceDispatchFeedbackTaskQueue`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java:304)
- `BillingWorker` is the only billing-side worker here that registers an activity implementation, namely `BillingFeedbackActivityImpl`, on `biilingFeedbackQueue`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingWorker.java:18)
- `BillingProducerWorker` and `BillingProducerWorker2` are bare Temporal workers that only open `billingTaskQueue` and `billingSecondTaskQueue`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/worker/BillingProducerWorker.java:16)
- `BillingServiceImpl.addDocumentPouchReferences` now enriches the billing reference list with the PO number and Customer Reference Number read from the service plan's `DocumentPouch` — pouch references carry `referenceTypeEnum=UNKNOWN`, so they are matched by `referenceTypeName` (case-insensitive) via `DOCUMENT_POUCH_REFERENCE_NAME_TO_ENUM` and re-stamped with the billing referenceTypeEnum. (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/BillingServiceImpl.java)
- Chassis-reference gating: when a financial job line's charge type code is NOT the configured `chassisRentalChargeCode` (`activityplan.billing.chassis-rental-charge-code`, default `100227`), chassis-related equipment references are filtered out of that line's billing references. (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/BillingServiceImpl.java)
- `activityDateTime` sent to billing is now formatted as a second-precision UTC timestamp (`yyyy-MM-dd'T'HH:mm:ss'Z'`) — set in `ActivityPlanBookingDomainServiceImpl` / `EventProcessorServiceImpl` (#1186; an earlier `Instant` variant #1183 was reverted). (source: booking-domain/src/main/java/net/apmoller/telikos/microservices/activityplan/bookingdomain/service/ActivityPlanBookingDomainServiceImpl.java)
