---
title: Reference
description: Authoritative documentation for every public symbol in @samline/formatter.
sidebar:
  order: 1
---

This section documents the complete public surface of `@samline/formatter`. Start with the API for method signatures, then use the focused references for configuration, regex, types, entrypoints, and the browser global.

:::note
If you add a new page under `src/content/docs/reference/`, it appears under **Reference** in the sidebar automatically (no edit to `site.config.mjs` required).
:::

## Sections in this reference

- [Configuration](/formatter/reference/configuration/) — every `FormatOptions` field, with defaults and per-`formatType` behavior.
- [API](/formatter/reference/api/) — function-by-function signatures, exported types, advanced helpers, and a side-effects-per-function lookup table.
- [Regex](/formatter/reference/regex/) — bundled validation patterns paired with ready-to-use error messages, with the parametric variants.
- [TypeScript](/formatter/reference/typescript/) — every exported type — `FormatType`, `FormatterResult`, `FormatOptions`, `RegexKey`, `RegexEntry`, `Regex`, the parametric signatures.
- [Entrypoints](/formatter/reference/entrypoints/) — ESM / CJS / browser module / `/vanilla` alias distribution matrix.
- [Browser](/formatter/reference/browser/) — the `window.Formatter` IIFE for no-bundler setups (Shopify, WordPress, classic templates).
- [Recipes](/formatter/reference/recipes/) — task-oriented recipes for common real-world scenarios.