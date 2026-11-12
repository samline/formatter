---
locale: en
sidebar:
  group: reference
  order: 4
title: 'Entrypoints and module formats'
titleAccent: 'module formats'
description: 'The ESM, CommonJS, vanilla and browser IIFE entrypoints of @samline/formatter and when to choose each one.'
---

Every module entrypoint shares one core — what changes is the bundle shape and what each one adds. Pick the entrypoint that matches your build target, then add `/phone` or `/intl` only when you need them.

| Entrypoint                         | Build shape                        | Use when                                                                                                    |
| ---------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `@samline/formatter`               | ESM + CJS dual package             | Main entry: `format()`, `regex` and the helpers. Use with Vite, Webpack, Rollup, esbuild, Bun, ts-node.     |
| `@samline/formatter/vanilla`       | ESM + CJS dual package             | Same surface as the root, with an explicit `/vanilla` subpath.                                              |
| `@samline/formatter/phone`         | ESM + CJS dual package             | Opt-in phone support: `registerPhone()`, `formatPhone()` and `isPhoneRegistered()`. Adds libphonenumber-js. |
| `@samline/formatter/intl`          | ESM + CJS dual package             | Display helpers on native `Intl`: numbers, currency, percent, dates and relative time. No dependencies.     |
| `@samline/formatter/browser`       | IIFE (`formatter.global.js`)       | HTML, Shopify or WordPress without a bundler. Registers `window.Formatter` without phone support.           |
| `@samline/formatter/browser/phone` | IIFE (`formatter.phone.global.js`) | Same global with phone support already registered.                                                          |

## Root entrypoint — `@samline/formatter`

```ts
import { format, regex } from '@samline/formatter'
import type { FormatOptions, FormatterResult, FormatType } from '@samline/formatter'
```

This is the recommended entry point for bundlers and Node code. It re-exports the core (`format`, `regex`, the type guards, the parametric helpers) and the `FormatterResult` interface. It has no runtime dependency: the numeral, date, time, card and general engine is built in.

## Vanilla entrypoint — `@samline/formatter/vanilla`

```ts
import { format } from '@samline/formatter/vanilla'
```

Identical surface to the root entrypoint. The two are aliases by design — the package publishes both for the following reasons:

- Some bundlers, codemods, and style guides prefer the `/vanilla` convention as a signal that the package does not depend on a UI framework.
- A non-framework library or Node script may want the smallest, most explicit surface area.
- Documentation that should not depend on whatever future framework adapters might be added to the root entrypoint can point at `/vanilla` and stay stable.

Both entrypoints delegate to the same core module — no behavioural or size difference.

## Phone entrypoint — `@samline/formatter/phone`

```ts
import { format } from '@samline/formatter'
import { registerPhone } from '@samline/formatter/phone'

registerPhone() // once, at startup

format('5512345678', 'phone') // => { formatted: '55 1234 5678', raw: '5512345678', type: 'phone' }
```

Phone formatting uses `libphonenumber-js`, which is most of the size of a phone-enabled bundle, so 3.0.0 makes it opt-in. `registerPhone()` enables `format(value, 'phone')` for every entrypoint at once (`.`, `/vanilla`, ESM and CommonJS share one registration). Until it runs, `format(value, 'phone')` throws a `TypeError` that names the fix. Calling it again is harmless.

The subpath also exports `formatPhone(value, country?, delimiter?)`, the lower-level helper, and `isPhoneRegistered()` (also exported from the root).

The phone module uses the default **`min`** metadata of `libphonenumber-js`, which is enough for as-you-type formatting. Measured with `AsYouType` alone, minified: `min` about 143 KB (33 KB gzip), `mobile` about 158 KB (37 KB gzip), `max` about 216 KB (53 KB gzip). The larger sets add precise validation and number-type detection, which `format()` does not use.

## Intl entrypoint — `@samline/formatter/intl`

```ts
import { formatCurrency, formatDate, formatRelativeTime } from '@samline/formatter/intl'

formatCurrency(1234.5, { locale: 'es-MX', currency: 'MXN' }) // '$1,234.50'
formatDate('2026-11-12', { locale: 'es-MX', preset: 'long' }) // '12 de noviembre de 2026'
```

Display helpers for values you already store, built on `Intl` with no dependencies. See the [Intl display reference](../intl/).

## Browser entrypoints — `@samline/formatter/browser`

```html
<script src="https://unpkg.com/@samline/formatter@3.0.0/dist/browser/formatter.phone.global.js"></script>
<script>
  const result = window.Formatter.format('5512345678', 'phone')
  console.log(result.formatted) // '55 1234 5678'
  console.log(result.raw) // '5512345678'
</script>
```

Each browser build is a single IIFE that registers a `Formatter` object on `window` (also reachable via `globalThis.Formatter`) with `format`, `intl`, `regex` and `version`. Load `formatter.global.js` when the page formats no phones and `formatter.phone.global.js` when it does. See the [Browser reference](../browser/) for the full surface and every CDN option.

## TypeScript imports

Every public type is re-exported from the root entrypoint:

```ts
import type {
  FormatOptions,
  FormatType,
  FormatterResult,
  DatePatternType,
  NumeralThousandsGroupStyle,
  TimePatternType,
} from '@samline/formatter'
```

Plus the parametric regex types when you build advanced UIs:

```ts
import { regex, type RegexKey, type Regex } from '@samline/formatter'
```

The Intl option types (`IntlNumberOptions`, `IntlCurrencyOptions`, `IntlPercentOptions`, `IntlDateOptions`, `IntlRelativeTimeOptions`) come from `@samline/formatter/intl`. See the [TypeScript reference](../typescript/) for the full type table and the [regex reference](../regex/) for the parametric signatures.

## Module resolution

The `package.json` exposes `import` / `require` conditions on every module entrypoint so the bundler picks the matching shape:

```json
{
  "exports": {
    ".": { "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./vanilla": { "import": "./dist/vanilla/index.js", "require": "./dist/vanilla/index.cjs" },
    "./phone": { "import": "./dist/phone/index.js", "require": "./dist/phone/index.cjs" },
    "./intl": { "import": "./dist/intl/index.js", "require": "./dist/intl/index.cjs" },
    "./browser": { "default": "./dist/browser/formatter.global.js" },
    "./browser/phone": { "default": "./dist/browser/formatter.phone.global.js" }
  }
}
```

If your bundler does not support `exports` (legacy Node 12, custom tooling), the package also publishes the root `main` and `module` fields so unpkg / `npm install` resolutions work transparently.

## Distribution matrix

| Surface                                   | Engine (numeral, date, time, card, general) | `libphonenumber-js` | Size (minified)           |
| ----------------------------------------- | ------------------------------------------- | ------------------- | ------------------------- |
| `@samline/formatter` / `/vanilla`         | built in                                    | no                  | about 19 KB (7 KB gzip)   |
| `@samline/formatter/phone`                | shared with the root                        | bundled             | adds about 143 KB         |
| `@samline/formatter/intl`                 | not needed                                  | no                  | about 4 KB                |
| `formatter.global.js` (IIFE, with `intl`) | built in                                    | no                  | about 25 KB (9 KB gzip)   |
| `formatter.phone.global.js` (IIFE)        | built in                                    | bundled             | about 165 KB (41 KB gzip) |

The core has no runtime dependency; the engine started as a port of `cleave-zen` 0.0.17 (MIT) and is now maintained here. `test:package` enforces the budgets: the root entry under 25 KB minified (10 KB gzip) and the core IIFE under 30 KB.

## Versioning

Every entrypoint ships from the same `package.json`. The published artifact is one version per release, so `format('4111111111111111', 'creditCard')` returns the same shape regardless of whether you import it from the root, the `/vanilla` alias, or a browser IIFE.

When you pin a CDN URL, pin the same version you use in `package.json`. Mismatched `<script>` and `package.json` versions are a common source of "works on my laptop" bugs. See the [Browser reference](../browser/) for the recommended pinning snippets.

## Related

- [Browser reference](../browser/) — full browser surface and CDN matrix.
- [Intl display reference](../intl/) — numbers, currency, dates and relative time.
- [TypeScript reference](../typescript/) — every exported type.
- [Getting started](../../getting-started/) — install, quick start, framework-agnostic promise.
