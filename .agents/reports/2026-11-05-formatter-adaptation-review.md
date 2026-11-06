# Formatter adaptation review — findings for package-landing-docs

Date: 2026-11-05 · Package: `@samline/formatter` 2.1.0 · Template: package-landing-docs `54822b6` · Branch: `release/2.1.0-site` (commits `25ea56d`, `d5b314c`)

This report records what went wrong while adapting the template to Formatter, what the maintainer had to point out, and what the template should change so the next adaptation does not repeat it. Items marked **[template]** need a change in package-landing-docs (code, checks, skill or docs). Items marked **[process]** are agent-behavior lessons that belong in the adaptation skill. Items marked **[package]** were Formatter-specific and are already fixed.

## 1. What the maintainer had to correct

After a first pass that passed every automated check, the maintainer found nine classes of problems in one review:

1. Titles, copy and SEO were not audited across Home, Examples and Docs.
2. Style defects: native `<select>` with the default arrow jammed against the edge and no `cursor: pointer`; general lack of polish versus Ticker/Drawer/Notify.
3. Sibling conventions were not followed.
4. Examples covered six basic cases instead of the package's real range.
5. No package integration skill was created.
6. Footer and other shared chrome were not coherent with the sibling packages.
7. README did not follow the Ticker/Drawer/Notify structure.
8. FAQ was three generic items.
9. Overview feature icons were the template defaults, unrelated to the text.

**Root cause:** green automated checks (`site:verify`, `check:release`, axe, link checks, design fingerprints) were treated as "done". None of them check content quality, sibling parity, icon relevance, FAQ depth, skill presence or form-control styling. The adaptation skill must make a sibling-parity and content review mandatory before reporting completion.

## 2. Template defects and requested changes

### Components and styles

- **[template] No shared form controls.** The template ships `TextField` (with an always `sr-only` label) but no `Select`, checkbox or visible-label input. Packages fall back to native selects with default appearance (Ticker's `ExamplePreview` and Drawer's `DemoStyles` do too). Add shared `Select.astro` (custom chevron, `appearance: none`, `cursor: pointer`, hover/focus/disabled states, visible label) and a visible-label `Field` input; reference implementation: `formatter/shared/components/Select.astro`. Add an e2e check that every `select` in the built site has `cursor: pointer` and `appearance: none`.
- **[template] Header wraps to two rows around 1024 px** (nav items + theme/GitHub/Get started). Reproduced in Drawer's built site too. Fix the breakpoint in the protected `Header.astro` upstream and propagate to siblings.
- **[template] Logo cannot wrap** long scoped names (`@samline/formatter` overflowed 320 px at 200 % text). Formatter added `min-width: 0; overflow-wrap: anywhere` to `.logo-name` and `min-w-0` to the link. Upstream this.
- **[template] Overview icons are never replaced.** Six default icons survive adaptation silently. Add a check that fails `check:release` when `landing/src/sections/Features.astro` still contains the template's default icon paths, and state in the skill that each icon must depict its card.
- **[template] ExamplesGallery navigation grid is a fixed 4 columns and fingerprint-protected.** Six items leave an orphan row; changing it trips `check:design`. Let the column count derive from item count (or a prop) without drift.

### Copy, titles and SEO

- **[template] `Main.astro` has no SEO title.** Home's `<title>` was just the package name ("Formatter", 9 chars). Drawer had added `hero.seoTitle` locally. Add `seoTitle` to the template's hero catalog and use it as the default title.
- **[template] Examples `<title>` reuses the display heading**, producing "Formatter examples." with a trailing period. Add `examples.seoTitle` / `seoDescription`.
- **[template] Template default strings leak.** "Examples with context", "A working interaction", "Website adaptation skill", generic changelog description "Verified release notes…", three FAQ items, etc. Add a `check:release` scan for a list of template-default strings in built HTML.
- **[template] FAQ depth.** Three generic FAQ items is a placeholder, not content. Drawer has 11. The skill should require answers to the real integration questions (which value to submit, prefill, paste, caret/focus, input types, validation, regions, frameworks/CMS, server, size, errors, upgrades — adapted per package), each verified against source.
- **[template/process] Title accents.** My Starlight migration script derived `titleAccent` from the last word. `PageTitle` only rejects `accent === title`. The skill must say: accents are chosen by hand per page; single-word titles get a meaningful second word ("Configuration options", "TypeScript reference").
- **[template] Meta descriptions.** Migrated pages kept 54–77 character descriptions. Add a build check for missing/short (< 70) or duplicate descriptions and for titles shorter than ~20 characters.

### Skill, footer and README parity

- **[template] Package skill is optional by omission.** ADAPTATION says "omit links if no skill exists", which let me ship without one. Every @samline package has `skills/<name>/SKILL.md`, a `landing/src/pages/skills/<name>/SKILL.md.ts` endpoint, a footer link "<Name> skill for AI agents", an Examples resources link and a README "AI agent skill" section. Make this the default path: scaffold the endpoint and links from `project.config.json`, and fail `check:release` when the skill file is missing or links point to `skills/package-site/`.
- **[template] Footer parity.** The template footer differs from Drawer's (changelog href helper, skill link). Make the template footer identical to the sibling composition: Docs, Installation guide, Working examples / skill, GitHub, Changelog, npm, License → `LICENSE.md`.
- **[template] README structure.** Siblings share: `# @scope/name`, one-sentence tagline, `[Demo] · [Examples] · [Documentation] · [Changelog]`, TOC, Installation (npm/pnpm/bun blocks + Node note), Quick start, HTML / CDN, Capabilities (+ subsection), API at a glance (table + subsections), Documentation (table), Changelog (+ Upgrading), AI agent skill (with curl install), License (`MIT — [LICENSE.md](LICENSE.md)`). Ship a README template/checklist in the package-site skill and a check that compares H2 headings against it.
- **[template] Root conventions checklist for embedded packages.** Formatter differed from siblings in: `LICENSE` vs `LICENSE.md`, no `SITE-LICENSE.md`, `AGENTS.md` git-ignored (siblings commit it as the single project memory; `shared/AGENTS.md` links to `../AGENTS.md`), `test:dist` vs `test:package` (with an `npm pack --json` manifest assertion), missing `packageManager`, no committed skill. Add a `check:siblings` (or skill checklist) that compares root files, script names and README headings with the latest sibling.

### Embedding tooling

- **[template] Root `postinstall` must never be merged into a published package.** The template's root `postinstall: node scripts/assets.mjs` would run in consumers' installs. ADAPTATION should say so explicitly; site commands already run `assets.mjs`.
- **[template] Tests assume template mode.** After `site.template = false`: `site-tests/configure.test.mjs` fails (importer refuses a customized site — needs a starter copy, Drawer patched the same), `config.test.mjs` assumes no CDN, `site.spec.ts` asserts `noindex`, `identity.spec.ts` asserts `your-package`. Parametrize all of these from `project.config.json`.
- **[template] E2E tests hard-code the neutral counter** ("Add one", `output` "1"). Every adaptation rewrites them. Express demo tests against a scenario catalog contract (mount, sample buttons, reset, reinsertion) so they survive adaptation.
- **[template] Copied-code execution with `page.setContent` is wrong** for multiple documents: classic-script `const` declarations collide in the same global ("Identifier 'format' has already been declared"). Navigate to a routed URL per document. Also replace the CDN URL with the local `dist/` build via `page.route` and map the ESM bare import to the same build.
- **[template] `configure.mjs` inventories the template's own files** (`docs/src/...`, `landing/README.md`, `shared/...`) as package evidence when embedded. Exclude site directories.
- **[template] Hard-coded dev ports** 4330/4331 live in `landing/astro.config.mjs`, `docs/src/lib/routes.ts`, `site-tools/dev.mjs` and tests. Make ports part of `project.config.json` so embedded packages don't collide (Drawer 4340, Formatter 4350).
- **[template] No generic Starlight migration tool.** I wrote one: frontmatter mapping, `:::tip[...]` → `Callout`, Starlight `Tabs/TabItem` → shared `Tabs/TabPanel` with dedented content, links resolved relative to the **parent directory** of the source page (Starlight authors wrote file-relative links), fragment checks, and redirect pages for old routes in `assemble.mjs`. Drawer had its own `doc-migration.json`. Provide one reusable script + manifest format.
- **[template] Vite alias + tsconfig paths.** Previews importing the package need both a Vite alias and `compilerOptions.paths` in `landing`, `docs` and `shared` tsconfigs; otherwise `astro check` fails. Document or scaffold it.
- **[template] Same-origin sibling links** (`samline.github.io/forms/...`) fail the link checker as "outside deployment base". Document the `externalPaths` escape or link to the repository.

### Examples and demo architecture

- **[template] Provide a scenario-catalog pattern, not a counter.** What worked for Formatter: one typed catalog (`demo.ts`) with category, title, description, hint, options, field, optional choice select, validation rule and sample values; `Playground` renders preview + readouts + sample buttons from it; `demo-source.ts` generates HTML/CSS/JS for HTML / CDN and Package / ESM; `homePresets` picks Home tabs; e2e executes every scenario's copied files in both modes. Ship this as the template's default demo shape.
- **[process] Example breadth = capability inventory.** Six "one per type" demos hid most options. Inventory every option and helper (for Formatter: currency suffix via `tailPrefix`, regional separators, positive integers, MM/YY, lazy delimiters, passthrough vs lock decorations, `rawPrefix`, case transforms, regex catalog) and map each to a realistic task before choosing scenarios.
- **[template] Docs examples page weight.** Rendering 15 Playgrounds with code (2 modes × 4 files each) on one Docs page is heavy. Pattern: Docs shows previews and explanations; code lives on Examples, linked per scenario with `landingHref('examples/#id')`.
- **[template] Panel chrome duplication.** DemoPanel label repeating the section title plus an eyebrow repeating the section eyebrow looked redundant. Use the tab name as the panel label and show the real API call (`format(value, 'phone', { country })`) inside.

### Theme

- **[template] Accent contrast guidance.** "Lime green" required a dark light-theme accent (`#4d7c0f`) for text contrast and a bright dark-theme accent (`#a3e635`). The skill should compute accessible pairs from a named color and verify primary-button text contrast in both themes.

## 3. Package bugs found (fixed in Formatter 2.1.0) and transferable lessons

- **[package] CDN global broken in every real browser:** a default export plus `globalName` made the IIFE assign `window.Formatter = { default }`. Source-level unit tests passed. **Lesson [template/process]:** every package site must test the built IIFE as a classic script; add this to the adaptation checklist (`test:package`).
- **[package] `raw` changed between keystrokes** for decorated masks (re-formatting `ORD-1234-5678` gave `1234-5678`). **Lesson:** test idempotence `format(format(x).formatted).raw === format(x).raw`.
- **[package] Passthrough prefix + `uppercase` duplicated the prefix** (`save20` → `SAVESAVE20`). Found only while building a realistic example. **Lesson [process]:** building real scenarios is a test activity; probe every quoted output through the built package.
- **[package]** Locked suffix duplicated on Backspace; `regex.numeral` unanchored; `regex.password` rejected valid passwords; builders threw `SyntaxError` on bad ranges; `general` without `blocks` threw an internal error; lowercase country codes ignored.
- **[process] Existing tests can lock bugs.** Two Formatter tests asserted buggy outputs; distinguish deliberate documented contracts (kept) from contradictions with the documented contract (fixed, with changelog notes).

## 4. Process lessons for the adaptation skill

1. Before writing anything, open the latest sibling (Drawer, Ticker, Notify) and list: root files, package.json scripts, README headings, footer links, skill location, AGENTS.md, SITE.md. Match them.
2. Automated checks prove structure, not quality. Before "done": review every page's title/description/H1, FAQ depth, icon relevance, control styling (selects, inputs, buttons: cursor, hover, focus) and compare screenshots with a sibling at 1024, 1440 and 375 px in both themes.
3. Create the package skill as part of the adaptation, not as an optional follow-up.
4. Never copy template placeholder names into final copy; grep built HTML for template strings.
5. Choose title accents by hand.
6. Treat example breadth as coverage of the package's options, verified against the built output.
7. Record dated verification evidence; never claim CDN/npm availability from local tests.

## 5. Reference files in Formatter

- `shared/components/Select.astro` — shared select control.
- `shared/i18n/translations/en/demo.ts`, `shared/lib/demo-source.ts`, `shared/lib/demo-files.ts`, `shared/components/Playground.astro` — scenario catalog pattern.
- `site-e2e/site.spec.ts` — copied-file execution per scenario (routed navigation, local CDN/ESM substitution), select style and skill download checks.
- `site-tools/assemble.mjs` — legacy Starlight redirects.
- `skills/formatter/SKILL.md`, `landing/src/pages/skills/formatter/SKILL.md.ts` — skill and endpoint.
- `README.md`, `AGENTS.md`, `SITE.md`, `content-audit.json` — sibling-aligned docs and evidence.
