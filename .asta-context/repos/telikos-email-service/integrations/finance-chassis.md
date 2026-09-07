---
category: integrations
title: Finance Chassis
summary: Finance Chassis is the fallback outbound REST source for invoice PDFs when S4Hana billing-document download is disabled.
primary_for: [finance-chassis-invoice-pdf]
mentions: [invoice-dispatch-email-flow, email-runtime-flags, email-delivery-retries]
scenarios: [finance chassis invoice, finance chassis failing, why finance chassis failed, fetch finance pdf, finance chassis fallback]
capabilities: [invoice-pdf-download]
domains: [billing, email-notification]
entities: [FinanceChasisApiWebClient, InvoiceDetailsPost, DownloadInvoiceResponse]
peer_systems: [finance-chassis]
direction: outbound
protocol: rest
topic_or_endpoint: ${FINANCE_HOST}/erp/finance/idd694/export-documents
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/FinanceChasisApiWebClient.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/service/FinanceIamTokenCachingService.java]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [runtime/invoice-dispatch-flow.md, operations/retries.md]
---
# Finance Chassis

| Aspect | Behavior |
|---|---|
| When used | Invoice dispatch selects Finance Chassis only when `document.storage.isS4HanaEnabled` is false. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:87) |
| Endpoint | The client posts to `spring.application.finance-chassis.resource`, configured as `/erp/finance/idd694/export-documents`. (source: service/src/main/resources/application.yml:80) |
| Headers | Auth is `Bearer <finance token>` plus finance consumer key, source application, and API version headers. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/FinanceChasisApiWebClient.java:90) |
| Token cache | Finance IAM tokens are cached with the same TTL-based `Mono.cache(...)` strategy used for Decision Hub. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/service/FinanceIamTokenCachingService.java:27) |
| Failure impact | Client errors bubble into invoice processing, which logs the failure and prevents successful SendGrid dispatch for that invoice group. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/integration/webclient/FinanceChasisApiWebClient.java:82) |
