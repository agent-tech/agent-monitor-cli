import Table from 'cli-table3';
import { normalizeSkills, type MonitorApi } from '../api.ts';
import { SKILLS_MAX_COUNT, type MonitorAgentItem } from '../types.ts';
import { c, trendColor } from '../format/color.ts';
import {
  formatCount,
  formatPercent,
  formatRate,
  formatUsd,
  shortAddress,
  skillHashtag,
  toChangePercent,
  truncate,
} from '../format/number.ts';

export interface AgentsOptions {
  page: number;
  limit: number;
  skill: string[];
  json?: boolean;
}

function totalVolume(a: MonitorAgentItem): number {
  return Math.abs(a.inbound_volume ?? 0) + Math.abs(a.outbound_volume ?? 0);
}

function totalCount(a: MonitorAgentItem): number {
  return (a.inbound_tx_count ?? 0) + (a.outbound_tx_count ?? 0);
}

function rankCell(a: MonitorAgentItem): string {
  const r = a.ranking != null ? `#${a.ranking}` : '—';
  return a.claimable ? `${r} ${c.yellow('★')}` : r;
}

function nameCell(a: MonitorAgentItem): string {
  const name = truncate(a.agent_name ?? a.agent_number, 24);
  if (!a.agent_number || a.agent_name === a.agent_number) return name;
  return `${name}\n${c.dim(`#${a.agent_number}`)}`;
}

export async function runAgents(api: MonitorApi, opts: AgentsOptions): Promise<void> {
  const skills = normalizeSkills(opts.skill);
  if (skills.length > SKILLS_MAX_COUNT) {
    throw new Error(`--skill supports at most ${SKILLS_MAX_COUNT} values (got ${skills.length}).`);
  }
  const data = await api.getAgents(opts.page, opts.limit, skills);

  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  if (skills.length) {
    const chips = skills.map((s) => c.magenta(skillHashtag(s))).join(' ');
    process.stdout.write(`${c.dim('Filters:')} ${chips}\n`);
  }

  const table = new Table({
    head: [
      c.bold('Rank'),
      c.bold('Name'),
      c.bold('Wallet'),
      c.bold('Reputation'),
      c.bold('Volume'),
      c.bold('Tx'),
      c.bold('Repeat'),
      c.bold('7d'),
      c.bold('Skills'),
    ],
    style: { head: [], border: [] },
    wordWrap: true,
  });

  let claimableCount = 0;
  for (const a of data.agents) {
    if (a.claimable) claimableCount += 1;
    const trend = toChangePercent(a.trend_7d_growth);
    const agentSkills = (a.skills ?? []).slice(0, 3).map(skillHashtag).join(' ');
    const extra = (a.skills?.length ?? 0) > 3 ? ` +${(a.skills?.length ?? 0) - 3}` : '';
    table.push([
      rankCell(a),
      nameCell(a),
      shortAddress(a.wallet_address),
      a.reputation ?? '—',
      formatUsd(totalVolume(a)),
      formatCount(totalCount(a)),
      formatRate(toChangePercent(a.total_repeat_rate)),
      trendColor(trend)(formatPercent(trend)),
      truncate((agentSkills + extra) || undefined, 40),
    ]);
  }

  process.stdout.write(table.toString() + '\n');
  const loaded = (data.page - 1) * data.page_size + data.agents.length;
  const claimableNote = claimableCount
    ? c.yellow(` — ${claimableCount} claimable (★)`)
    : '';
  process.stdout.write(
    c.dim(
      `Page ${data.page} (${data.agents.length} shown, ${loaded}/${data.total} total) — use --page to paginate.`,
    ) +
      claimableNote +
      '\n',
  );
}
