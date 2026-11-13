# Formatter website

Landing, Examples and Docs for `@samline/formatter` 3.2.0. The package runtime, exports, Node 20+ requirement, README, license and release history remain the package contract. Website tooling requires Node **22.12+**.

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
- `shared/i18n/translations/en/demo.ts` is the single source for the fifteen scenarios grouped by category (phones, numbers and money, dates and times, payment cards, custom masks and validation): options, samples, choices and paired `regex` rules. `homePresets` selects the six shown on Home. `shared/components/Playground.astro` renders the live preview from it on Home, Examples and Docs; `shared/lib/demo-source.ts` and `demo-files.ts` generate the copied HTML / CDN and Package / ESM files from the same records. Previews import `@samline/formatter`, which both Astro configs alias to this checkout's `src/index.ts`.
- Landing copy lives in `landing/src/i18n/translations/en/`; article prose in `docs/src/content/docs/`; shared UI copy in `shared/i18n/`. Every value quoted in copy was traced through the built package; re-check them when behavior changes.
- `CHANGELOG.md` is the single release history and is loaded as `/docs/changelog/`.
- `content-audit.json` maps the retired Markdown (`docs/*.md`) and Starlight (`example/`) sources, pinned to their last commit, plus every public export, to reviewed destinations. Update it with API changes.
- `site-tools/assemble.mjs` merges the apps and keeps the old Starlight URLs (`/formatter/getting-started/`, `/formatter/reference/*`, `/formatter/guides/*`) as noindex redirects into `/formatter/docs/`.
- Website commands use the `site:` prefix. Runtime `build`, `test`, `test:package`, `typecheck` and `prepublishOnly` keep their roles. The npm `files` allowlist (`dist`, `CHANGELOG.md`) excludes the website; inspect `npm pack --dry-run` before publishing.
- `skills/formatter/SKILL.md` is the single package-integration skill source. `landing/src/pages/skills/formatter/SKILL.md.ts` serves it at `/skills/formatter/SKILL.md`; the Examples closing resources, the shared footer and the README link to it with `download="SKILL.md"`.
- Form selects use `shared/components/Select.astro`; native selects with default styling are not used.

## Verification

```sh
bun run typecheck && bun run test && bun run build && bun run test:package
bun run site:verify
bun run site:check:release
```

`site:verify` covers both Astro diagnostics, the protected visual contract, formatting, tooling tests, alternate base builds, combined link checks and the Playwright suite. The browser suite executes every scenario's copied files in both loading modes (fifteen scenarios × two modes); the unpkg URL is served from the local `dist/` build, so it does not prove CDN availability or npm publication. Framework recipes (React/Vue/Svelte) were migrated and reviewed against the API but are not compiled by this suite.

## Header synchronization — 2026-11-06

Ported the landing Header and Logo adjustment from template `61cc0d8`: GitHub
is icon-only and the version badge hides between 64rem and 75rem. The accessible
GitHub label and Get started action remain available. Home, Examples and Docs
are covered at 1024, 1100, 1200, 1280 and 1440 pixels, including the longest
sibling package name. The regression fails on the previous build at 1024px.

Validation: `site:verify` and `site:check:release` passed, including both Astro
checks, formatting, 12 tooling tests, alternate-base builds, 928 links across
26 pages and all 30 Chromium tests. This is a website change; npm remains 2.1.0.

## 3.0.0 release — 2026-11-12

Phones became opt-in and the browser script was split. `project.config.json`
`delivery.cdnScript` points at `formatter.phone.global.js` because Home and the
installer show phones; `shared/lib/demo-source.ts` `cdnScriptFor()` gives copied
non-phone scenarios the core `formatter.global.js`, and phone ESM files add
`registerPhone()`. `Playground.astro` registers phones in its frontmatter and
client script. Both Astro configs alias `@samline/formatter/phone` to source. The
copied-example e2e test serves each build and asserts only the phone scenario
uses the phone build. Docs gained `reference/intl.md`; Home's recipes link it.

## 3.1.0 release — 2026-11-13

Added the `'text'` and `'slug'` format types and the `case` option, built on the
bundled `@samline/string`. `reference/configuration.md` gained `## text` and
`## slug`, `case` joined the `general` table, and the API / TypeScript type
lists show nine types. CDN pins, `content-audit.json` and the skill moved to
3.1.0.

## 3.2.0 release — 2026-11-13

Added `@samline/formatter/date`, dependency-free date tools on native `Date`
and `Intl` (parse, pattern formatting, calendar text, arithmetic, comparisons,
week rules, IANA time zones, durations), plus the `formatter.date.global.js`
add-on that sets `window.Formatter.date`. Docs gained `reference/date.md`;
entrypoints, browser, API, TypeScript and Intl pages link it. CDN pins,
`content-audit.json` and the skill moved to 3.2.0.

The `regex` catalog was audited in the same release: 21 patterns fixed, nine
new entries and mask-aware `date()`, `time()` and `numeral()` builders.
`reference/regex.md` was rewritten; the Playground rule picker gained CURP and
person name. The root-entry size budget moved from 25 to 27 KB minified (IIFE
30 → 32 KB); gzip stays under 10 KB, and the quoted sizes were re-measured.

## Theme provenance

Adapted from <https://github.com/samline/package-landing-docs.git>, commit `54822b6dc3ad6d81e611490bcf5302b5938aeef9`, embedded following the Drawer layout. Ticker remains the visual reference pinned in `design-reference.json` / `REFERENCE.md`; protected component styles are unchanged. The maintainer-selected lime-green accent is `#4d7c0f` (light, chosen for text contrast on white) and `#a3e635` (dark), recorded in `content-audit.json.themeReview`. The shared logo was allowed to wrap so the longer scoped name fits 320 px at enlarged text.

## Performance

The PageSpeed contract in the template's AGENTS.md applies (95+ mobile, 100 desktop, 100 accessibility/best practices/SEO are goals, not measured results). No Lighthouse baseline has been recorded for this site yet. The live demo bundles the formatter and, because its phone scenario calls `registerPhone()`, libphonenumber metadata into the page script; measure Home before optimizing it further.

## Shared identity convention — 2026-11-06

README roles now match the canonical package template beyond section headings:
manager commands, API/entrypoint and guide tables, resource links and skill
source/download. The importer writes a reviewable README proposal and carries
its scaffold beside site-tools/configure.mjs; it preserves source evidence.

Document, Open Graph and Twitter titles compose an unbranded subject with
` — @samline/formatter` once. Docs index uses Documentation and Examples uses
Examples. Footer credit is explicit site.credit: samline, independent of npm
author metadata. Keep shared/lib/site-identity.mjs and the identity checker/library
in sync with ../package-landing-docs; its .agents/identity.md owns the convention.

Validation: site:verify passed both Astro checks, formatting, 23 tooling tests,
alternate-package builds at / and /tools/widget/, the combined 928-link audit
and all 31 browser tests. site:check:release passed with the new identity gate.
The header regression covers the configured identity and the longest sibling.
These website/documentation changes do not require an npm release.
