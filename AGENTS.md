# Formatter maintenance contract

This is the single project memory for the runtime and for Home, Examples and Docs. Follow the current user request and preserve unrelated edits. Read [SITE.md](SITE.md) for website architecture, verification and provenance. README.md is the public package guide; CHANGELOG.md is the release source; `skills/formatter/SKILL.md` is the downloadable integration skill. Durable lessons with evidence live in [.agents/lessons.md](.agents/lessons.md); the documentation checklist lives in [.agents/documentation.md](.agents/documentation.md).

## Runtime contract

- `format(value, formatType, options)` is pure and synchronous and returns `{ formatted, raw, type }`. It never touches the DOM; callers own listeners, labels, messages and caret.
- `raw` must be stable when the displayed value is formatted again (`format(format(x).formatted).raw === format(x).raw`). Every listener feeds `formatted` back in on the next keystroke.
- Decorated `general` values (`prefix`/`suffix`): default `raw` is the typed body without the formatter's delimiters; characters hidden by `numericOnly` are kept (historical contract, locked by tests). `rawPrefix`/`rawSuffix` derive the body from `formatted`. Undecorated `general` derives `raw` from `formatted`.
- Phones are opt-in (3.0.0): `registerPhone()` from `src/phone/index.ts` sets the only module state (`src/core/phone-registry.ts`). All module entries build in one tsup config with `splitting` so that registry is shared; `formatter.global.js` has no phones, `formatter.phone.global.js` registers them on load.
- The numeral/date/time/card/general engine is owned code in `src/core/engine/` (ported from cleave-zen 0.0.17, MIT notice in LICENSE.md). Casing goes through `engine/case.ts` `applyCase()` only. `src/intl/` holds the `Intl` display helpers and must stay dependency-free.
- Size budgets (`test/build/bundle.test.ts`): `format` alone under 18 KB minified, every root export under 34 KB (13 KB gzip), core IIFE under 38 KB. The gzip budgets per entry live in `package.json` → `size`.
- The browser entry (`src/browser/global.ts`) exports named members only. A default export would make the IIFE define `window.Formatter.default`.
- `formatValue`, `getValueForFormatting` and `resolveRuntimeOptions` are `@internal`; do not document them as API.
- Every public behavior change updates source, tests, docs collection, demo scenarios, README, CHANGELOG and the skill together, with the version swept through `package.json`, `project.config.json` and CDN URLs (`test/docs/cdn-version.test.ts` enforces pins).

## Verification

```sh
bun run typecheck && bun run test && bun run build && bun run test:package
bun run site:verify
bun run site:check:release
```

`test:package` runs against `dist/`: the IIFE as a classic script, ESM/CommonJS parity and the npm archive. Unit tests of the source cannot catch bundle-wrapper bugs.

## One website

Home, Examples and Docs share one implementation from the package-landing-docs template (embedded like Drawer); directories are build boundaries. Inventory `shared/components` before writing markup and reuse complete controls. Astro 7, Tailwind 4, `class:list`, rem lengths, scoped styles and processed scripts apply everywhere. UI copy and demo data live in typed catalogs; prose lives in the docs collection.

- `shared/i18n/translations/en/demo.ts` is the single scenario catalog (20 scenarios, `homePresets` for Home). `Playground.astro` renders it; `demo-source.ts`/`demo-files.ts` generate the copied HTML / CDN and Package / ESM files from the same records. Never write a second copy of a scenario's options.
- Every value quoted in copy, FAQ, README or the skill must be traced through the built package before publishing.
- Form controls use shared components: `Select.astro` (custom chevron, pointer cursor, hover/focus states). Do not ship a native `<select>` with default styling.
- Titles use explicit translated accents (`titleAccent` must be a trailing part of the title and never the whole title); never derive them from the last word.
- Overview feature icons must depict their own text; never keep the template's default icons.
- Footer, README sections and the skill download follow Ticker/Drawer/Notify exactly: footer links Docs, Installation guide, Working examples / Formatter skill for AI agents, GitHub, Changelog, npm, License (`LICENSE.md`).
- Protected styles are fingerprinted in `design-reference.json`; `site:check:design` fails on drift. Change content and composition, not the reference geometry, unless the user approves a visual change.

## PageSpeed performance contract

Performance is a shared site requirement for Home, Examples and Docs: aim for 95+ mobile performance and 100 desktop, accessibility, best practices and SEO. These are goals, not measured results; record dated measurements in SITE.md. Keep static content and highlighting in generated HTML, local WOFF2 fonts, lazy Pagefind and reserved control geometry before scripts run.

## Agent skills and memory location

Agents, Claude included, store and read project skills and memory in `.agents/`. Skills are created and edited only in `.agents/skills/`. `.claude/skills` is a tracked relative symlink to `../.agents/skills` because Claude Code loads project skills only from `.claude/skills/`; never keep a second copy there. On Windows, clone with `git config core.symlinks true`.

## Identity convention — 2026-11-06

README structure follows the canonical template proposal, including TOC/resource
roles, installation blocks, API/guide tables, entrypoints and skill source/download.
Shared site-identity.mjs composes `<subject> — <npm name>` once for document and
social titles. Footer display credit is explicitly samline, independent of npm
author metadata. Keep the identity check in verify/release/CI, and test the real
configured header name before a substituted sibling. The maintained policy is
https://github.com/samline/package-landing-docs/blob/main/.agents/identity.md;
package-specific API content and runtime publication remain separate.

<!-- samline:family:start -->

## Family conventions (@samline)

This block is synced from the template that owns the family conventions ([package-landing-docs](https://github.com/samline/package-landing-docs) `family/AGENTS.md`, `node family/scripts/sync.mjs`). Do not edit it here; change the template and re-sync. The skill `.agents/skills/samline-package/SKILL.md` carries the full rules for a repository cloned on its own.

- One package per repository. Framework-agnostic core in JS/CSS/HTML; adapters only when idiomatic, as optional peers.
- No DOM access at import time; without a DOM, calls are no-ops. Respect `prefers-reduced-motion`; content stays visible without JavaScript.
- Arrow functions and closures, no classes or `this`. `destroy()` is idempotent and restores markup.
- Zero runtime dependencies: shared primitives (`@samline/internal`, `@samline/is-visible`, `@samline/debounce`) are devDependencies bundled with `noExternal`.
- Install with pnpm, run with Bun: `pnpm install` / `pnpm add -D` (only `pnpm-lock.yaml` is committed), `bun run <script>` for everything else. Never `bun install`, `bun add`, `npm install` or `yarn`.
- Packages talk through npm only: install the published version of any sibling package. Never link or import a local checkout (`bun link`, `link:`, `file:`, path aliases, `../other-package/src`).
- Layout: `src/core`, `src/vanilla`, `src/browser/global.ts` (`window.<PascalName>`, or a plain non-colliding name such as `Strings` when that is a built-in, never a `Samline` prefix; `dist/browser/<name>.global.js`), side-effect-free `src/index.ts`. Every public entry has a gzip budget in `package.json` → `size`.
- `bun run check` must pass: format, typecheck, unit tests with coverage thresholds, build, size budgets, e2e in Chromium, Firefox and WebKit.
- README is the package guide and the site's source of truth; public text in English. Any public API change updates tests, README, docs, examples and `skills/<name>/SKILL.md` together.
- Releases: Keep a Changelog entry for every user-facing change, semver, pinned CDN URLs bumped before release. Publishing is manual (`bun run release` by the maintainer); CI never publishes; no `--provenance`.
- Public repository: no dated reports, handoff notes, transcripts or client names; private notes go in the ignored `.local/`. Site examples with state offer Reset; icons are SVG, never Unicode glyphs.
- Work skills: `npx autoskills -y -a universal`, tracked with `skills-lock.json`, minus the `bun` skill (it contradicts pnpm installs), plus `modern-web-guidance`, consulted before HTML, CSS or client-side JavaScript work.
- Always explore code through the `codebase-memory` skill and graph when `codebase-memory-mcp` is installed; read source for gaps.
- Never add AI attribution to commits, tags or pull requests.

<!-- samline:family:end -->
