# Workspace ground rules (booking-workspace)

- Context comes from `.contmark/` — run `node .contmark/resolve-task.js <root> "<task>"`
  before any repo-wide search. Never scan repos blind; never read `_global_index.json` unfiltered.
- This workspace's repos are the only code you may touch. Integrations with systems
  outside it (SAP-TMS, CAMS, IOM, VTS, Billing, SendGrid, …) are described in
  `.contmark/workspace.yml` `cross_repo_contracts` and `.contmark/diagrams.md` — read those,
  never clone or modify external repos.
- Commits: plain `git commit -m "<msg>"`. Never a Co-Authored-By trailer, an AI/assistant
  name, or a "Generated with …" line. Never `git push --force`, never `--no-verify`.
- Build-output hygiene (token + context safety): NEVER let raw build/test output into the
  conversation — always `<build cmd> > /tmp/build.log 2>&1; tail -5 /tmp/build.log`, and on
  failure `grep -E "ERROR|FAIL|Tests run" /tmp/build.log | tail -20`. Raw Maven logs bloat
  context until it compacts and the agent loses memory of its own work.
- Small changes run SCOPED tests only (`-Dtest=<Class>` / `--tests <Class>`); the full
  suite belongs to CI after the PR. "Tests run: 0" counts as failure, not success.
- Do not push branches, open PRs, or write to Jira unless the current instructions
  explicitly say so.
