import { dispatchSearchQuery, normalizeSkills, type MonitorApi } from '../api.ts';
import {
  SEARCH_NAME_MIN_LENGTH,
  SKILLS_MAX_COUNT,
  type MonitorAgentSearchParams,
} from '../types.ts';
import { c } from '../format/color.ts';
import { skillHashtag } from '../format/number.ts';
import { renderAgentDetail } from './agent.ts';

export interface SearchOptions {
  json?: boolean;
  wallet?: string;
  number?: string;
  name?: string;
  skill?: string[];
}

function describeQuery(q: MonitorAgentSearchParams): string {
  if (q.wallet) return `wallet=${q.wallet}`;
  if (q.number) return `number=${q.number}`;
  if (q.name) return `name="${q.name}"`;
  if (q.skills?.length) return `skills=${q.skills.map(skillHashtag).join(' ')}`;
  return '(none)';
}

/**
 * Server requires exactly ONE of {wallet, number, name, skills} per request.
 * `paramCount > 1` returns 400; we surface that client-side for a better UX.
 */
function pickOne(query: MonitorAgentSearchParams): MonitorAgentSearchParams {
  const active = (
    [
      query.wallet ? 'wallet' : null,
      query.number ? 'number' : null,
      query.name ? 'name' : null,
      query.skills?.length ? 'skill' : null,
    ] as const
  ).filter(Boolean) as string[];

  if (active.length === 0) {
    throw new Error(
      'Provide a query (e.g. `quay search 0x…` / `quay search 12345` / `quay search "agent name"`) or one of -w / -n / -N / -s.',
    );
  }
  if (active.length > 1) {
    throw new Error(
      `Only one of --wallet / --number / --name / --skill is allowed at a time (got: --${active.join(', --')}).`,
    );
  }
  return query;
}

function validate(query: MonitorAgentSearchParams): void {
  if (query.name !== undefined && query.name.length < SEARCH_NAME_MIN_LENGTH) {
    throw new Error(`--name requires at least ${SEARCH_NAME_MIN_LENGTH} characters.`);
  }
  if (query.skills && query.skills.length > SKILLS_MAX_COUNT) {
    throw new Error(`--skill supports at most ${SKILLS_MAX_COUNT} values (got ${query.skills.length}).`);
  }
}

export async function runSearch(
  api: MonitorApi,
  query: string | undefined,
  opts: SearchOptions,
): Promise<void> {
  const explicitSkills = normalizeSkills(opts.skill ?? []);
  const explicit: MonitorAgentSearchParams = {
    wallet: opts.wallet?.trim() || undefined,
    number: opts.number?.trim() || undefined,
    name: opts.name?.trim() || undefined,
    skills: explicitSkills.length ? explicitSkills : undefined,
  };
  const hasExplicit =
    !!(explicit.wallet || explicit.number || explicit.name || explicit.skills);

  let dispatched: MonitorAgentSearchParams;
  if (hasExplicit) {
    dispatched = explicit;
  } else if (query?.trim()) {
    dispatched = dispatchSearchQuery(query);
  } else {
    dispatched = {};
  }

  pickOne(dispatched);
  validate(dispatched);

  const data = await api.searchAgents(dispatched);
  const empty = data.agents.length === 0;

  if (opts.json) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    if (empty) process.exitCode = 1;
    return;
  }

  process.stdout.write(c.dim(`Search: ${describeQuery(dispatched)}`) + '\n');

  if (empty) {
    process.stdout.write(c.yellow(`No agents found.`) + '\n');
    process.exitCode = 1;
    return;
  }

  process.stdout.write(c.dim(`${data.agents.length} match(es)`) + '\n');
  for (const agent of data.agents) {
    renderAgentDetail(agent);
  }
}
