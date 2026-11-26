# Booking Workspace

Shared context for the three Telikos booking services, worked on as a set: `telikos-booking-service`,
`telikos-activityplanworkflow-service` and `telikos-email-service`. The service repos are cloned into this folder
and are excluded from this repo.

Start at [`CLAUDE.md`](CLAUDE.md). [`docs/README.md`](docs/README.md) says where each kind of context lives and how it
is kept true.

```bash
node .asta-context/ctx.js find "<task words>"    # ranked repo/path:line from the code on develop
node .asta-context/ctx.js entry booking          # entry points
node .asta-context/ctx.js verify                 # context files vs code
```

## Set up a checkout

```bash
for s in booking:telikos-booking-service ap:telikos-activityplanworkflow-service email:telikos-email-service; do
  ln -sf ../services/${s%%:*}/CLAUDE.md ${s#*:}/CLAUDE.local.md
  grep -qx CLAUDE.local.md ${s#*:}/.git/info/exclude || echo CLAUDE.local.md >> ${s#*:}/.git/info/exclude
done
```
