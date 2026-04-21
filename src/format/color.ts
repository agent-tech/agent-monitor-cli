import pc from 'picocolors';

const noColor = process.env.NO_COLOR !== undefined || process.env.FORCE_COLOR === '0';
const stdoutTty = process.stdout.isTTY === true;
const stderrTty = process.stderr.isTTY === true;

export const useStdoutColor = !noColor && stdoutTty;
export const useStderrColor = !noColor && stderrTty;

type Colorize = (s: string) => string;
const passthrough: Colorize = (s) => s;

function pick(fn: Colorize, enabled: boolean): Colorize {
  return enabled ? fn : passthrough;
}

export const c = {
  bold: pick(pc.bold, useStdoutColor),
  dim: pick(pc.dim, useStdoutColor),
  green: pick(pc.green, useStdoutColor),
  red: pick(pc.red, useStdoutColor),
  yellow: pick(pc.yellow, useStdoutColor),
  cyan: pick(pc.cyan, useStdoutColor),
  magenta: pick(pc.magenta, useStdoutColor),
  gray: pick(pc.gray, useStdoutColor),
};

export const cErr = {
  bold: pick(pc.bold, useStderrColor),
  red: pick(pc.red, useStderrColor),
  yellow: pick(pc.yellow, useStderrColor),
};

export function trendColor(value: number): Colorize {
  if (value > 0) return c.green;
  if (value < 0) return c.red;
  return c.gray;
}
