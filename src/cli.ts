import { Command, InvalidArgumentError } from 'commander';
import { MonitorApi, ApiError } from './api.ts';
import { cErr } from './format/color.ts';
import { runStats } from './commands/stats.ts';
import { runAgents } from './commands/agents.ts';
import { runAgent } from './commands/agent.ts';
import { runSearch } from './commands/search.ts';
import { runTxs } from './commands/txs.ts';
import { getVersion } from './macros/version.ts' with { type: 'macro' };
import type { TxSortBy, TxSortOrder } from './types.ts';

const API_URL = 'https://api-pay.agent.tech';

function parseInt10(label: string, min: number) {
  return (raw: string): number => {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < min) {
      throw new InvalidArgumentError(`${label} must be an integer >= ${min}`);
    }
    return n;
  };
}

function parseEnum<T extends string>(label: string, allowed: readonly T[]) {
  return (raw: string): T => {
    if (!(allowed as readonly string[]).includes(raw)) {
      throw new InvalidArgumentError(
        `${label} must be one of: ${allowed.join(', ')}`,
      );
    }
    return raw as T;
  };
}

function makeApi(): MonitorApi {
  return new MonitorApi({ baseUrl: API_URL });
}

async function withErrorHandling(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      process.stderr.write(cErr.red(`Error: ${err.message}`) + '\n');
      if (err.url) process.stderr.write(cErr.red(`URL:   ${err.url}`) + '\n');
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      process.stderr.write(cErr.red(`Error: ${msg}`) + '\n');
    }
    process.exit(1);
  }
}

export function buildProgram(): Command {
  const program = new Command();

  program
    .name('quay')
    .description('Quay — terminal client for browsing agent activity (global stats, agents, search, transactions).')
    .version(getVersion());

  program
    .command('stats')
    .description('Show global stats (volume, transactions, active agents).')
    .option('--json', 'Emit raw API response as JSON')
    .action(async (cmdOpts: { json?: boolean }) => {
      await withErrorHandling(() => runStats(makeApi(), cmdOpts));
    });

  const collectSkill = (value: string, previous: string[]): string[] => {
    return [...previous, ...value.split(',').map((s) => s.trim()).filter(Boolean)];
  };

  program
    .command('agents')
    .description('List agents, paginated. Filter by skill hashtag(s).')
    .option('-p, --page <n>', 'Page number (1-indexed)', parseInt10('--page', 1), 1)
    .option('-l, --limit <n>', 'Page size (1-100)', parseInt10('--limit', 1), 20)
    .option(
      '-s, --skill <skill>',
      'Filter by skill; repeat or pass comma-separated list (e.g. -s "AI Video" -s Text-to-Video)',
      collectSkill,
      [] as string[],
    )
    .option('--json', 'Emit raw API response as JSON')
    .action(
      async (cmdOpts: {
        page: number;
        limit: number;
        skill: string[];
        json?: boolean;
      }) => {
        if (cmdOpts.limit > 100) {
          process.stderr.write(cErr.yellow('Note: clamping --limit to 100.') + '\n');
          cmdOpts.limit = 100;
        }
        await withErrorHandling(() => runAgents(makeApi(), cmdOpts));
      },
    );

  program
    .command('agent <agentId>')
    .description('Show detail for a single agent (full profile, trust score, performance, social links).')
    .option('--json', 'Emit raw API response as JSON')
    .action(async (agentId: string, cmdOpts: { json?: boolean }) => {
      await withErrorHandling(() => runAgent(makeApi(), agentId, cmdOpts));
    });

  program
    .command('search [query]')
    .description(
      'Search agents by exactly one of: wallet / number / name / skill. Auto-detects 0x… wallet, all-digits number, or free-text name. Use -w / -n / -N / -s to be explicit.',
    )
    .option('-w, --wallet <addr>', 'Search by wallet address')
    .option('-n, --number <id>', 'Search by agent number')
    .option('-N, --name <name>', 'Search by agent name (min 2 chars)')
    .option(
      '-s, --skill <skill>',
      'Search by skill (max 3, repeat or comma-separated)',
      collectSkill,
      [] as string[],
    )
    .option('--json', 'Emit raw API response as JSON')
    .action(
      async (
        query: string | undefined,
        cmdOpts: {
          wallet?: string;
          number?: string;
          name?: string;
          skill: string[];
          json?: boolean;
        },
      ) => {
        await withErrorHandling(() => runSearch(makeApi(), query, cmdOpts));
      },
    );

  program
    .command('txs <agentId>')
    .description('List an agent\'s transactions (paginated, sortable, filter by tx hash).')
    .option('-p, --page <n>', 'Page number (1-indexed)', parseInt10('--page', 1), 1)
    .option('-l, --limit <n>', 'Page size (1-100)', parseInt10('--limit', 1), 20)
    .option(
      '--sort <field>',
      'Sort by field (time | amount)',
      parseEnum<TxSortBy>('--sort', ['time', 'amount'] as const),
      'time' as TxSortBy,
    )
    .option(
      '--order <dir>',
      'Sort order (asc | desc)',
      parseEnum<TxSortOrder>('--order', ['asc', 'desc'] as const),
      'desc' as TxSortOrder,
    )
    .option('--tx <hash>', 'Filter to a specific transaction hash')
    .option('--json', 'Emit raw API response as JSON')
    .action(
      async (
        agentId: string,
        cmdOpts: {
          page: number;
          limit: number;
          sort: TxSortBy;
          order: TxSortOrder;
          tx?: string;
          json?: boolean;
        },
      ) => {
        if (cmdOpts.limit > 100) {
          process.stderr.write(cErr.yellow('Note: clamping --limit to 100.') + '\n');
          cmdOpts.limit = 100;
        }
        await withErrorHandling(() => runTxs(makeApi(), agentId, cmdOpts));
      },
    );

  return program;
}
