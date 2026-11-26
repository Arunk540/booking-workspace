# Build hygiene

- JDK 21. Build output goes to a file: `cmd > /tmp/build.log 2>&1; tail -5 /tmp/build.log`.
  On failure: `grep -E "ERROR|FAIL|Tests run" /tmp/build.log | tail -20`. Never paste raw Maven logs.
- Always `clean`: MapStruct fails on stale generated mappers.
- Small change: scoped tests only (`-Dtest=<Class>`). The full suite runs in CI.
