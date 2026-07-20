---
category: runtime
title: Notification workflow flow
summary: REST notification requests start or signal a Temporal workflow on `${NOTIFICATION_QUEUE}`, which queues requests until `sendEmailNotification` activity invokes SendGrid.
primary_for: [notification-email-workflow]
mentions: [sendgrid-email-delivery, email-delivery-retries, email-runtime-flags]
scenarios: [notification email workflow, notification email failing, why notification email failed, send notification email, which class handles notification]
capabilities: [notification-email]
domains: [email-notification]
entities: [NotificationController, EmailWorkflowImpl, SendEmailNotificationActivityImpl, NotificationRequest]
sources: [service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/EmailWorkflow.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/EmailWorkflowImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/utility/ActivityStub.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java, service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/reportdownloadservice/ReportDownloadService.java]
verified_against: a7d1d87df6fd002a83372328daa5fa8862ca59e4
last_updated: 2026-07-20
related: [contracts/api-contracts.md, integrations/sendgrid.md, operations/flags-and-lists.md]
---
# Notification workflow flow

## Variant Routing
| Trigger condition | Resolver path | Notes |
|---|---|---|
| Temporal client unavailable | controller returns without workflow start | This is how `NOTIFICATION_ENABLED=false` surfaces at runtime. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java:37) |
| First or duplicate booking notification | `signalWithStart` on workflow id `EMAIL_<bookingReferenceId>` | Reuse policy allows duplicate ids. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java:44) |
| Queued signal consumption | `Workflow.await` → queued activity execution | Each signal appends to `activityQueue` before the workflow unblocks. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/EmailWorkflowImpl.java:25) |
| `notificationCategory=REPORT_DOWNLOAD` | subject `Report Status - <file>` + report attached | Report bytes downloaded from the Azure Blob SAS URL on the `DOWNLOAD-EMAIL` action (see below). (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java) |
| `notificationCategory=EMAIL BOOKING` (default) | subject `EMAIL_SUBJECT + bookingReferenceId` | Standard booking notification email body. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/constants/Constants.java) |

## Chain
1. `POST /api/v1/notifications/email` receives `NotificationRequest`, checks `TemporalWorker.getClient()`, and exits early if notifications are disabled. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java:37)
2. Workflow options set `taskQueue=${NOTIFICATION_QUEUE}`, workflow type `EmailWorkflow`, and workflow id `EMAIL_<bookingReferenceId>`, then call `signalWithStart("email_signal", [request], [])`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/api/controller/NotificationController.java:44) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/common/constants/Constants.java:23)
3. `EmailWorkflowImpl.startWorkFlow` waits for a signal, drains `activityQueue`, and executes the untyped activity named `sendEmailNotification`. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/EmailWorkflowImpl.java:26)
4. `signalFromBooking` logs the booking reference, enqueues the request, and flips the await flag so the workflow continues. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/worker/EmailWorkflowImpl.java:37)
5. `ActivityStub.getActivityOptions()` configures Temporal retries with 1-second initial interval, backoff coefficient `2.0`, 2-hour maximum interval, and 2-hour start-to-close timeout. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/utility/ActivityStub.java:25)
6. `SendEmailNotificationActivityImpl.sendEmailNotification` calls `EmailServiceImpl.sendEmailNotification`, which builds a SendGrid mail from `emailRequest.sender`, `emailRequest.recipients`, and the detailed message. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/workflow/src/main/java/net/apmoller/crb/telikos/microservices/workflow/activity/SendEmailNotificationActivityImpl.java:27) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java:128)
7. `prepareNotificationEmail` now branches by `notificationCategory`: it sets the subject/body per category (`getEmailSubjectForNotification` / `getEmailBodyForNotification`) and calls `attachReportIfApplicable`. For `REPORT_DOWNLOAD`, `ReportDownloadService.downloadReport(sasUrl)` pulls the file bytes from the short-lived Azure Blob SAS URL carried on the request's `DOWNLOAD-EMAIL` action and attaches them (default filename `report.xlsx`, Excel content type); a failed download falls back to the `REPORT_DOWNLOAD_FAILED` body instead of blocking the email. (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/emailservice/EmailServiceImpl.java) (source: service/src/main/java/net/apmoller/crb/telikos/microservices/email/domain/reportdownloadservice/ReportDownloadService.java:37)
