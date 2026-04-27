import Table from 'cli-table3';
import type { MonitorApi } from '../api.ts';
import { c, trendColor } from '../format/color.ts';
import { formatCount, formatPercent, formatUsd, toChangePercent } from '../format/number.ts';

export interface StatsOptions {
  json?: boolean;
}

export async function runStats(api: MonitorApi, opts: StatsOptions): Promise<void> {
  const data = await api.getGlobalStats();

  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  const table = new Table({
    head: [c.bold('Metric'), c.bold('Value'), c.bold('7d Change')],
    style: { head: [], border: [] },
  });

  const rows: Array<[string, string, number]> = [
    ['Total Volume', formatUsd(data.total_volume), toChangePercent(data.volume_7d_change)],
    ['Transactions', formatCount(data.total_transactions), toChangePercent(data.transactions_7d_change)],
    ['Active Agents', formatCount(data.active_agents_count), toChangePercent(data.active_agents_7d_change)],
  ];

  for (const [title, value, change] of rows) {
    table.push([title, value, trendColor(change)(formatPercent(change))]);
  }

  process.stdout.write(table.toString() + '\n');
  if (data.updated_at) {
    process.stdout.write(c.dim(`Updated: ${data.updated_at}`) + '\n');
  }
}
