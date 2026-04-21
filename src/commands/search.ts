import type { MonitorApi } from '../api.ts';
import { c } from '../format/color.ts';
import { renderAgentDetail } from './agent.ts';

export interface SearchOptions {
  json?: boolean;
}

export async function runSearch(api: MonitorApi, wallet: string, opts: SearchOptions): Promise<void> {
  const data = await api.searchAgents(wallet);

  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    return;
  }

  if (!data.agents.length) {
    process.stdout.write(c.yellow(`No agents found for wallet ${wallet}`) + '\n');
    return;
  }

  process.stdout.write(c.dim(`${data.agents.length} of ${data.total} match(es)`) + '\n');
  for (const agent of data.agents) {
    renderAgentDetail(agent);
  }
}
