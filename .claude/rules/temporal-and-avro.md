# Temporal and Avro

- Workflow code must replay: a logic change needs `Workflow.getVersion`, a replay test, and a signal drain before `continueAsNew`.
- Payloads change additively. Activity payloads extend a version-tolerant base: mutate and return the same instance.
- Avro enum → string is a type change only. Never rename a `*Enum` field; downstream reads it by name.
