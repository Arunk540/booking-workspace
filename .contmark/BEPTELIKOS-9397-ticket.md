# BEPTELIKOS-9397 — For NAM if vessel schedule is received from VTS then Vessel ETA field should be updated with latest value

Env: SIT · Service plan number: MHYYCBMKZTJR

## Description
For NAM if vessel schedule is received from VTS then Vessel ETA field should be updated with latest value.

## Clarified requirements (ticket comments)
- Reporter Ganesh Pathak asked: attach screenshot of VTS response returning the ETA; check why VESSEL_ETA reference is not getting added under booking -> references.
- Dev Arunkumar K asked, confirmed "Yes" to all:
  1. Capture the dates at the moment booking is created; include them in service dates when sending to TMS.
  2. Dates can be overridden by a VTS response — when VTS data arrives, override them.
  3. If an amendment includes a vessel ETA from the user post-VTS response, override again with VTS data.
  4. Error case: if we have NOT obtained the vessel ETA from VTS within the given timeline, send error-read message feedback as a business exception to IOM. Timeout logic = CarloadStart - 1 day for export and portgateout - 1 day for import.
- Confirmed: capture Vessel ETA for Import and Vessel ETD for Export; both estimated times only.
  Ganesh: "Vessel ETA for import, VESSEL ETD, ERD and Port cut off for export."
