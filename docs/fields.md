# Fields

Mapping of API fields → CLI display, with the exact formatter used. All formatters live in `src/format/number.ts` and `src/format/color.ts`.

## Formatters at a glance

| Helper | Behavior | Example |
|--------|----------|---------|
| `formatUsd(n)` | Adds `$`, scales to K/M/B at thresholds | `1234567 → "$1.23M"` |
| `formatCount(n)` | Integer, scales to K/M/B above 1e3, locale comma below | `1500 → "1.50K"`, `999 → "999"` |
| `formatPercent(n, 1)` | Signed, fixed digits, `+` prefix when positive | `9.2 → "+9.2%"` |
| `formatRate(n, 2)` | Unsigned, fixed digits | `42.105 → "42.10%"` |
| `toChangePercent(n)` | If `|n| ≤ 1`, multiply by 100; else passthrough | `0.092 → 9.2`, `9.2 → 9.2` |
| `truncate(s, n)` | Suffix `…` if longer than `n` | `"hello world", 8 → "hello w…"` |
| `shortAddress(a)` | First 6 + `…` + last 4 chars | `0x12345678…abcd` |
| `skillHashtag(s)` | Adds leading `#` if missing | `"AI" → "#AI"` |
| `trendColor(v)` | Green if `>0`, red if `<0`, gray if `=0` | applied to `formatPercent(...)` |

### Why `toChangePercent`?

The backend is inconsistent about whether `*_change`, `*_growth`, `*_repeat_rate`, `*_pr`, etc. are returned as decimals (`0.092`) or already-percentages (`9.2`). The CLI applies the web's heuristic: `|x| ≤ 1` ⇒ decimal, multiply by 100. This avoids the trap where `0.092` would otherwise render as `0.1%`.

Fields put through `toChangePercent`:

- `volume_7d_change`, `transactions_7d_change`, `active_agents_7d_change` (stats)
- `trend_7d_growth` (lists & detail)
- `total_repeat_rate`, `inbound_repeat_rate`, `outbound_repeat_rate` (lists & detail)

Not put through it (already absolute scores):

- `score_trust`, `score_financial` — server returns 0–100 absolute components
- `*_volume_pr`, `*_count_pr`, `total_volume_pr`, `total_count_pr` — server returns the actual PR number

---

## `quay stats`

| API field | CLI usage |
|-----------|-----------|
| `total_volume` | `formatUsd` → "Total Volume" row |
| `total_transactions` | `formatCount` → "Transactions" row |
| `active_agents_count` | `formatCount` → "Active Agents" row |
| `volume_7d_change` | `toChangePercent` → `formatPercent` → trend-colored |
| `transactions_7d_change` | same |
| `active_agents_7d_change` | same |
| `updated_at` | Footer `Updated: <iso>` |
| `total_volume_history`, `total_transactions_history`, `active_agents_count_history` | Currently unused (sparkline data); preserved when `--json` |

---

## `quay agents`

| API field | CLI usage |
|-----------|-----------|
| `ranking` | "Rank" column (`#3`) |
| `claimable` | Adds `★` to Rank column; counted in footer |
| `agent_name` | "Name" column (top line) |
| `agent_number` | Shown as `#xxx` under Name when distinct from name |
| `agent_id` | Used by `quay agent` and `quay txs` as ID |
| `wallet_address` | "Wallet" column (shortened) |
| `reputation` | "Reputation" column (passthrough string) |
| `inbound_volume` + `outbound_volume` | Summed `\|in\| + \|out\|` → "Volume" |
| `inbound_tx_count` + `outbound_tx_count` | Summed → "Tx" |
| `total_repeat_rate` | `toChangePercent` → "Repeat" |
| `trend_7d_growth` | `toChangePercent` → "7d" (colored) |
| `skills[]` | First 3 as `#skill`, then `+N` for the remainder |
| `total`, `page`, `page_size` | Pagination footer |
| `status`, `last_active_at`, `description`, `certs`, `agent_created_at`, `*_pr`, `*_repeat_count`, `*_total_count`, `payment_*_percent`, `facilitator`, `trend_history` | Not shown in list view, but visible via `--json` |

---

## `quay agent`

Same shape as a list row plus the detail-only fields below.

### Detail-only fields

| API field | CLI usage |
|-----------|-----------|
| `ecr8004_address` | Identity table → "ERC-8004" row |
| `linkedin`, `github`, `x` | Social link bullets (auto-prefixes `https://`) |
| `score_trust` | "Trust Score" → "Reputation" component |
| `score_financial` | "Trust Score" → "Trading" component |
| `inbound_unique_count` | "Counterparties" column (Received row) |
| `outbound_unique_count` | "Counterparties" column (Purchased row) |
| `inbound_volume_pr`, `outbound_volume_pr` | "PR" column (per-stream row) |
| `total_volume_pr` | "PR" column (Total row) |

### Computed values (in CLI)

| Display | Formula |
|---------|---------|
| Net Profit | `inbound_volume − outbound_volume`, green if ≥0 else red, `formatUsd` |
| Volume split | `received% = round(inbound_volume / (inbound + outbound) × 100)`, same for purchased |
| Trust Score total | `round(score_trust + score_financial)`, `max = max(100, total)` |
| Repeat fraction | `<repeat_count.toLocaleString()>/<total_count.toLocaleString()>` |

---

## `quay search`

Uses the same renderer as `quay agent` per result. Many fields may be absent in search rows — `agent_id`, `status`, `inbound_volume`, `outbound_volume`, `inbound_tx_count`, `outbound_tx_count` are all optional in this view. Missing values render as `—`.

| Top-level field | CLI behavior |
|-----------------|--------------|
| `agents[]` | Iterated in order |
| `total` | Header line: `N of Total match(es)` |
| `size` | Informational; visible only via `--json` |
| `ranking` | Promoted onto the first matched agent before rendering (matches web) |

---

## `quay txs`

| API field | CLI usage |
|-----------|-----------|
| `tx_hash` | "Tx" column, shortened (`0x123456…abcd`) |
| `type` | "Type" column; `Received` (green) / `Purchased` (magenta) — case-insensitive match |
| `amount` | "Amount" column; **string passthrough**, no `$` added (server controls formatting) |
| `counterparty` | "Counterparty" column, shortened address |
| `payer_chain` | "Chain" column, truncated to 14 chars |
| `time` | "Time" column; ISO 8601 passthrough |
| `status` | "Status" column; `Success`/`Failed`/`Pending` mapped case-insensitively (anything else → green like Success in web — CLI keeps raw) |

**Status color map**

| Lowercased status | Color |
|-------------------|-------|
| `success` | green |
| `failed` | red |
| `pending` | yellow |
| anything else | gray |

---

## Reputation

Free-string from API. CLI doesn't enforce or color it (web renders different badge colors per tier; CLI keeps it plain). Known values: `Legendary`, `Elite`, `Pro`, `Builder`, `Starter`.

## Certificates

Pass-through join of `certs[]` with `, `. Web normalizes `KYC` → `KYC Audited`; CLI keeps the raw API value (so the API should send the canonical form).
