# agent-monitor-cli

CLI view of the payment-x402 monitor module. Queries the same endpoints the web dashboard uses and renders them as tables.

## Install

```bash
# global install (runs on Node 18+ or Bun 1.0+)
npm i -g agent-monitor-cli
# or
bun i -g agent-monitor-cli

monitor --help
```

One-off without installing:

```bash
npx agent-monitor-cli stats
bunx agent-monitor-cli stats
```

## Commands

The CLI points at `https://api-pay.agent.tech` (hardcoded — no overrides).

```bash
monitor --help                            # show all commands
monitor stats                             # global stats (volume, tx, active agents)
monitor agents                            # list agents (paginated)
monitor agents -p 2 -l 50                 # page 2, 50 per page
monitor agents -s "AI Video Generation"   # filter by a single skill
monitor agents -s AI -s Video             # repeat -s for multi-skill filter (AND)
monitor agents -s "AI,Video,Text"         # or pass comma-separated list
monitor agent <agentId>                   # single agent detail
monitor search <wallet>                   # find agents by wallet address
```

### Skill filter

Matches the web dashboard's hashtag-chip filter. Skills are trimmed, de-duplicated, and sorted alphabetically before being sent as repeated `skills=` query params (e.g. `?skills=AI&skills=Video`). Active filters render as `#hashtag` chips above the table.

Every command supports `--json` for non-interactive / script use:

```bash
monitor stats --json | jq .volume_7d_change
```

## Endpoints Used

| Command  | Endpoint                          |
|----------|-----------------------------------|
| `stats`  | `GET /v1/monitor/global-stats`    |
| `agents` | `GET /v1/monitor/agents`          |
| `agent`  | `GET /v1/monitor/agents/:agentId` |
| `search` | `GET /v1/monitor/agents/search`   |

## Environment

| Variable        | Purpose                     |
|-----------------|-----------------------------|
| `NO_COLOR`      | Disable ANSI color output   |
| `FORCE_COLOR=0` | Disable ANSI color output   |

Color is also auto-disabled when stdout is not a TTY (safe for pipes/CI).

## Development

```bash
bun install
bun run dev -- stats          # run from TS source
bun run build                 # bundle to dist/cli.js (Node target)
node dist/cli.js --help       # run built output
```

## Publishing

`prepack` and `prepublishOnly` run `bun run build` automatically, so `npm publish` produces a tarball with just `dist/`, `package.json`, and `README.md`. All runtime deps are bundled into a single minified file — consumers install one package with no transitive dependencies.

```bash
npm pack --dry-run           # inspect tarball contents
npm publish                   # publish to npm (after bumping version + logging in)
```

Before first publish, update the `name`, `repository`, `homepage`, `bugs`, and `author` fields in `package.json`.
