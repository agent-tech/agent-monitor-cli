# Quay CLI — Documentation

Documentation for `@agenttech/quay-cli` (`quay`) — terminal client for browsing agent activity.

| File | Purpose |
|------|---------|
| [`commands.md`](./commands.md) | Every command, every flag, with examples |
| [`fields.md`](./fields.md) | Field-by-field map of what each column / row shows and how it's formatted |
| [`output-format.md`](./output-format.md) | Color rules, environment switches, `--json` contract |

The CLI talks to the agent-monitor service via a hardcoded base URL — there is no override flag and `NODE_ENV` / env vars cannot redirect it.
