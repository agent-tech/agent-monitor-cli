import { Command, InvalidArgumentError } from 'commander';
import { MonitorApi, ApiError } from './api.ts';
import { cErr } from './format/color.ts';
import { runStats } from './commands/stats.ts';
import { runAgents } from './commands/agents.ts';
import { runAgent } from './commands/agent.ts';
import { runSearch } from './commands/search.ts';

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
    .name('monitor')
    .description('Agent monitor CLI — inspect payment-x402 agents and global stats.')
    .version('0.1.0');

  program
    .command('stats')
    .description('Show global monitor stats (volume, transactions, active agents).')
    .option('--json', 'Emit raw API response as JSON')
    .action(async (cmdOpts: { json?: boolean }) => {
      await withErrorHandling(() => runStats(makeApi(), cmdOpts));
    });

  program
    .command('agents')
    .description('List agents, paginated.')
    .option('-p, --page <n>', 'Page number (1-indexed)', parseInt10('--page', 1), 1)
    .option('-l, --limit <n>', 'Page size (1-100)', parseInt10('--limit', 1), 20)
    .option('--json', 'Emit raw API response as JSON')
    .action(async (cmdOpts: { page: number; limit: number; json?: boolean }) => {
      if (cmdOpts.limit > 100) {
        process.stderr.write(cErr.yellow('Note: clamping --limit to 100.') + '\n');
        cmdOpts.limit = 100;
      }
      await withErrorHandling(() => runAgents(makeApi(), cmdOpts));
    });

  program
    .command('agent <agentId>')
    .description('Show detail for a single agent.')
    .option('--json', 'Emit raw API response as JSON')
    .action(async (agentId: string, cmdOpts: { json?: boolean }) => {
      await withErrorHandling(() => runAgent(makeApi(), agentId, cmdOpts));
    });

  program
    .command('search <wallet>')
    .description('Search agents by wallet address.')
    .option('--json', 'Emit raw API response as JSON')
    .action(async (wallet: string, cmdOpts: { json?: boolean }) => {
      await withErrorHandling(() => runSearch(makeApi(), wallet, cmdOpts));
    });

  return program;
}
