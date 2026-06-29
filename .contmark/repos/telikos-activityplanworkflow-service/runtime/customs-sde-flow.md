---
category: runtime
title: customs and service delivery flow
summary: Customs dispatch, customs acknowledgements, service delivery execution, and FSD completion share one AP runtime path with optional billing escalation.
primary_for: [activity-plan-customs-sde-runtime]
mentions: [activity-plan-billing-runtime, activity-plan-customs-integration]
scenarios:
  - activity plan customs send
  - customs execution status
  - activity plan service delivery
  - service delivery status update
  - fsd completion billing
capabilities: [customs-dispatch, service-delivery-execution, fsd-completion]
domains: [customs, activity-plan, billing]
entities: [ActivityPlanWorkflowImplV2, SendToCustomsActivityImpl, ServiceDeliveryExecutionActivityImpl, FsdUpdateActivityImpl]
sources:
  - workflow/src/main/resources/domain-rules.yml
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendToCustomsActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishMsgToCustomsActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/ServiceDeliveryExecutionActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/FsdUpdateActivityImpl.java
  - workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/service/EventProcessorServiceImpl.java
verified_against: 63f837a2e764f3ddcfc244c2fc2d7278d0c35436
last_updated: 2026-06-18
related:
  - integrations/customs.md
  - runtime/event-activity-matrix.md
---

# Customs and service delivery flow

- Domain rules map `Send to Customs` and `Amendment Send to Customs` to the `sendToCustoms` task, while `Service Delivery Execution` and `FSD Completion` route to `serviceDeliveryExecution` and `fsdCompletion`. (source: workflow/src/main/resources/domain-rules.yml:16)
- `processSendToCustoms` saves AP state unless the event is `MANUAL_CUSTOMS_STATUS_UPDATE`, publishes to customs only for blank `eventType`, and escalates to billing for configured S4 country paths. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:747)
- `SendToCustomsActivityImpl` creates `Send To Customs` as `PENDING`, updates open customs rows on ACK or execution status, and creates `Customs Execution Status` when a customs ACK closes successfully. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/SendToCustomsActivityImpl.java:33)
- `PublishMsgToCustomsActivityImpl` updates AP state to `PENDING` before the shared customs Kafka producer sends the Avro payload. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/PublishMsgToCustomsActivityImpl.java:20)
- `processSdeTasksInSignal` optionally handles `CONTAINER_UPDATED` data, then runs `serviceDeliveryExecution`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/workflow/ActivityPlanWorkflowImplV2.java:498)
- `ServiceDeliveryExecutionActivityImpl` upgrades `PENDING` to `IN_PROGRESS` for `IN_EXECUTION` events and closes the activity when execution completes. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/ServiceDeliveryExecutionActivityImpl.java:27)
- `FsdUpdateActivityImpl` delegates FSD completion to `sendFsdDataToBilling`, which signals the cost workflow on `billingCostTaskQueue` with workflow id `bookingId + "_COST"`. (source: workflow/src/main/java/net/apmoller/telikos/microservices/activityplan/activity/FsdUpdateActivityImpl.java:20)
