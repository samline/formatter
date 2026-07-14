---
title: Configuration
description: Every option accepted by format(), with defaults and per-formatType behavior.
sidebar:
  order: 2
---

`format(value, formatType, options?)` accepts an `options` object whose shape depends on `formatType`. All fields are optional; sensible defaults cover the common case (space-delimited MX phones, slash-delimited dates, etc.).

```ts title="types.d.ts"
import type { FormatOptions, FormatType } from '@samline/formatter'

function format(
  value: unknown,
  formatType: FormatType,
  options?: FormatOptions
): FormatterResult
```

Internally `FormatOptions` is the intersection of [`cleave-zen`](https://github.com/FirstWhack/cleave-zen)'s per-type option interfaces plus a few package-specific extras (`country`, `dateRawPattern`, `timeRawPattern`, `prefixMode`, `rawPrefix`, `suffix`, `suffixMode`, `rawSuffix`, `tailPrefix`). Only the fields relevant to your `formatType` are read; everything else is ignored.

## Common fields

These apply to most format types.

| Field | Type | Default | Applies to | Notes |
| --- | --- | --- | --- | --- |
| `country` | `string` (ISO 3166-1 alpha-2) | `'MX'` for phone, `''` otherwise | `phone` | Passed to `libphonenumber-js`'s `AsYouType`. |
| `delimiter` | `string` | phone: `' '`; others: `cleave-zen` default | all | Single-character separator for the formatted display. |
| `delimiters` | `string[]` | `[]` | `general`, `numeral` | Additional separators (e.g. `[' ', '-']`). |
| `prefix` | `string` | `''` | `general`, `numeral` | Prepended to the display. See [Prefix & suffix on `general`](#prefix--suffix-on-general) for how the formatter manages it (including `prefixMode` and `rawPrefix`). |
| `tailPrefix` | `boolean` | `false` | `general`, `numeral` | **Legacy**: when `true` (and `suffix` is not provided), `prefix` is treated as a suffix (stripped from the end). Prefer the new dedicated `suffix` option for new code. |

## `general`

> Type: `'general'`

Block-based masking with custom `delimiter` / `delimiters`. Pair with `blocks` to define group sizes.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `blocks` | `number[]` | `[]` | **Required** for sensible output. Defines block sizes (e.g. `[4, 4, 4, 4]` for credit-card-style groups). |
| `delimiterLazyShow` | `boolean` | `false` | Show delimiters only when the next block has content. |
| `numericOnly` | `boolean` | `false` | Strip non-digit characters. |
| `uppercase` | `boolean` | `false` | Force uppercase. |
| `lowercase` | `boolean` | `false` | Force lowercase. |
| `prefixMode` | `'lock' \| 'passthrough'` | `'lock'` | `'lock'` (default) auto-prepends the configured `prefix`; `'passthrough'` reflects whatever the user has typed of the prefix instead (so `E` sticks for a configured `EASY`). See [Prefix & suffix on `general`](#prefix--suffix-on-general). |
| `rawPrefix` | `boolean` | `false` | When `true`, the `raw` mirror includes the configured `prefix`. Default `false` (digits-only). |
| `suffix` | `string` | `''` | Tail decoration appended at the end of the display (e.g. `' USD'`, `'-END'`). Independent from `prefix`; can differ from it. |
| `suffixMode` | `'lock' \| 'passthrough'` | `'lock'` | `'lock'` (default) auto-appends the configured `suffix`; `'passthrough'` reflects whatever the user has typed of the suffix instead. |
| `rawSuffix` | `boolean` | `false` | When `true`, the `raw` mirror includes the configured `suffix`. Default `false`. |

### Prefix & suffix on `general`

`general` formats can decorate the visible value with a head (`prefix`) and/or a tail (`suffix`). The formatter manages both entirely on its own — it never delegates prefix handling to `cleave-zen` (whose internal `stripPrefix` discards any input that doesn't already start with the configured prefix, freezing the field at the literal prefix).

#### `prefixMode` — how the user interacts with the head decoration

- `'lock'` (default): the user types only the body; the formatter auto-prepends the configured `prefix` on every call. If the input happens to start with the prefix (paste case), the prefix is stripped before processing.
- `'passthrough'`: the user types (or pastes) the prefix themselves. Every keystroke that matches the prefix sticks, so `E`, `EA`, `EAS`, `EASY` all stay in the field until you type past it.

```ts
// Auto-prepend `EASY`, user types only the 9 digits
format('123456789', 'general', { blocks: [13], prefix: 'EASY' })
// => { formatted: 'EASY123456789', raw: '123456789', type: 'general' }

// User types the prefix themselves character by character
format('EASY1', 'general', {
  blocks: [13],
  prefix: 'EASY',
  prefixMode: 'passthrough'
})
// => { formatted: 'EASY1', raw: '1', type: 'general' }
```

#### `suffixMode` — how the user interacts with the tail decoration

Mirror image of `prefixMode`. `'lock'` (default) auto-appends the configured `suffix`; `'passthrough'` lets the user type it character by character.

```ts
format('123456789', 'general', { blocks: [12], suffix: 'USD' })
// => { formatted: '123456789USD', raw: '123456789', type: 'general' }

format('12345US', 'general', {
  blocks: [12],
  suffix: 'USD',
  suffixMode: 'passthrough'
})
// => { formatted: '12345US', raw: '12345', type: 'general' }
```

#### `rawPrefix` / `rawSuffix` — what the `raw` mirror contains

The default `raw` value is the digits-only body the user typed. Opt in with `rawPrefix: true` / `rawSuffix: true` when the backend needs the canonical value with the decoration included:

```ts
// Backend wants the canonical identifier
format('123456789', 'general', {
  blocks: [13],
  prefix: 'EASY',
  rawPrefix: true
})
// => { formatted: 'EASY123456789', raw: 'EASY123456789', type: 'general' }

// Both ends canonical
format('12345', 'general', {
  blocks: [11],
  prefix: 'PRE-',
  suffix: '-END',
  rawPrefix: true,
  rawSuffix: true
})
// => { formatted: 'PRE-12345-END', raw: 'PRE-12345-END', type: 'general' }
```

#### `prefix` + `suffix` combined

The two decorations are independent — different head and tail, different modes, different raw flags:

```ts
format('12345', 'general', {
  blocks: [11],
  prefix: 'PRE-',
  suffix: '-END'
})
// => { formatted: 'PRE-12345-END', raw: '12345', type: 'general' }
```

#### Backwards compatibility: `tailPrefix`

The historical `prefix + tailPrefix: true` shape (where `prefix` was repurposed as a tail decoration) is preserved for existing callers. When both `suffix` and `prefix + tailPrefix: true` are provided, the new `suffix` wins:

```ts
// Legacy shape still works
format('123456789', 'general', { prefix: 'USD', tailPrefix: true })
// => { formatted: '123456789USD', raw: '123456789', type: 'general' }

// `suffix` wins when both are set
format('12345', 'general', {
  prefix: 'X',
  tailPrefix: true,
  suffix: 'OK'
})
// => { formatted: 'X12345OK', raw: '12345', type: 'general' }
```

## `numeral`

> Type: `'numeral'`

Thousand separators with optional decimal scaling.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `numeralDecimalMark` | `string` | `'.'` | Decimal separator. |
| `numeralThousandsGroupStyle` | `'thousand' \| 'lakh' \| 'wan' \| 'none'` | `'thousand'` | Grouping style. |
| `numeralIntegerScale` | `number` | `0` | Max integer digits. |
| `numeralDecimalScale` | `number` | `2` | Max decimal digits. |
| `stripLeadingZeroes` | `boolean` | `false` | Strip leading `0`s. |
| `numeralPositiveOnly` | `boolean` | `false` | Disallow negative numbers. |
| `signBeforePrefix` | `boolean` | `false` | Place the `-` sign before the prefix. |

## `date`

> Type: `'date'`

Raw `Y-m-d` (configurable) → display pattern. The package always parses the input as raw digits, then re-emits them in the display pattern order.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `datePattern` | `DatePatternType` (`['d', 'm', 'Y'] \| …`) | `['d', 'm', 'Y']` | Display pattern. |
| `dateRawPattern` | `DatePatternType` | `['Y', 'm', 'd']` | Pattern used to derive the raw value from the formatted display. |
| `dateRawPatternDelimiter` | `string` | `'-'` | Delimiter used in the raw value. |
| `dateMin` / `dateMax` | `string` | `''` | Optional bounds (`'YYYY-MM-DD'`). |
| `delimiter` | `string` | `'/'` | Display delimiter (use this to switch to `-` or `.`). |

## `time`

> Type: `'time'`

Raw `h:m` (configurable) → display pattern.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `timePattern` | `TimePatternType` (`['h', 'm', 's'] \| …`) | `['h', 'm', 's']` | Display pattern. |
| `timeRawPattern` | `TimePatternType` | `['h', 'm']` | Pattern used to derive the raw value from the formatted display. |
| `timeRawPatternDelimiter` | `string` | `':'` | Delimiter used in the raw value. |
| `timeFormat` | `'12' \| '24'` | `'24'` | 12-hour or 24-hour clock. |
| `delimiter` | `string` | `':'` | Display delimiter. |

## `creditCard`

> Type: `'creditCard'`

Brand-aware grouping. The package detects Visa, Mastercard, Amex, Discover, JCB, Diners, UnionPay, Maestro, Mir, Elo, Hiper, and Hipercard.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `creditCardStrictMode` | `boolean` | `false` | Strict 19-digit padding. |
| `delimiter` | `string` | `' '` | Group separator (set to `'-'` for dashes). |

## `creditCardType`

> Type: `'creditCardType'`

Returns the card brand name as `formatted`. The `raw` is always digits-only.

This type does not consume any extra options — pass the card number and read `result.formatted` to get the brand.

## `phone`

> Type: `'phone'`

Country-aware phone formatting via `libphonenumber-js`. The leading `+` is preserved in `raw` so international numbers keep their prefix.

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `country` | `string` | `'MX'` | ISO 3166-1 alpha-2 country code (e.g. `'US'`, `'GB'`, `'AR'`). |
| `delimiter` | `string` | `' '` | Group separator (set to `'-'` for dashes, `'.'` for dots). |

## Examples

```ts
// US phone with dash delimiter
format('2025551234', 'phone', { country: 'US', delimiter: '-' })
// => { formatted: '202-555-1234', raw: '2025551234', type: 'phone' }

// Numeral with comma decimal mark (European style)
format('1234,5', 'numeral', { numeralDecimalMark: ',' })
// => { formatted: '1.234,5', raw: '1234,5', type: 'numeral' }

// Date with explicit dash delimiter and Y-m-d display
format('20260512', 'date', {
  datePattern: ['Y', 'm', 'd'],
  delimiter: '-'
})
// => { formatted: '2026-05-12', raw: '2026-05-12', type: 'date' }

// Numeral with prefix and tailPrefix (suffix)
format('100', 'numeral', { prefix: '$', tailPrefix: true })
// => { formatted: '100$', raw: '100', type: 'numeral' }

// general with auto-prepended prefix and canonical raw
format('123456789', 'general', {
  blocks: [13],
  prefix: 'EASY',
  rawPrefix: true
})
// => { formatted: 'EASY123456789', raw: 'EASY123456789', type: 'general' }

// general with head + tail decorations (independent)
format('12345', 'general', {
  blocks: [11],
  prefix: 'PRE-',
  suffix: '-END',
  rawPrefix: true,
  rawSuffix: true
})
// => { formatted: 'PRE-12345-END', raw: 'PRE-12345-END', type: 'general' }
```

For the underlying option semantics, see [`cleave-zen`'s docs](https://github.com/FirstWhack/cleave-zen).