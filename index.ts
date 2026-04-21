import { buildProgram } from './src/cli.ts';

process.on('SIGINT', () => {
  process.stderr.write('\nAborted.\n');
  process.exit(130);
});

buildProgram().parseAsync(process.argv).catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${msg}\n`);
  process.exit(1);
});
