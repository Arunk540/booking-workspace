# Task: Add booking reference to invoice dispatch email subject

In telikos-email-service, the invoice dispatch email subject is built in EmailServiceImpl.java (~line 448-457) as {transportActivity} - Reference {orderId}. Add the booking reference so customers can match the invoice to their booking: subject should become {transportActivity} - Reference {orderId} - Booking {bookingId}, using the bookingId already available on activityPlanInvoice in that method. Keep the existing null-safety style. Update the unit tests that assert the subject.
