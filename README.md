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
<script src="https://unpkg.com/@samline/formatter@1.0.0/dist/browser/global.global.js"></script>
```

> Pin the version in production. Replace `1.0.0` with the version you ship.

The browser bundle exposes a single global: `window.Formatter`.

```html
<script src="https://unpkg.com/@samline/formatter@1.0.0/dist/browser/global.global.js"></script>
<script>
  const result = window.Formatter.format('5512345678', 'phone')
  console.log(result.formatted) // '55 1234 5678'
  console.log(result.raw)       // '5512345678'
</script>
```

See [docs/browser.md](docs/browser.md) for the full browser surface.

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
| `'general'` | Block-based masking with custom delimiter/delimiters | Digits-only raw |
| `'phone'` | Country-aware phone formatting via `libphonenumber-js` | Space-delimited, digits-only raw (preserves leading `+`) |
| `'numeral'` | Thousand separators, optional decimals | `'1,234.56'` style raw |
| `'date'` | Raw `Y-m-d` → display pattern | `'12/05/2026'`, raw `'2026-05-12'` |
| `'time'` | Raw `h:m` → display pattern | `'14:30:00'`, raw `'14:30'` |
| `'creditCard'` | Brand-aware grouping | `'4111 1111 1111 1111'`, digits-only raw |
| `'creditCardType'` | Returns the card brand name | Brand string, digits-only raw from input |

For the full options reference and per-type behavior, see:

| Doc | Purpose |
| --- | --- |
| [docs/getting-started.md](docs/getting-started.md) | Concepts, observable contract, and lifecycle overview. |
| [docs/options.md](docs/options.md) | Full `FormatOptions` reference. |
| [docs/typescript.md](docs/typescript.md) | Every exported TypeScript type, with examples. |
| [docs/vanilla.md](docs/vanilla.md) | Vanilla surface for non-framework consumers. |
| [docs/browser.md](docs/browser.md) | Browser global (`window.Formatter`) usage. |

---

## License

MIT