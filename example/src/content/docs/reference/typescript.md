---
title: TypeScript
description: Every type and value exported from @samline/formatter, with examples.
sidebar:
  order: 4
---

This page lists every type and value exported from `@samline/formatter`, what it represents, and where it shows up. Each entry links to the function or pattern that consumes or produces it.

## Imports

```ts
import {
  format,
  isFormatType,
  FORMAT_TYPES,
  regex,
  formatPhone,
  getRawValue,
  getDateValueFromRaw,
  getTimeValueFromRaw,
  looksLikeRawDateValue,
  looksLikeRawTimeValue,
  stripPrefixAndSuffix,
  type FormatOptions,
  type FormatType,
  type FormatterResult,
  type DatePatternType,
  type TimePatternType
} from '@samline/formatter'
```

---

## Format types

### `FormatType`

Union of the seven supported format types. TypeScript narrows `format()`'s second argument against this union; an unsupported string raises `TypeError` at runtime.

```ts
import type { FormatType } from '@samline/formatter'

const type: FormatType = 'phone'         // ✓
// const wrong: FormatType = 'foo'        // ✗ TS error
```

### `FormatOptions`

Per-type configuration bag passed to `format()`'s third argument. Internally it is the intersection of `cleave-zen`'s per-type option interfaces plus a few package-specific extras (`country`, `dateRawPattern`, `dateRawPatternDelimiter`, `timeRawPattern`, `timeRawPatternDelimiter`, `prefixMode`, `rawPrefix`, `suffix`, `suffixMode`, `rawSuffix`, `tailPrefix`, `interpretInputAs`).

See the [Configuration reference](./configuration/) for the full per-`formatType` field reference.

```ts
import type { FormatOptions } from '@samline/formatter'

const opts: FormatOptions = {
  blocks: [4, 4, 4, 4],
  delimiter: ' '
}
```

### `FormatterResult`

The shape returned by `format()`. All fields are `readonly` so the result is safe to pipe through downstream layers without copy-on-write concerns.

```ts
import type { FormatterResult } from '@samline/formatter'

const result: FormatterResult = format('5512345678', 'phone')
result.formatted  // '55 1234 5678'
result.raw        // '5512345678'
result.type       // 'phone'
```

| Field | Type | Meaning |
| --- | --- | --- |
| `formatted` | `string` | Display string (with delimiters, prefix, etc.). Bind to the visible `<input>`. |
| `raw` | `string` | Canonical backend-ready string. Mirror to a hidden `<input>`. |
| `type` | [`FormatType`](#formattype) | Echo of the requested format type. Useful for debugging or when the result is passed downstream. |

### `DatePatternType` / `TimePatternType`

Re-exported from `cleave-zen`. Used in `FormatOptions.datePattern` / `timePattern` / `dateRawPattern` / `timeRawPattern` to define the segment order.

```ts
import type { DatePatternType, TimePatternType } from '@samline/formatter'

const datePattern: DatePatternType = ['d', 'm', 'Y']        // default
const timePattern: TimePatternType = ['h', 'm', 's']        // default
```

For `'date'` each token is `'d'`, `'m'`, or `'Y'` (day, month, year). For `'time'` each token is `'h'`, `'m'`, or `'s'` (hours, minutes, seconds). The order is the display order the formatter inserts into the visible field.

---

## Runtime helpers

### `FORMAT_TYPES`

A `readonly` tuple of every supported type. Useful for iterating, building pickers, or type-driven UIs.

```ts
import { FORMAT_TYPES } from '@samline/formatter'

FORMAT_TYPES
// => ['general', 'phone', 'numeral', 'date', 'time', 'creditCard', 'creditCardType']
```

### `isFormatType(value)`

A type-guard that narrows an unknown string to `FormatType`. Pair it with `format()` when the format type comes from an untrusted source (URL, config, user input).

```ts
import { isFormatType, format } from '@samline/formatter'

function safeFormat(value: string, formatType: string) {
  if (!isFormatType(formatType)) {
    throw new Error(`Unsupported format type: ${formatType}`)
  }
  return format(value, formatType)
}
```

`isFormatType` does not throw — it returns a boolean. The error in `safeFormat` is a UX choice, not a requirement.

---

## Regex dictionary types

### `RegexEntry`

A `{ pattern, errorMessage }` pair. Every static entry of `regex` conforms to this shape; the callable parametric entries (`digits`, `phone`, `creditCard`, `url`, `password`, `custom`) return values that also conform to it.

```ts
interface RegexEntry {
  pattern: RegExp
  errorMessage: string
}
```

### `RegexKey`

```ts
type RegexKey = /* union of static-entry keys */
```

`RegexKey` is the union of entries that always expose a static `.pattern` and `.errorMessage`.

```ts
import { regex, type RegexKey } from '@samline/formatter'

function validate(key: RegexKey, value: string): string | null {
  return regex[key].pattern.test(value) ? null : regex[key].errorMessage
}

validate('email', 'foo@bar.com')   // null  (valid)
validate('email', 'not-an-email')  // 'Please enter a valid email address.'
```

`RegexKey` covers the static entries (`phone`, `email`, `rfc`, `curp`, `cp`, `postalCode`, `numeral`, `onlyNumbers`, `creditCard`, `expirationDate`, `cardCvc`, `onlyLetters`, `onlyAlphanumeric`, `url`, `ipv4`, `ipv6`, `uuid`, `hexColor`, `hashtag`, `mention`, `base64`, `semver`, `macAddress`, `time24`, `date`, `slug`, `username`). It excludes the parametric-only helpers `digits`, `password`, and `custom`.

### `Regex`

The full type of the `regex` export. Useful when you write a wrapper around the dictionary.

```ts
import type { Regex } from '@samline/formatter'

function getErrorMessage(key: keyof Regex, value: string): string {
  const entry = regex[key]
  if (typeof entry === 'function') return 'Validation pending.'
  return entry.pattern.test(value) ? '' : entry.errorMessage
}
```

:::caution
Because `Regex` includes callable entries alongside the static ones, you need to discriminate with `typeof entry === 'function'` (or call them unconditionally when the optional argument is generic).
:::

### Parametric `regex` signatures

```ts
function regex.digits(params?: number | { length?: number; min?: number; max?: number }): RegexEntry
function regex.phone(params?: { length?: number }): RegexEntry
function regex.creditCard(params?: { min?: number; max?: number }): RegexEntry
function regex.url(params?: { protocol?: 'http' | 'https' | 'ftp' | 'all' }): RegexEntry
function regex.password(params?: {
  min?: number
  max?: number
  uppercase?: boolean
  lowercase?: boolean
  numbers?: boolean
  special?: boolean
}): RegexEntry

function regex.custom(pattern: RegExp, errorMessage?: string): RegexEntry
function regex.custom(params: { pattern: RegExp; errorMessage: string }): RegexEntry
```

See the [regex reference](./regex/) for examples of every overload.

### Static `regex` record type

When you need to know the exact shape of a particular entry, pick it directly off the dictionary:

```ts
import { regex } from '@samline/formatter'

const emailEntry = regex.email
//    ^? { pattern: RegExp; errorMessage: string }

const phoneCallable = regex.phone
//    ^? ((params?: { length?: number }) => RegexEntry) & RegexEntry

const urlCallable = regex.url
//    ^? ((params?: { protocol?: 'http' | 'https' | 'ftp' | 'all' }) => RegexEntry) & RegexEntry
```

The callable entries carry the static `.pattern` and `.errorMessage` so callers can use either form without an `if`-branch.

---

## Advanced helper signatures

The lower-level helpers used internally by `format()`. They are exported because they are useful in isolation, but the public contract is `format()`.

```ts
function formatPhone(
  value: string,
  country?: string,    // ISO 3166-1 alpha-2; defaults to 'MX'
  delimiter?: string   // group separator; defaults to ' '
): string

function getRawValue(
  formatted: string,
  formatType: FormatType,
  options?: FormatOptions
): string

function getDateValueFromRaw(
  value: string,
  options?: FormatOptions
): string

function getTimeValueFromRaw(
  value: string,
  options?: FormatOptions
): string

function looksLikeRawDateValue(
  value: string,
  options?: FormatOptions
): boolean

function looksLikeRawTimeValue(
  value: string,
  options?: FormatOptions
): boolean

function stripPrefixAndSuffix(
  value: string,
  options?: FormatOptions
): string
```

`stripPrefixAndSuffix` removes a leading `prefix`, a dedicated trailing `suffix`, and the legacy `prefix`-as-suffix form selected by `tailPrefix: true`.

---

## Generic input handling

`format` accepts `unknown` as its value type. Cast or guard inputs as needed; most consumers come from `e.target.value`, which is always `string`.

```ts
import type { FormatterResult } from '@samline/formatter'

function handleInput(rawEvent: Event): FormatterResult | null {
  const target = rawEvent.target as HTMLInputElement
  if (!target.value) return null
  return format(target.value, 'phone', { country: 'MX' })
}
```

---

## Default type aliases

```ts
// Format-side defaults
type DatePatternType = ('d' | 'm' | 'y' | 'Y')[] // re-exported from cleave-zen
type TimePatternType = ('h' | 'm' | 's')[]    // re-exported from cleave-zen

// Regex-side defaults
type RegexKey = /* union of static-entry keys */
type Regex = typeof regex
interface RegexEntry { pattern: RegExp; errorMessage: string }
```

These are the literal aliases exported by the package. Anything beyond them comes from `cleave-zen` and is not directly re-exported.

## Related

- [Configuration reference](./configuration/) — full `FormatOptions` reference, per-`formatType`.
- [API reference](./api/#format-value-formattype-options) — `format()` signature, behaviour, edge cases.
- [regex reference](./regex/) — `regex` dictionary and parametric helpers.
- [Recipes](../recipes/) — end-to-end React/Vue/Svelte examples that exercise these types.
