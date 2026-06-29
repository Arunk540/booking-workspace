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
  - service/src/main/resources/application.yml
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
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
