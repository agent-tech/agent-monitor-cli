import { dispatchSearchQuery, type MonitorApi } from '../api.ts';
import type { MonitorAgentSearchParams } from '../types.ts';
import { c } from '../format/color.ts';
import { renderAgentDetail } from './agent.ts';

export interface SearchOptions {
  json?: boolean;
  wallet?: string;
  number?: string;
  name?: string;
}

function describeQuery(q: MonitorAgentSearchParams): string {
  const parts: string[] = [];
  if (q.wallet) parts.push(`wallet=${q.wallet}`);
  if (q.number) parts.push(`number=${q.number}`);
  if (q.name) parts.push(`name="${q.name}"`);
  return parts.join(' ');
}

export async function runSearch(
  api: MonitorApi,
  query: string | undefined,
  opts: SearchOptions,
): Promise<void> {
  const explicit: MonitorAgentSearchParams = {
    wallet: opts.wallet?.trim() || undefined,
    number: opts.number?.trim() || undefined,
    name: opts.name?.trim() || undefined,
  };
  const hasExplicit = !!(explicit.wallet || explicit.number || explicit.name);

  let dispatched: MonitorAgentSearchParams;
  if (hasExplicit) {
    dispatched = explicit;
  } else if (query?.trim()) {
    dispatched = dispatchSearchQuery(query);
  } else {
    throw new Error(
      'Provide a query (e.g. `quay search 0x…` or `quay search 12345` or `quay search "agent name"`) or use -w / -n / -N.',
    );
  }

  const data = await api.searchAgents(dispatched);

  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  process.stdout.write(c.dim(`Search: ${describeQuery(dispatched)}`) + '\n');

  if (!data.agents.length) {
    process.stdout.write(c.yellow(`No agents found.`) + '\n');
    return;
  }

  process.stdout.write(c.dim(`${data.agents.length} of ${data.total} match(es)`) + '\n');
  for (const agent of data.agents) {
    renderAgentDetail(agent);
  }
}
