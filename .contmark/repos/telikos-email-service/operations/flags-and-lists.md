---
category: operations
title: Flags and lists
summary: Runtime behavior is controlled by document-storage mode, S4Hana invoice source selection, notification-worker enablement, and the configured list of countries that opt into Decision Hub sender resolution.
primary_for: [email-runtime-flags]
mentions: [decision-hub-sender-resolution, invoice-dispatch-email-flow, notification-email-workflow, document-storage-pdf-archive]
scenarios: [email runtime flags, email flag failing, why email flag changed, decision hub country list, notification flag setup]
capabilities: [runtime-flags]
domains: [email-notification, operations]
entities: [application.yml, EmailServiceImpl, TemporalWorker]
sources: [service/src/main/resources/application.yml, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java, helm/dev-values.yml, helm/sit-values.yml, helm/uat-values.yml, helm/qa-values.yml, helm/spt-values.yml]
verified_against: 77e78293d768c1919bf3f7d9dd53a3dd01671252
last_updated: 2026-06-18
related: [integrations/decision-hub.md, runtime/notification-workflow-flow.md, runtime/invoice-dispatch-flow.md]
---
# Flags and lists

| Flag or list | Config shape | Effect |
|---|---|---|
| `DOCUMENT_STORAGE_ENABLED` | Mapped from `document.storage.documentStorageEnabled`; dev, sit, uat, and spt helm values set it to `false`. (source: service/src/main/resources/application.yml:14) (source: helm/dev-values.yml:107) | `TRUE` uploads PDFs, `SavePdf` writes local files, other values skip document archival. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:373) |
| `IS_S4_HANA_ENABLED` | Defaults to `false` in application config; dev sets `true`, spt sets `false`. (source: service/src/main/resources/application.yml:14) (source: helm/dev-values.yml:113) (source: helm/spt-values.yml:143) | `true` routes invoice PDF retrieval to Document Storage billing endpoint; `false` routes to Finance Chassis. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/activityplanevents/ActivityPlanDispatchEventsServiceImpl.java:87) |
| `NOTIFICATION_ENABLED` | Bound to `email.notification.enabled`; qa enables it while sit and uat disable it. (source: service/src/main/resources/application.yml:223) (source: helm/qa-values.yml:55) (source: helm/sit-values.yml:57) (source: helm/uat-values.yml:60) | `TemporalWorker` only registers `notificationWorker` when the flag is true. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/TemporalWorker.java:69) |
| `LIST_OF_DECISION_HUB_EMAIL_CONFIGURED` | Exposed as `spring.application.decision-hub-config-countries`; dev helm supplies `SE`. (source: service/src/main/resources/application.yml:65) (source: helm/dev-values.yml:148) | Only bookings whose country appears in this list use Decision Hub sender resolution. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/DomainDataServiceImpl.java:483) |
