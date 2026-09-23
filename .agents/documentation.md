# Documentation in-sync rule

`@samline/formatter` has two documentation surfaces:

1. `docs/` — repository and package-facing Markdown.
2. `example/src/content/docs/` — the Starlight site published at `https://samline.github.io/formatter`.

A public behavior change is not complete until both surfaces agree with the built declarations.

## Pre-release checklist

1. Build and inspect `dist/index.d.ts`; treat it as the consumer-visible export contract.
2. Confirm every export from `src/core/index.ts` appears in `docs/api/index.md` and the Starlight API reference.
3. Confirm every `FormatOptions` field appears in `docs/options.md` and Starlight Configuration.
4. Confirm every exported type appears in both TypeScript references.
5. Trace every documented output through the implementation or a test; documentation must describe current behavior, not intended behavior.
6. Keep recipes single-owner: no duplicate listeners and no direct DOM mutation inside framework-controlled fields.
7. Check relative links in `docs/` and `/formatter/...` links in Starlight.
8. Sweep the version through `package.json`, CDN snippets, prose, and browser-global examples.
9. Add a changelog compare link for every release.

## Changelog rules

- Describe consumer-visible behavior separately from documentation corrections.
- When a regression test is materially useful to future maintainers, mention the guard in a separate bullet rather than hiding it inside the behavior fix.
- Do not rewrite an already-pushed release tag to improve prose; record the rule here and apply it to the next release.

## Package-specific distinction

Unlike `@samline/forms`, Formatter does not mutate DOM attributes or ship styling hooks. Its styling guide must say explicitly that the caller owns CSS, accessibility state, caret handling, and the visible/hidden input structure.
