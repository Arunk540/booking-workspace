# Workspace-wide lessons

## vessel-dates | Vessel ETA/ETD is a two-store, source-keyed sync — not a one-way write
status: captured (seeded from Arun's correction on BEPTELIKOS-9397, 2026-07-21)

Vessel ETA (import) / Vessel ETD (export) live in BOTH `booking.references` and
`ServicePlan.serviceDates`, and must stay in sync. The propagation direction
depends on where the value came from:
- From **upstream** (user-entered in the plan, arriving via RFP or editor/amend)
  → the value is in `booking.references` → update `ServicePlan.serviceDates`.
- From **VTS** (vessel schedule response) → update `booking.references`
  (VTS already updates serviceDates; writing the reference was the missing side).
- **Precedence:** a VTS response overrides the user-entered value.

Evidence: `VesselTrackingRegistrationActivityImpl.updateVtsResponse` and
`VesselInformationDomainService.applyVesselDates` write only `serviceDates`;
`booking.references` (`VESSEL_ETA`/`VESSEL_ETD`) is passthrough from the inbound
payload with no VTS write-side. Any "vessel ETA not updating" task must handle
BOTH directions + the precedence, never a single reference upsert.
