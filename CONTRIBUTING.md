# Contributing

## Development

```bash
bun install
bun run dev -- stats          # run from TS source
bun run build                 # bundle to dist/cli.js (Node target)
node dist/cli.js --help       # run built output
```

## Type-checking

```bash
bunx tsc --noEmit
```

## Publishing

`prepack` and `prepublishOnly` run `bun run build` automatically, so `npm publish` produces a tarball with just `dist/`, `package.json`, `README.md`, and `LICENSE`. All runtime deps are bundled into a single minified file — consumers install one package with no transitive dependencies.

```bash
npm pack --dry-run           # inspect tarball contents
npm publish --access public  # publish scoped package to npm (after bumping version + logging in)
```

### Pre-release checklist

- [ ] Bump `version` in `package.json`
- [ ] Run `bun run build` and confirm `dist/cli.js` is fresh
- [ ] `npm pack --dry-run` — verify tarball excludes `docs/`, `CONTRIBUTING.md`, dev-only files
- [ ] `node dist/cli.js --help` smoke test
- [ ] Update `repository`, `homepage`, `bugs`, `author` in `package.json` if they still point at placeholder URLs
- [ ] `npm publish --access public`
