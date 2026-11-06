# Formatter

> Lightweight, framework-agnostic input formatter that returns split formatted/raw outputs.

> It formats strings for input fields (phones, numerals, dates, times, credit cards,  generic masked inputs) and returns **two strings** in one call: the display-ready `formatted` value and the backend-ready `raw` value. The function is pure (no DOM, no I/O) so it works in Node, in React, in Vue, in Svelte, in Shopify themes, or anywhere JavaScript runs.

---

## Table of Contents

- [Installation](#installation)
- [CDN / Browser](#cdn--browser)
- [Entrypoints](#entrypoints)
- [Quick Start](#quick-start)
- [Supported format types](#supported-format-types)
- [Documentation](#documentation)
- [License](#license)

---

## Installation

```bash
npm install @samline/formatter
```

```bash
pnpm add @samline/formatter
```

```bash
bun add @samline/formatter
```

Requires Node 20+ when bundling. Runtime target is ES2020.

---

## CDN / Browser

Use the browser build when you do not have a bundler and need to run the package directly in HTML, Shopify, WordPress, or any traditional template.

```html
<script src="https://unpkg.com/@samline/formatter@2.1.0/dist/browser/global.global.js"></script>
```

> The documentation intentionally pins the current release (`2.1.0`) instead of
> `latest`. Choose the exact version you want to ship when copying this URL.

The browser bundle exposes a single global: `window.Formatter`.

```html
<script src="https://unpkg.com/@samline/formatter@2.1.0/dist/browser/global.global.js"></script>
<script>
  const result = window.Formatter.format('5512345678', 'phone')
  console.log(result.formatted) // '55 1234 5678'
  console.log(result.raw)       // '5512345678'
</script>
```

See the [Browser global reference](https://samline.github.io/formatter/docs/reference/browser/) for the full browser surface. The minified script defines `window.Formatter` with `format`, `regex` and `version` (use 2.1.0 or later: earlier releases exposed only `window.Formatter.default`).

---

## Entrypoints

| Entrypoint | When to use |
| --- | --- |
| `@samline/formatter` | Main API for bundlers, ESM, or CJS consumers. |
| `@samline/formatter/vanilla` | Direct re-export of the base utility for non-framework consumers. |
| `@samline/formatter/browser` | Pre-bundled IIFE that registers `window.Formatter` for direct `<script>` usage. |

---

## Quick Start

```ts
import { format } from '@samline/formatter'

// Phone (Mexico by default, space-delimited)
format('5512345678', 'phone')
// => { formatted: '55 1234 5678', raw: '5512345678', type: 'phone' }

// Numeral (thousand separators)
format('1234567', 'numeral')
// => { formatted: '1,234,567', raw: '1234567', type: 'numeral' }

// Date (raw Y-m-d -> display d/m/Y)
format('2026-05-12', 'date')
// => { formatted: '12/05/2026', raw: '2026-05-12', type: 'date' }

// Credit card (grouped by brand, digits-only raw)
format('4111111111111111', 'creditCard')
// => { formatted: '4111 1111 1111 1111', raw: '4111111111111111', type: 'creditCard' }

// Card brand detection
format('4111111111111111', 'creditCardType')
// => { formatted: 'visa', raw: '4111111111111111', type: 'creditCardType' }
```

---

## Supported format types

| `formatType` | What it does | Default output |
| --- | --- | --- |
| `'general'` | Block-based masking with custom delimiter/delimiters | Typed body without delimiters (`rawPrefix`/`rawSuffix` for the canonical value) |
| `'phone'` | Country-aware phone formatting via `libphonenumber-js` | Space-delimited, digits-only raw (preserves leading `+`) |
| `'numeral'` | Thousand separators, optional decimals | `'1,234.56'` style raw |
| `'date'` | Raw `Y-m-d` → display pattern | `'12/05/2026'`, raw `'2026-05-12'` |
| `'time'` | Raw `h:m` → display pattern | `'14:30:00'`, raw `'14:30'` |
| `'creditCard'` | Brand-aware grouping | `'4111 1111 1111 1111'`, digits-only raw |
| `'creditCardType'` | Returns the card brand name | Brand string, digits-only raw from input |

## Documentation

The website includes a landing page, six live examples with copyable files and the complete documentation: **[samline.github.io/formatter](https://samline.github.io/formatter/)**.

| Page | What it covers |
| --- | --- |
| [Getting started](https://samline.github.io/formatter/docs/getting-started/) | Installation, quick start and working starter files. |
| [Examples](https://samline.github.io/formatter/examples/) | Phone, amount, date, time, card and custom-mask fields with HTML / CDN and Package / ESM files. |
| [Framework integrations](https://samline.github.io/formatter/docs/guides/frameworks/) | React, Vue, Svelte, vanilla and server-side patterns. |
| [Styling and UX](https://samline.github.io/formatter/docs/guides/styling-and-ux/) | Accessible markup, CSS states, input attributes and caret behavior. |
| [Recipes](https://samline.github.io/formatter/docs/guides/recipes/) | End-to-end patterns for real forms. |
| [API reference](https://samline.github.io/formatter/docs/reference/api/) | `format()` and the advanced helpers. |
| [Configuration](https://samline.github.io/formatter/docs/reference/configuration/) | Every `FormatOptions` field, with the `general` prefix/suffix deep-dive. |
| [Validation patterns](https://samline.github.io/formatter/docs/reference/regex/) | Static and parametric `regex` entries with paired messages. |
| [Entrypoints](https://samline.github.io/formatter/docs/reference/entrypoints/) · [Browser global](https://samline.github.io/formatter/docs/reference/browser/) · [TypeScript](https://samline.github.io/formatter/docs/reference/typescript/) | Distribution matrix, `window.Formatter` and exported types. |
| [Changelog](https://samline.github.io/formatter/docs/changelog/) | Release notes. |

The website source lives in `landing/`, `docs/` and `shared/`; see [SITE.md](SITE.md) to run or maintain it.

## License

MIT
