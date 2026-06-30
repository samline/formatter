# Options

`format(value, formatType, options?)` accepts an `options` object whose shape depends on `formatType`. All fields are optional; cleave-zen applies idiomatic defaults (`/` for dates, `:` for times, `,` for numerals, space for phones) when you omit a delimiter.

The full type is exported as `FormatOptions`:

```ts
import type { FormatOptions } from '@samline/formatter'
```

Internally `FormatOptions` is the intersection of cleave-zen's per-type option interfaces plus a few package-specific extras (`country`, `dateRawPattern`, `timeRawPattern`, etc.). Only the fields relevant to your `formatType` are read; everything else is ignored.

## Common fields

| Field | Type | Default | Applies to | Notes |
| --- | --- | --- | --- | --- |
| `country` | `string` (ISO 3166-1 alpha-2) | `'MX'` for phone, `''` otherwise | `phone` | Passed to `libphonenumber-js`'s `AsYouType`. |
| `delimiter` | `string` | phone: `' '`; other types: cleave-zen default | all | Single-character separator for the formatted display. |
| `delimiters` | `string[]` | `[]` | `general`, `numeral` | Additional separators (e.g. `[' ', '-']`). |
| `prefix` | `string` | `''` | `general`, `numeral` | Prepended to the display; stripped before raw computation. |
| `tailPrefix` | `boolean` | `false` | `general`, `numeral` | When `true`, `prefix` is treated as a suffix (stripped from the end). |

## Per-`formatType` fields

### `general`

| Field | Type | Notes |
| --- | --- | --- |
| `blocks` | `number[]` | **Required** for sensible output. Defines block sizes (e.g. `[4, 4, 4, 4]` for credit-card-style groups). |
| `delimiterLazyShow` | `boolean` | Show delimiters only when the next block has content. |
| `numericOnly` | `boolean` | Strip non-digit characters. |
| `uppercase` / `lowercase` | `boolean` | Force case. |

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
| `datePattern` | `DatePatternType` (`['d', 'm', 'Y'] \| …`) | `['d', 'm', 'Y']` | Display pattern (input is always treated as raw `Y-m-d`). |
| `dateRawPattern` | `DatePatternType` | `['Y', 'm', 'd']` | Pattern used by `getRawValue` to derive the raw value from the formatted display. |
| `dateRawPatternDelimiter` | `string` | `'-'` | Delimiter used in the raw value. |
| `dateMin` / `dateMax` | `string` | `''` | Optional bounds (`'YYYY-MM-DD'`). |

### `time`

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `timePattern` | `TimePatternType` (`['h', 'm', 's'] \| …`) | `['h', 'm', 's']` | Display pattern (input is always treated as raw `h:m`). |
| `timeRawPattern` | `TimePatternType` | `['h', 'm']` | Pattern used by `getRawValue` to derive the raw value from the formatted display. |
| `timeRawPatternDelimiter` | `string` | `':'` | Delimiter used in the raw value. |
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
```