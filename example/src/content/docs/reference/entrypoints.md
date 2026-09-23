---
title: Entrypoints
description: ESM, CJS, browser module, and global IIFE entrypoints for @samline/formatter.
sidebar:
  order: 6
---

Every public surface exposes the same `format()` and `regex` exports — what changes is the bundle shape and the installation footprint. Pick the entrypoint that matches your build target.

| Entrypoint | Build shape | Use when |
| --- | --- | --- |
| `@samline/formatter` | ESM + CJS dual package | Main entry. Use with Vite, Webpack, Rollup, esbuild, Bun, ts-node. |
| `@samline/formatter/vanilla` | ESM + CJS dual package | Same surface as the root, with an explicit `/vanilla` subpath. |
| `@samline/formatter/browser` | IIFE (`global.global.js`) | Drop into HTML, Shopify themes, WordPress templates, or any setup without a bundler. Registers `window.Formatter`. |

## Root entrypoint — `@samline/formatter`

```ts
import { format, regex } from '@samline/formatter'
import type { FormatOptions, FormatterResult, FormatType } from '@samline/formatter'
```

This is the recommended entry point for bundlers and Node code. It re-exports the core (`format`, `regex`, the type guards, the parametric helpers) and the `FormatterResult` interface.

## Vanilla entrypoint — `@samline/formatter/vanilla`

```ts
import { format } from '@samline/formatter/vanilla'
```

Identical surface to the root entrypoint. The two are aliases by design — the package publishes both for the following reasons:

- Some bundlers, codemods, and style guides prefer the `/vanilla` convention as a signal that the package does not depend on a UI framework.
- A non-framework library or Node script may want the smallest, most explicit surface area.
- Documentation that should not depend on whatever future framework adapters might be added to the root entrypoint can point at `/vanilla` and stay stable.

Both entrypoints delegate to the same core module — no behavioural or size difference.

## Browser entrypoint — `@samline/formatter/browser`

```html
<script src="https://unpkg.com/@samline/formatter@2.0.2/dist/browser/global.global.js"></script>
<script>
  const result = window.Formatter.format('5512345678', 'phone')
  console.log(result.formatted) // '55 1234 5678'
  console.log(result.raw)       // '5512345678'
</script>
```

The browser build is a single IIFE that registers a `Formatter` object on `window` (also reachable via `globalThis.Formatter`). See the [Browser reference](./browser/) for the full surface — `format`, `regex`, `version`, plus every CDN option.

## TypeScript imports

Every public type is re-exported from the root entrypoint:

```ts
import type {
  FormatOptions,
  FormatType,
  FormatterResult,
  DatePatternType,
  TimePatternType
} from '@samline/formatter'
```

Plus the parametric regex types when you build advanced UIs:

```ts
import {
  regex,
  type RegexKey,
  type Regex
} from '@samline/formatter'
```

See the [TypeScript reference](./typescript/) for the full type table and the [regex reference](./regex/) for the parametric signatures.

## Module resolution

The `package.json` exposes `import` / `require` conditions on every entrypoint so the bundler picks the matching shape:

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./vanilla": {
      "import": "./dist/vanilla/index.js",
      "require": "./dist/vanilla/index.cjs"
    },
    "./browser": {
      "default": "./dist/browser/global.global.js"
    }
  }
}
```

If your bundler does not support `exports` (legacy Node 12, custom tooling), the package also publishes the root `main` and `module` fields so unpkg / `npm install` resolutions work transparently.

## Distribution matrix

| Surface | Formatter availability | `cleave-zen` | `libphonenumber-js` |
| --- | --- | --- | --- |
| `@samline/formatter` (ESM / CJS) | Bundled (npm package) | bundled | bundled |
| `@samline/formatter/vanilla` (ESM / CJS) | Bundled (npm package) | bundled | bundled |
| `@samline/formatter/browser` (IIFE) | Bundled (IIFE artifact) | bundled | bundled |

There is no optional peer in formatter; the two third-party libraries (`cleave-zen` and `libphonenumber-js`) are always bundled. The browser IIFE adds roughly 250 KB unminified. If size matters and you have a bundler, prefer the root entrypoint so tree-shaking and code-splitting apply.

## Versioning

Every entrypoint ships from the same `package.json`. The published artifact is one version per release, so `format('5512345678', 'phone')` returns the same shape regardless of whether you import it from the root, the `/vanilla` alias, or the browser IIFE.

When you pin a CDN URL, pin the same version you use in `package.json`. Mismatched `<script>` and `package.json` versions are a common source of "works on my laptop" bugs. See the [Browser reference](./browser/) for the recommended pinning snippets.

## Related

- [Browser reference](./browser/) — full browser surface and CDN matrix.
- [TypeScript reference](./typescript/) — every exported type.
- [Getting started](../getting-started/) — install, quick start, framework-agnostic promise.
