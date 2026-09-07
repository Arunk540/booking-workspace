# telikos-booking-service — lessons

## build | `mvn clean` is mandatory — MapStruct breaks without it
status: captured (2026-07-22, BEPTELIKOS-9397)

Any compile/test on this module MUST include `clean`. Without it the build fails
with:
`Internal error in the mapping processor: FilerException: Attempt to recreate a
file for type …MapperImpl` (e.g. `ConfirmApplicationMapperImpl`) — MapStruct's
annotation processor refuses to regenerate over stale generated sources left in
`target/`. The pinned commands (`_pins.yml`) now carry `clean`; keep it there.
Scope a fast run with `-Dtest=<Class>` but never drop `clean`.
