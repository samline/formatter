# Documentation in-sync rule

Since 2.1.0 `@samline/formatter` has one maintained documentation surface: the Astro collection in `docs/src/content/docs/`, published with the landing and examples at `https://samline.github.io/formatter` (see SITE.md). The old `docs/*.md` files and the Starlight `example/` app were retired after migration; `content-audit.json` pins them to their last commit. The root README stays the npm-facing guide and links to the site.

A public behavior change is not complete until the collection, the demo scenarios in `shared/i18n/translations/en/demo.ts`, the README and the built declarations agree.

## Pre-release checklist

1. Build and inspect `dist/index.d.ts`; treat it as the consumer-visible export contract.
2. Confirm every export from `src/core/index.ts` appears in `reference/api.mdx` (and `content-audit.json.publicExports`).
3. Confirm every `FormatOptions` field appears in `reference/configuration.md`.
4. Confirm every exported type appears in `reference/typescript.mdx`.
5. Trace every documented output through the implementation or a test; documentation must describe current behavior, not intended behavior.
6. Keep recipes single-owner: no duplicate listeners and no direct DOM mutation inside framework-controlled fields.
7. Run `bun run site:build`; it verifies every link and fragment.
8. Sweep the version through `package.json`, `project.config.json` (version and CDN URL), README, CDN snippets and browser-global examples; `test/docs/cdn-version.test.ts` enforces the pins.
9. Add a changelog compare link for every release.

## Changelog rules

- Describe consumer-visible behavior separately from documentation corrections.
- When a regression test is materially useful to future maintainers, mention the guard in a separate bullet rather than hiding it inside the behavior fix.
- Do not rewrite an already-pushed release tag to improve prose; record the rule here and apply it to the next release.

## Package-specific distinction

Unlike `@samline/forms`, Formatter does not mutate DOM attributes or ship styling hooks. Its styling guide must say explicitly that the caller owns CSS, accessibility state, caret handling, and the visible/hidden input structure.
