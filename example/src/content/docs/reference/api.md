---
title: API reference
description: Function-by-function reference for @samline/formatter.
sidebar:
  order: 3
---

Every public symbol is listed here in the order it appears in the source. Each entry shows the signature, parameter table, return shape, and a runnable example.

:::tip[Reading the signatures]
Functions that return data (rather than calling side-effect-ful APIs) end in a different return type — for example `format()` returns `FormatterResult`, `isFormatType()` returns a type-guard boolean, and `regex.digits(...)` returns `{ pattern, errorMessage }`. The package is pure throughout — see the side-effects table below.
:::

## Side effects per function

Use this as a quick lookup when you need to know what a function will touch.

| Function | DOM mutation | Network | Reads globals | Reads time | Notes |
| --- | --- | --- | --- | --- | --- |
| `format(value, type, options?)` | no | no | no | no | Pure string transformer. Safe to call on every keystroke. |
| `isFormatType(value)` | no | no | no | no | Type-guard. No allocation beyond the comparison. |
| `FORMAT_TYPES` | n/a | n/a | n/a | n/a | A `readonly` tuple; iteration is the only legitimate use. |
| `regex.<key>.pattern` | no | no | no | no | A compiled `RegExp`. `regex.<key>` is also callable for parametric variants. |
| `regex.<key>.errorMessage` | n/a | n/a | n/a | n/a | A short human-readable message paired with the pattern. |
| `formatPhone` | no | no | no | no | Lower-level phone helper called by `format(..., 'phone')`. |
| `getRawValue` | no | no | no | no | Lower-level raw value extractor. |
| `getDateValueFromRaw` | no | no | no | no | Legacy round-trip helper for dates. |
| `getTimeValueFromRaw` | no | no | no | no | Legacy round-trip helper for times. |
| `looksLikeRawDateValue` | no | no | no | no | Heuristic test for the v2.0.0 `auto` mode. |
| `looksLikeRawTimeValue` | no | no | no | no | Heuristic test for the v2.0.0 `auto` mode. |
| `stripPrefixAndSuffix` | no | no | no | no | Strips the configured `prefix` and `suffix` from a string. |

The `format` function and every helper it delegates to are referentially transparent — the same `(value, formatType, options)` triple always returns the same `FormatterResult`. This is what enables SSR re-rendering and testing without mocks.

## `format(value, formatType, options?)`

The main entry point. Pure, deterministic, framework-agnostic.

```ts
function format(
  value: unknown,
  formatType: FormatType,
  options?: FormatOptions
): FormatterResult
```

### Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | yes | The raw value typed by the user. `null`, `undefined`, and `''` return an empty result. |
| `formatType` | [`FormatType`](#formattype) | yes | One of the seven supported format types. Throws `TypeError` if invalid. |
| `options` | [`FormatOptions`](#formatoptions) | no | Per-type options. See [Configuration](/formatter/reference/configuration/). |

### Returns

A [`FormatterResult`](#formatterresult) with the `formatted` display string, the `raw` backend string, and the echoed `type`.

### Examples

```ts
import { format } from '@samline/formatter'

format('5512345678', 'phone')
// => { formatted: '55 1234 5678', raw: '5512345678', type: 'phone' }

format('4111111111111111', 'creditCard')
// => { formatted: '4111 1111 1111 1111', raw: '4111111111111111', type: 'creditCard' }

format('4111111111111111', 'creditCardType')
// => { formatted: 'visa', raw: '4111111111111111', type: 'creditCardType' }
```

## `FormatterResult`

The shape returned by `format`. All fields are `readonly`.

```ts
interface FormatterResult {
  readonly formatted: string  // display value
  readonly raw: string        // canonical backend value
  readonly type: FormatType   // echo of the requested format type
}
```

- `formatted` is the display string (with delimiters, prefix, etc.). Bind this to the visible `<input>`.
- `raw` is the canonical value to ship to the server. Its exact shape depends on the format and options: phone/card values are digits (with a possible leading `+` for phones), while general values can retain letters or configured affixes. Mirror it into a hidden input.
- `type` is the requested format type — useful for debugging or when the same result object is piped through downstream layers.

## `FormatType`

Union of the seven supported format types.

```ts
type FormatType =
  | 'general'
  | 'phone'
  | 'numeral'
  | 'date'
  | 'time'
  | 'creditCard'
  | 'creditCardType'
```

## `FormatOptions`

The options bag passed to `format`. See [Configuration](/formatter/reference/configuration/) for the full per-`formatType` field reference.

```ts
type FormatOptions = Partial<
  FormatGeneralOptions &
  FormatNumeralOptions &
  FormatDateOptions &
  FormatTimeOptions &
  FormatCreditCardOptions
> & {
  country?: string
  dateRawPattern?: DatePatternType
  dateRawPatternDelimiter?: string
  timeRawPattern?: TimePatternType
  timeRawPatternDelimiter?: string
  /** @deprecated Prefer the dedicated `suffix` option. */
  tailPrefix?: boolean
  prefixMode?: 'lock' | 'passthrough'
  rawPrefix?: boolean
  suffix?: string
  suffixMode?: 'lock' | 'passthrough'
  rawSuffix?: boolean
  interpretInputAs?: 'auto' | 'display' | 'raw'
}
```

## `FORMAT_TYPES`

A `readonly` tuple of every supported type. Useful for iterating, building pickers, or driving type-driven UIs.

```ts
import { FORMAT_TYPES } from '@samline/formatter'

FORMAT_TYPES
// => ['general', 'phone', 'numeral', 'date', 'time', 'creditCard', 'creditCardType']
```

## `isFormatType(value)`

Type-guard that narrows an unknown string to `FormatType`.

```ts
import { isFormatType } from '@samline/formatter'

function safeFormat(value: string, formatType: string) {
  if (!isFormatType(formatType)) {
    throw new Error(`Unsupported format type: ${formatType}`)
  }
  return format(value, formatType)
}
```

## `regex`

A pre-built object of validation patterns, each pairing a `RegExp` with a ready-to-use `errorMessage`. See [Regex](/formatter/reference/regex/) for the full table.

```ts
import { regex } from '@samline/formatter'

regex.email.pattern.test('foo@bar.com') // true
regex.email.errorMessage               // 'Please enter a valid email address.'
```

## Browser global: `window.Formatter`

The `/browser` entrypoint registers a focused `Formatter` object on `window`. It exposes `format`, `regex`, and `version`; lower-level root helpers are not added to the global.

```ts
interface FormatterGlobal {
  format: (value: unknown, formatType: FormatType, options?: FormatOptions) => FormatterResult
  regex: typeof regex
  version: string
}
```

```html
<script src="https://unpkg.com/@samline/formatter@2.0.2/dist/browser/global.global.js"></script>
<script>
  const result = window.Formatter.format('5512345678', 'phone')
  console.log(result.formatted) // '55 1234 5678'
  console.log(window.Formatter.version) // '2.0.2'
</script>
```

## Advanced helpers

The building blocks are also exported for advanced consumers. Treat them as an internal API — they are exported because they are useful, but the public contract is `format`.

```ts
import {
  formatPhone,
  getRawValue,
  getDateValueFromRaw,
  getTimeValueFromRaw,
  stripPrefixAndSuffix
} from '@samline/formatter'

formatPhone('5512345678', 'MX', '-')                                   // '55-1234-5678'
getRawValue('1,234.50', 'numeral')                                     // '1234.50'
getDateValueFromRaw('2026-05-12', { datePattern: ['d', 'm', 'Y'] })    // '12052026'
getTimeValueFromRaw('14:30', { timePattern: ['h', 'm', 's'] })         // '143000'
stripPrefixAndSuffix('$100', { prefix: '$' })                          // '100'
```

The `/vanilla` entrypoint exposes the exact same surface as the root import. The two are aliases by design — pick whichever reads better in your codebase.
