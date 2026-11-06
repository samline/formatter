# Formatter website

Landing, Examples and Docs for `@samline/formatter` 2.1.0. The package runtime, exports, Node 20+ requirement, README, license and release history remain the package contract. Website tooling requires Node **22.12+**.

## Run locally

```sh
bun install --frozen-lockfile
bun run site:dev
```

Open <http://127.0.0.1:4350/formatter/>. Docs runs on 4351 and owns its development module origin; Landing redirects article links there. To exercise search and the production artifact:

```sh
bun run build
bun run site:build
bun run site:preview
```

- Home: <http://127.0.0.1:4350/formatter/>
- Examples: <http://127.0.0.1:4350/formatter/examples/>
- Docs: <http://127.0.0.1:4350/formatter/docs/>

The combined Pages artifact is `landing/dist/` (Pagefind search, sitemaps and redirects included). No backend is required.

## Maintain

- `project.config.json` owns site identity, public URL, accent palette, CDN script and package version. Keep the version aligned with `package.json`; the CDN URL is pinned to the release and only works once that version is published to npm.
- `shared/i18n/translations/en/demo.ts` is the single source for the six scenarios (phone, amount, date, time, card, custom mask): options, samples and paired `regex` rules. `shared/components/Playground.astro` renders the live preview from it on Home, Examples and Docs; `shared/lib/demo-source.ts` and `demo-files.ts` generate the copied HTML / CDN and Package / ESM files from the same records. Previews import `@samline/formatter`, which both Astro configs alias to this checkout's `src/index.ts`.
- Landing copy lives in `landing/src/i18n/translations/en/`; article prose in `docs/src/content/docs/`; shared UI copy in `shared/i18n/`. Every value quoted in copy was traced through the built package; re-check them when behavior changes.
- `CHANGELOG.md` is the single release history and is loaded as `/docs/changelog/`.
- `content-audit.json` maps the retired Markdown (`docs/*.md`) and Starlight (`example/`) sources, pinned to their last commit, plus every public export, to reviewed destinations. Update it with API changes.
- `site-tools/assemble.mjs` merges the apps and keeps the old Starlight URLs (`/formatter/getting-started/`, `/formatter/reference/*`, `/formatter/guides/*`) as noindex redirects into `/formatter/docs/`.
- Website commands use the `site:` prefix. Runtime `build`, `test`, `test:dist`, `typecheck` and `prepublishOnly` keep their roles. The npm `files` allowlist (`dist`, `CHANGELOG.md`) excludes the website; inspect `npm pack --dry-run` before publishing.
- Formatter has no package-integration skill, so the template's skill download links were removed.

## Verification

```sh
bun run typecheck && bun run test && bun run build && bun run test:dist
bun run site:verify
bun run site:check:release
```

`site:verify` covers both Astro diagnostics, the protected visual contract, formatting, tooling tests, alternate base builds, combined link checks and the Playwright suite. The browser suite executes every scenario's copied files in both loading modes; the unpkg URL is served from the local `dist/` build, so it does not prove CDN availability or npm publication. Framework recipes (React/Vue/Svelte) were migrated and reviewed against the API but are not compiled by this suite.

## Theme provenance

Adapted from <https://github.com/samline/package-landing-docs.git>, commit `54822b6dc3ad6d81e611490bcf5302b5938aeef9`, embedded following the Drawer layout. Ticker remains the visual reference pinned in `design-reference.json` / `REFERENCE.md`; protected component styles are unchanged. The maintainer-selected lime-green accent is `#4d7c0f` (light, chosen for text contrast on white) and `#a3e635` (dark), recorded in `content-audit.json.themeReview`. The shared logo was allowed to wrap so the longer scoped name fits 320 px at enlarged text.

## Performance

The PageSpeed contract in the template's AGENTS.md applies (95+ mobile, 100 desktop, 100 accessibility/best practices/SEO are goals, not measured results). No Lighthouse baseline has been recorded for this site yet. The live demo bundles the formatter (including libphonenumber metadata) into the page script; measure Home before optimizing it further.
