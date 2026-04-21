import Table from 'cli-table3';
import type { MonitorApi } from '../api.ts';
import type { MonitorAgentItem } from '../types.ts';
import { c, trendColor } from '../format/color.ts';
import {
  formatCount,
  formatPercent,
  formatRate,
  formatUsd,
  truncate,
} from '../format/number.ts';

export interface AgentOptions {
  json?: boolean;
}

export async function runAgent(api: MonitorApi, agentId: string, opts: AgentOptions): Promise<void> {
  const a = await api.getAgent(agentId);

  if (opts.json) {
    process.stdout.write(JSON.stringify(a, null, 2) + '\n');
    return;
  }

  renderAgentDetail(a);
}

export function renderAgentDetail(a: MonitorAgentItem): void {
  const title = c.bold(a.agent_name ?? a.agent_number ?? a.agent_id);
  const subtitle = [a.agent_id, a.wallet_address].filter(Boolean).join('  ');
  process.stdout.write(`\n${title}\n${c.dim(subtitle)}\n\n`);

  if (a.description) {
    process.stdout.write(truncate(a.description, 300) + '\n\n');
  }

  const volume = Math.abs(a.inbound_volume ?? 0) + Math.abs(a.outbound_volume ?? 0);
  const count = (a.inbound_tx_count ?? 0) + (a.outbound_tx_count ?? 0);
  const trend = a.trend_7d_growth ?? 0;

  const meta = new Table({ style: { head: [], border: [] }, colAligns: ['left', 'left'] });
  meta.push(
    [c.dim('Reputation'), a.reputation ?? '—'],
    [c.dim('Status'), a.status ?? '—'],
    [c.dim('Ranking'), a.ranking != null ? `#${a.ranking}` : '—'],
    [c.dim('Certificates'), (a.certs ?? []).join(', ') || '—'],
    [c.dim('Skills'), (a.skills ?? []).join(', ') || '—'],
    [c.dim('Facilitator'), a.facilitator ?? '—'],
    [c.dim('Last Active'), a.last_active_at ?? '—'],
  );
  process.stdout.write(meta.toString() + '\n\n');

  const perf = new Table({
    head: [c.bold('Stream'), c.bold('Volume'), c.bold('Tx'), c.bold('Repeat Rate')],
    style: { head: [], border: [] },
  });
  perf.push(
    [
      'Received',
      formatUsd(a.inbound_volume),
      formatCount(a.inbound_tx_count),
      formatRate((a.inbound_repeat_rate ?? 0) * 100),
    ],
    [
      'Purchased',
      formatUsd(Math.abs(a.outbound_volume ?? 0)),
      formatCount(a.outbound_tx_count),
      formatRate((a.outbound_repeat_rate ?? 0) * 100),
    ],
    [
      c.bold('Total'),
      c.bold(formatUsd(volume)),
      c.bold(formatCount(count)),
      c.bold(formatRate((a.total_repeat_rate ?? 0) * 100)),
    ],
  );
  process.stdout.write(perf.toString() + '\n\n');

  process.stdout.write(`${c.dim('7d trend:')} ${trendColor(trend)(formatPercent(trend))}\n`);
}
