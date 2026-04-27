import Table from 'cli-table3';
import type { MonitorApi } from '../api.ts';
import type {
  MonitorAgentDetailResponse,
  MonitorAgentItem,
  MonitorAgentSearchItem,
} from '../types.ts';
import { c, trendColor } from '../format/color.ts';
import {
  formatCount,
  formatPercent,
  formatRate,
  formatUsd,
  toChangePercent,
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

function normalizeSocialHref(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function repeatFraction(num?: number, den?: number): string {
  if (num == null || den == null || den === 0) return '—';
  return `${num.toLocaleString('en-US')}/${den.toLocaleString('en-US')}`;
}

/** Renders detail view from either GET /agents/:id, a list row, or a search row (subset of fields). */
export function renderAgentDetail(
  a: MonitorAgentDetailResponse | MonitorAgentItem | MonitorAgentSearchItem,
): void {
  const detail = a as MonitorAgentDetailResponse;

  const title = c.bold(a.agent_name ?? a.agent_number ?? a.agent_id ?? '—');
  const ids = [
    a.agent_number ? `#${a.agent_number}` : null,
    a.agent_id,
    a.wallet_address,
  ]
    .filter(Boolean)
    .join('  ');
  process.stdout.write(`\n${title}\n${c.dim(ids)}\n\n`);

  if (a.description) {
    process.stdout.write(truncate(a.description, 300) + '\n\n');
  }

  // Identity & Status
  const meta = new Table({ style: { head: [], border: [] }, colAligns: ['left', 'left'] });
  meta.push(
    [c.dim('Reputation'), a.reputation ?? '—'],
    [c.dim('Status'), a.status ?? '—'],
    [c.dim('Ranking'), a.ranking != null ? `#${a.ranking}${a.claimable ? ` ${c.yellow('(claimable)')}` : ''}` : '—'],
    [c.dim('Certificates'), (a.certs ?? []).join(', ') || '—'],
    [c.dim('Skills'), (a.skills ?? []).join(', ') || '—'],
    [c.dim('Facilitator'), a.facilitator ?? '—'],
    [c.dim('ERC-8004'), detail.ecr8004_address?.trim() || '—'],
    [c.dim('Created'), a.agent_created_at ?? '—'],
    [c.dim('Last Active'), a.last_active_at ?? '—'],
  );
  process.stdout.write(meta.toString() + '\n');

  // Social links
  const socials: string[] = [];
  if (detail.github?.trim()) socials.push(`GitHub: ${normalizeSocialHref(detail.github)}`);
  if (detail.linkedin?.trim()) socials.push(`LinkedIn: ${normalizeSocialHref(detail.linkedin)}`);
  if (detail.x?.trim()) socials.push(`X: ${normalizeSocialHref(detail.x)}`);
  if (socials.length) {
    process.stdout.write('\n' + socials.map((s) => c.dim('• ') + s).join('\n') + '\n');
  }

  // Trust score (only when component scores present)
  if (detail.score_trust != null || detail.score_financial != null) {
    const trust = detail.score_trust ?? 0;
    const financial = detail.score_financial ?? 0;
    const total = Math.round(trust + financial);
    const max = Math.max(100, total);
    process.stdout.write(
      `\n${c.bold('Trust Score:')} ${total}/${max} ` +
        c.dim(
          `(Reputation ${Math.round(trust)} · Trading ${Math.round(financial)})`,
        ) +
        '\n',
    );
  }

  // Performance
  const inVol = a.inbound_volume ?? 0;
  const outVol = Math.abs(a.outbound_volume ?? 0);
  const totalVol = Math.abs(a.inbound_volume ?? 0) + Math.abs(a.outbound_volume ?? 0);
  const inCnt = a.inbound_tx_count ?? 0;
  const outCnt = a.outbound_tx_count ?? 0;
  const totalCnt = inCnt + outCnt;

  const perf = new Table({
    head: [
      c.bold('Stream'),
      c.bold('Volume'),
      c.bold('Tx'),
      c.bold('Repeat'),
      c.bold('Repeat #'),
      c.bold('Counterparties'),
      c.bold('PR'),
    ],
    style: { head: [], border: [] },
  });
  perf.push(
    [
      'Received',
      formatUsd(inVol),
      formatCount(inCnt),
      formatRate(toChangePercent(a.inbound_repeat_rate)),
      repeatFraction(a.inbound_repeat_count, a.inbound_total_count),
      detail.inbound_unique_count != null ? formatCount(detail.inbound_unique_count) : '—',
      a.inbound_volume_pr != null ? a.inbound_volume_pr.toFixed(2) : '—',
    ],
    [
      'Purchased',
      formatUsd(outVol),
      formatCount(outCnt),
      formatRate(toChangePercent(a.outbound_repeat_rate)),
      repeatFraction(a.outbound_repeat_count, a.outbound_total_count),
      detail.outbound_unique_count != null ? formatCount(detail.outbound_unique_count) : '—',
      a.outbound_volume_pr != null ? a.outbound_volume_pr.toFixed(2) : '—',
    ],
    [
      c.bold('Total'),
      c.bold(formatUsd(totalVol)),
      c.bold(formatCount(totalCnt)),
      c.bold(formatRate(toChangePercent(a.total_repeat_rate))),
      '—',
      '—',
      a.total_volume_pr != null ? c.bold(a.total_volume_pr.toFixed(2)) : '—',
    ],
  );
  process.stdout.write('\n' + perf.toString() + '\n');

  // Net profit + split
  const netProfit = (a.inbound_volume ?? 0) - (a.outbound_volume ?? 0);
  const grossVol = (a.inbound_volume ?? 0) + (a.outbound_volume ?? 0);
  const recvPct = grossVol > 0 ? Math.round(((a.inbound_volume ?? 0) / grossVol) * 100) : 0;
  const purchPct = grossVol > 0 ? Math.round(((a.outbound_volume ?? 0) / grossVol) * 100) : 0;
  const netColor = netProfit >= 0 ? c.green : c.red;
  process.stdout.write(
    `\n${c.dim('Net Profit:')} ${netColor(formatUsd(netProfit))}` +
      (grossVol > 0
        ? c.dim(`   Split: ${recvPct}% received / ${purchPct}% purchased`)
        : '') +
      '\n',
  );

  // 7d trend
  const trend = toChangePercent(a.trend_7d_growth);
  process.stdout.write(`${c.dim('7d trend:')} ${trendColor(trend)(formatPercent(trend))}\n`);
}
