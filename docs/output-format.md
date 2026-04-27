# Output format

## Color

ANSI colors are applied via [`picocolors`](https://github.com/alexeyraspopov/picocolors). Auto-disabled when:

| Condition | Effect |
|-----------|--------|
| `NO_COLOR` env var set (any value) | Both stdout and stderr → no color |
| `FORCE_COLOR=0` env var set | Both stdout and stderr → no color |
| Stdout is not a TTY (pipe, redirect, CI) | Stdout → no color (stderr unaffected) |
| Stderr is not a TTY | Stderr → no color (stdout unaffected) |

Stdout and stderr are evaluated independently, so `quay agents | less -R` keeps colors via the redirect-friendly path while error messages on stderr still color when the terminal supports it.

### Color palette

| Use case | Color |
|----------|-------|
| Positive trend / success / net profit ≥0 | green |
| Negative trend / failed / net profit <0 | red |
| Pending / `claimable` star / clamping warnings | yellow |
| Skill hashtags | magenta |
| Purchased tx type | magenta |
| Headers, IDs, footnotes | dim/gray |
| Bold (table headers, totals) | bold |

`trendColor()` chooses green/red/gray for a numeric percentage value.

## `--json` mode

Every command supports `--json`. When set:

- Output is the raw API response, pretty-printed with 2-space indent, followed by a newline.
- No colors, no tables, no status text.
- All API fields are preserved (including ones the formatted view doesn't render).
- Exit code reflects API outcome (HTTP error → 1).

This is the supported integration surface for scripts. Field names match the API exactly (snake_case).

```bash
quay stats --json | jq .total_volume
quay agents --json -s AI | jq '.agents[].agent_name'
quay txs <agent> --json | jq '.transactions | map(select(.status == "Failed")) | length'
```

## Stderr conventions

| Trigger | Stderr line |
|---------|-------------|
| `--limit > 100` | `Note: clamping --limit to 100.` (yellow) |
| API non-2xx / network / timeout | `Error: <message>` then `URL:   <url>` (red) |
| Bad arg parse | commander's standard error message |
| `Ctrl-C` | `\nAborted.` then exit 130 |

Stdout stays clean for piping; only intended data is written there.

## Tables

Rendered with [`cli-table3`](https://github.com/cli-table/cli-table3) using the project's standard style:

- No border colors, no head colors (we apply `c.bold(...)` to the header strings instead so the bold is preserved when colors are disabled).
- `wordWrap: true` on agent list and tx list (for skills cell + multi-line name cell).
- Single-line otherwise.

## Numbers

| Display | Helper |
|---------|--------|
| `$15.20M` | `formatUsd` (K/M/B thresholds at 1e3/1e6/1e9, two decimals at scale, raw `$1234.56` below 1e3) |
| `1.50K` / `999` | `formatCount` (same K/M/B threshold; below 1e3 uses `toLocaleString('en-US')`) |
| `+9.2%` / `-1.2%` | `formatPercent` (signed, 1 decimal by default) |
| `42.10%` | `formatRate` (unsigned, 2 decimals by default) |
| `0x123456…abcd` | `shortAddress` (first 6 + `…` + last 4) |
| `0x67b95e…cb81` | tx-hash short form (first 8 + `…` + last 4) |
| `2452/24,594` | `repeatFraction` (`toLocaleString('en-US')` both sides) |

## Time

ISO 8601 strings are passed through verbatim. The CLI does not localize, relativize, or reformat. If you need "5m ago" style output, post-process the `--json` output yourself.
