import Table from 'cli-table3';
import type { MonitorApi } from '../api.ts';
import type {
  MonitorAgentTransactionApiItem,
  TxSortBy,
  TxSortOrder,
} from '../types.ts';
import { c } from '../format/color.ts';
import { shortAddress, truncate } from '../format/number.ts';

export interface TxsOptions {
  page: number;
  limit: number;
  sort: TxSortBy;
  order: TxSortOrder;
  tx?: string;
  json?: boolean;
}

function statusColor(status: string): (s: string) => string {
  const s = status.toLowerCase();
  if (s === 'success') return c.green;
  if (s === 'failed') return c.red;
  if (s === 'pending') return c.yellow;
  return c.gray;
}

function typeColor(type: string): (s: string) => string {
  return type.toLowerCase() === 'received' ? c.green : c.magenta;
}

function shortHash(h: string | undefined): string {
  if (!h) return '—';
  if (h.length <= 14) return h;
  return `${h.slice(0, 8)}…${h.slice(-4)}`;
}

function renderRow(t: MonitorAgentTransactionApiItem): string[] {
  return [
    shortHash(t.tx_hash),
    typeColor(t.type)(t.type || '—'),
    t.amount ?? '—',
    shortAddress(t.counterparty),
    truncate(t.payer_chain, 14),
    t.time ?? '—',
    statusColor(t.status)(t.status || '—'),
  ];
}

export async function runTxs(
  api: MonitorApi,
  agentId: string,
  opts: TxsOptions,
): Promise<void> {
  const data = await api.getAgentTransactions(agentId, {
    page: opts.page,
    page_size: opts.limit,
    sort_by: opts.sort,
    sort_order: opts.order,
    tx_hash: opts.tx,
  });

  // When the user specified an explicit --tx filter and got nothing back, treat
  // empty as a no-match signal (mirrors `quay search`'s grep-style exit). Without
  // a filter, an empty list just means the agent has no txs yet — not a failure.
  // Set this BEFORE any early return so --json mode also picks it up.
  const filtered = !!opts.tx;
  const empty = data.transactions.length === 0;
  if (filtered && empty) process.exitCode = 1;

  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  if (opts.tx) {
    process.stdout.write(c.dim(`Filter: tx_hash=${opts.tx}`) + '\n');
  }

  if (empty) {
    const msg = filtered
      ? `No transactions matching tx_hash=${opts.tx}.`
      : 'No transactions.';
    process.stdout.write(c.yellow(msg) + '\n');
    return;
  }

  const table = new Table({
    head: [
      c.bold('Tx'),
      c.bold('Type'),
      c.bold('Amount'),
      c.bold('Counterparty'),
      c.bold('Chain'),
      c.bold('Time'),
      c.bold('Status'),
    ],
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const t of data.transactions) table.push(renderRow(t));

  process.stdout.write(table.toString() + '\n');

  // `total` from the API can be a heuristic ("there's one more page") rather than
  // a real count, so we don't surface it. Use --page to load more.
  process.stdout.write(
    c.dim(
      `Page ${data.page} (${data.transactions.length} shown) — sorted by ${opts.sort} ${opts.order}.`,
    ) + '\n',
  );
}
