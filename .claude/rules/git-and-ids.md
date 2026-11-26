# Git, ids and secrets

- Plain commit messages. Never a Co-Authored-By or AI trailer, never a "Generated with" line.
- No push, PR or Jira write unless the task says so. Never push to develop or master; never --force or --no-verify.
- Tests, fixtures and commits use synthetic ids and names, never a real booking or customer.
- Never read or print the values in helm values, vault, `.env` or keystores. Key names only.
