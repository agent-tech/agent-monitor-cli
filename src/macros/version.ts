import pkg from '../../package.json' with { type: 'json' };

/**
 * Bun build-time macro: returns the package version inlined as a string literal
 * at bundle time. Single source of truth is `package.json`.
 *
 * Imported with `with { type: 'macro' }` from `src/cli.ts`; Bun replaces the
 * call site with the literal value during `bun build`.
 */
export function getVersion(): string {
  return pkg.version;
}
