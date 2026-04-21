import Table from 'cli-table3';
import type { MonitorApi } from '../api.ts';
import type { MonitorAgentItem } from '../types.ts';
import { c, trendColor } from '../format/color.ts';
import {
  formatCount,
  formatPercent,
  formatRate,
  formatUsd,
  shortAddress,
  truncate,
} from '../format/number.ts';

export interface AgentsOptions {
  page: number;
  limit: number;
  json?: boolean;
}

function totalVolume(a: MonitorAgentItem): number {
  return Math.abs(a.inbound_volume ?? 0) + Math.abs(a.outbound_volume ?? 0);
}

function totalCount(a: MonitorAgentItem): number {
  return (a.inbound_tx_count ?? 0) + (a.outbound_tx_count ?? 0);
}

export async function runAgents(api: MonitorApi, opts: AgentsOptions): Promise<void> {
  const data = await api.getAgents(opts.page, opts.limit);

  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  const table = new Table({
    head: [
      c.bold('#'),
      c.bold('Name'),
      c.bold('Wallet'),
      c.bold('Reputation'),
      c.bold('Volume'),
      c.bold('Tx'),
      c.bold('Repeat'),
      c.bold('7d'),
    ],
    style: { head: [], border: [] },
    wordWrap: true,
  });

  for (const a of data.agents) {
    const trend = a.trend_7d_growth ?? 0;
    table.push([
      String(a.ranking ?? ''),
      truncate(a.agent_name ?? a.agent_number, 24),
      shortAddress(a.wallet_address),
      a.reputation ?? '—',
      formatUsd(totalVolume(a)),
      formatCount(totalCount(a)),
      formatRate((a.total_repeat_rate ?? 0) * 100),
      trendColor(trend)(formatPercent(trend)),
    ]);
  }

  process.stdout.write(table.toString() + '\n');
  const loaded = (data.page - 1) * data.page_size + data.agents.length;
  process.stdout.write(
    c.dim(
      `Page ${data.page} (${data.agents.length} shown, ${loaded}/${data.total} total) — use --page to paginate.`,
    ) + '\n',
  );
}
