# @agenttech/quay-cli

`quay` — terminal client for browsing agent activity. Renders global stats, agent listings, single-agent detail, search, and transaction history as colorized tables.

## Install

```bash
# global install (runs on Node 18+ or Bun 1.0+)
npm i -g @agenttech/quay-cli
# or
bun i -g @agenttech/quay-cli

quay --help
```

One-off without installing:

```bash
npx @agenttech/quay-cli stats
bunx @agenttech/quay-cli stats
```

## Commands

```bash
quay --help                            # show all commands
quay stats                             # global stats (volume, tx, active agents)
quay agents                            # list agents (paginated)
quay agents -p 2 -l 50                 # page 2, 50 per page
quay agents -s "AI Video Generation"   # filter by a single skill
quay agents -s AI -s Video             # repeat -s for multi-skill filter (AND)
quay agents -s "AI,Video,Text"         # or pass comma-separated list (max 3)
quay agent <agentId>                   # single agent detail
quay search 0x298D…                    # auto-detects wallet / number / name
quay search 333128597                  # → number
quay search "My First Agent"           # → name (min 2 chars)
quay search -s AI                      # skill-only search (max 3 skills)
quay search -w 0x298…                  # explicit field (only one allowed at a time)
quay txs <agentId>                     # paginated transaction history
quay txs <agentId> --sort amount --order desc
quay txs <agentId> --tx 0x67b95e…       # filter to one tx hash
```

Full reference: [`docs/`](https://github.com/agent-tech/agent-monitor-cli/tree/main/docs) — see [`commands.md`](https://github.com/agent-tech/agent-monitor-cli/blob/main/docs/commands.md), [`fields.md`](https://github.com/agent-tech/agent-monitor-cli/blob/main/docs/fields.md), [`output-format.md`](https://github.com/agent-tech/agent-monitor-cli/blob/main/docs/output-format.md).

### Skill filter

Skills are trimmed, de-duplicated, and sorted alphabetically before filtering. Active filters render as `#hashtag` chips above the table.

Every command supports `--json` for non-interactive / script use. See [`output-format.md`](https://github.com/agent-tech/agent-monitor-cli/blob/main/docs/output-format.md).

## Environment

| Variable        | Purpose                     |
|-----------------|-----------------------------|
| `NO_COLOR`      | Disable ANSI color output   |
| `FORCE_COLOR=0` | Disable ANSI color output   |

Color is also auto-disabled when stdout is not a TTY (safe for pipes/CI).

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | API error, invalid argument, or `search` returned no matches |
| `130` | Interrupted (Ctrl-C) |

`search` exits `1` on empty results so scripts can branch on it (mirrors `grep`). The agent listing endpoint returns a heuristic `total` (≈ `page * page_size + 1`) rather than a real count — the CLI hides it from the table footer; treat the `total` field in `--json` output as "more pages exist" rather than a true count.

## License

MIT — see [`LICENSE`](https://github.com/agent-tech/agent-monitor-cli/blob/main/LICENSE).

Contributors: see [`CONTRIBUTING.md`](https://github.com/agent-tech/agent-monitor-cli/blob/main/CONTRIBUTING.md).
