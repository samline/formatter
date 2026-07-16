# Options

`format(value, formatType, options?)` accepts an `options` object whose shape depends on `formatType`. All fields are optional; cleave-zen applies idiomatic defaults (`/` for dates, `:` for times, `,` for numerals, space for phones) when you omit a delimiter.

The full type is exported as `FormatOptions`:

```ts
import type { FormatOptions } from '@samline/formatter'
```

Internally `FormatOptions` is the intersection of cleave-zen's per-type option interfaces plus a few package-specific extras (`country`, `dateRawPattern`, `timeRawPattern`, `prefixMode`, `rawPrefix`, `suffix`, `suffixMode`, `rawSuffix`, etc.). Only the fields relevant to your `formatType` are read; everything else is ignored.

## Common fields

| Field | Type | Default | Applies to | Notes |
| --- | --- | --- | --- | --- |
| `country` | `string` (ISO 3166-1 alpha-2) | `'MX'` for phone, `''` otherwise | `phone` | Passed to `libphonenumber-js`'s `AsYouType`. |
| `delimiter` | `string` | phone: `' '`; other types: cleave-zen default | all | Single-character separator for the formatted display. |
| `delimiters` | `string[]` | `[]` | `general`, `numeral` | Additional separators (e.g. `[' ', '-']`). |
| `prefix` | `string` | `''` | `general`, `numeral` | Prepended to the display. See [Prefix & suffix on `general`](#prefix--suffix-on-general) for how the formatter manages it (including `prefixMode` and `rawPrefix`). |
| `tailPrefix` | `boolean` | `false` | `general`, `numeral` | **Legacy**: when `true` (and `suffix` is not provided), `prefix` is treated as a suffix (stripped from the end). Prefer the new dedicated `suffix` option for new code. |

## Per-`formatType` fields

### `general`

| Field | Type | Notes |
| --- | --- | --- |
| `blocks` | `number[]` | **Required** for sensible output. Defines block sizes (e.g. `[4, 4, 4, 4]` for credit-card-style groups). |
| `delimiterLazyShow` | `boolean` | Show delimiters only when the next block has content. |
| `numericOnly` | `boolean` | Strip non-digit characters. |
| `uppercase` / `lowercase` | `boolean` | Force case. |
| `prefixMode` | `'lock' \| 'passthrough'` | `'lock'` (default) auto-prepends the configured `prefix`; `'passthrough'` reflects whatever the user has typed of the prefix instead (so `E` sticks for a configured `EASY`). See [Prefix & suffix on `general`](#prefix--suffix-on-general). |
| `rawPrefix` | `boolean` | When `true`, the `raw` mirror includes the configured `prefix`. Default `false` (digits-only). |
| `suffix` | `string` | Tail decoration appended at the end of the display (e.g. `' USD'`, `'-END'`). Independent from `prefix`; can differ from it. |
| `suffixMode` | `'lock' \| 'passthrough'` | `'lock'` (default) auto-appends the configured `suffix`; `'passthrough'` reflects whatever the user has typed of the suffix instead. |
| `rawSuffix` | `boolean` | When `true`, the `raw` mirror includes the configured `suffix`. Default `false`. |

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

When `rawPrefix` / `rawSuffix` is set, the body part of `raw` is derived from the *formatted* body (with the display delimiter stripped) rather than from the user's typed input verbatim. This means `numericOnly` and the case transforms (`uppercase` / `lowercase`) are honoured in the canonical raw too — a user fat-fingering letters into a `numericOnly: true` field no longer ships a contaminated identifier to the backend.

```ts
// Fat-fingered input — display is clean AND the canonical raw is clean.
format('1a2b3c4d5e6f7g8h9i', 'general', {
  blocks: [4, 5],
  delimiter: ' ',
  prefix: 'EASY',
  prefixMode: 'lock',
  rawPrefix: true,
  numericOnly: true
})
// => { formatted: 'EASY1234 56789', raw: 'EASY123456789', type: 'general' }
```

Callers who keep the historical default (`rawPrefix: false` / `rawSuffix: false`) see no change: `raw` continues to mirror the user's typed input verbatim, including any characters that `numericOnly` would have stripped from the display.

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

### `numeral`

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `numeralDecimalMark` | `string` | `'.'` | Decimal separator. |
| `numeralThousandsGroupStyle` | `'thousand' \| 'lakh' \| 'wan' \| 'none'` | `'thousand'` | Grouping style. |
| `numeralIntegerScale` | `number` | `0` | Max integer digits. |
| `numeralDecimalScale` | `number` | `2` | Max decimal digits. |
| `stripLeadingZeroes` | `boolean` | `false` | Strip leading `0`s. |
| `numeralPositiveOnly` | `boolean` | `false` | Disallow negative numbers. |
| `signBeforePrefix` | `boolean` | `false` | Place the `-` sign before the prefix. |

### `date`

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `datePattern` | `DatePatternType` (`['d', 'm', 'Y'] \| …`) | `['d', 'm', 'Y']` | Display pattern. With the default `interpretInputAs: 'display'`, `format()` treats the input as already in display order — this matches the live-keystroke use case from `@samline/forms` and any other caller that wires `format()` to an `input` event listener. To opt into the legacy raw-input interpretation (useful for `setValue` / `prefill` round-trips where the value is already in raw form, e.g. `setValue('birth_date', '19890915')`), pass `interpretInputAs: 'raw'` and the input will be segmented by `dateRawPattern` and re-emitted in `datePattern` order. |
| `dateRawPattern` | `DatePatternType` | `['Y', 'm', 'd']` | Pattern used by `getRawValue` to derive the raw value from the formatted display. The raw is rearranged into this order and re-emitted with `dateRawPatternDelimiter`. |
| `dateRawPatternDelimiter` | `string` | `'-'` | Delimiter used in the raw value. Falls back to `delimiter` (the display delimiter) when not set, mirroring the 1.1.1 fix for the round-trip self-consistency story. |
| `interpretInputAs` | `'display' \| 'raw'` | `'display'` | How `format()` interprets `'date'` inputs during live-keystroke preprocessing. See the `datePattern` row for context. Defaults to `'display'` because the typical caller is an input event listener that receives the visible field's value (display order) on every keystroke. |
| `dateMin` / `dateMax` | `string` | `''` | Optional bounds (`'YYYY-MM-DD'`). |

### `time`

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `timePattern` | `TimePatternType` (`['h', 'm', 's'] \| …`) | `['h', 'm', 's']` | Display pattern. With the default `interpretInputAs: 'display'`, `format()` treats the input as already in display order — same reasoning as the `datePattern` row above. Pass `interpretInputAs: 'raw'` to opt into the legacy raw-input interpretation. |
| `timeRawPattern` | `TimePatternType` | `['h', 'm']` | Pattern used by `getRawValue` to derive the raw value from the formatted display. |
| `timeRawPatternDelimiter` | `string` | `':'` | Delimiter used in the raw value. Falls back to `delimiter` (the display delimiter) when not set — same as the `dateRawPatternDelimiter` story. |
| `interpretInputAs` | `'display' \| 'raw'` | `'display'` | How `format()` interprets `'time'` inputs during live-keystroke preprocessing. Symmetric with the `date` option. |
| `timeFormat` | `'12' \| '24'` | `'24'` | 12-hour or 24-hour clock. |

### `creditCard`

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `creditCardStrictMode` | `boolean` | `false` | Strict 19-digit padding. |

### `phone`

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `country` | `string` | `'MX'` | ISO 3166-1 alpha-2 country code. |
| `delimiter` | `string` | `' '` | Separator for groups in the formatted display. |

## Examples

```ts
// US phone with dash delimiter
format('2025551234', 'phone', { country: 'US', delimiter: '-' })
// => { formatted: '202-555-1234', raw: '2025551234', type: 'phone' }

// Numeral with comma decimal mark
format('1234,5', 'numeral', { numeralDecimalMark: ',' })
// => { formatted: '1.234,5', raw: '1234,5', type: 'numeral' }

// Date with explicit delimiter
format('20260512', 'date', {
  datePattern: ['Y', 'm', 'd'],
  delimiter: '-'
})
// => { formatted: '2026-05-12', raw: '2026-05-12', type: 'date' }

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