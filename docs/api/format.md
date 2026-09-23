# `format(value, formatType, options?)`

The main entry point of `@samline/formatter`. Pure, deterministic, framework-agnostic.

```ts
import { format } from '@samline/formatter'

format('5512345678', 'phone')
// => { formatted: '55 1234 5678', raw: '5512345678', type: 'phone' }
```

## Signature

```ts
function format(
  value: unknown,
  formatType: FormatType,
  options?: FormatOptions
): FormatterResult
```

## Parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `value` | `unknown` | yes | The raw value typed by the user. `null`, `undefined`, and `''` return an empty `{ formatted: '', raw: '', type: formatType }` result. |
| `formatType` | [`FormatType`](#) | yes | One of the seven supported format types. Throws `TypeError` if invalid. |
| `options` | [`FormatOptions`](../options.md) | no | Per-type options. See [Configuration](../options.md) for the full field reference. |

## Returns

A [`FormatterResult`](#) with three readonly fields:

```ts
interface FormatterResult {
  readonly formatted: string  // display value
  readonly raw: string        // canonical backend value
  readonly type: FormatType   // echo of the requested format type
}
```

- `formatted` is the display string (with delimiters, prefix, etc.). Bind this to the visible `<input>`.
- `raw` is the canonical value to ship to the server. Its exact shape depends on the format and options: phone and card values are digits (with a possible leading `+` for phones), while `general` values can retain letters or configured affixes when `rawPrefix` / `rawSuffix` is true. Mirror it into a hidden input.
- `type` is the requested format type — useful for debugging or when the same result object is piped through downstream layers.

## Throws

- `TypeError` when `formatType` is not one of the seven supported types. The message lists every supported type.

```ts
format('5512345678', 'foobar')
// TypeError: Invalid formatType: foobar. Expected one of: general, phone, numeral, date, time, creditCard, creditCardType
```

## Behaviour

1. **Validate `formatType`.** Unknown types raise immediately so misconfigurations surface at the call site instead of silently returning garbage.
2. **Short-circuit empty values.** `null`, `undefined`, and `''` return `{ formatted: '', raw: '', type: formatType }`. This is what lets you call `format` on every keystroke without guarding the empty case.
3. **Resolve runtime options.** For `phone`, defaults are applied (`country: 'MX'`, `delimiter: ' '`); for every other type, `cleave-zen` applies its idiomatic defaults (`/` for dates, `:` for times, `,` for numerals).
4. **Manage affixes for `general`.** The prefix and tail decoration (`prefix`, `suffix`, `rawPrefix`, `rawSuffix`, `prefixMode`, `suffixMode`) are handled by the formatter itself, not by `cleave-zen` whose internal `stripPrefix` discards any input that doesn't already start with the configured prefix.
5. **Pre-process the value.** For `'date'` / `'time'`, the value passes through the `interpretInputAs` heuristic (`'auto'` by default) before reaching `cleave-zen`. For every other type, the value is passed through untouched.
6. **Format.** The pre-processed value is fed to the appropriate `formatValue` helper from `cleave-zen` or, for `phone`, to `formatPhone` (which uses `libphonenumber-js`'s `AsYouType`).
7. **Derive the raw value.** The raw value is recomputed from the *formatted* output (so `numericOnly`, `uppercase`, `lowercase`, and the configured delimiter are all reflected in the canonical). For `'creditCardType'`, the raw is derived from the user's input instead because the formatted value carries the brand name, not the digits.

## Examples

```ts
import { format } from '@samline/formatter'

// Phone (Mexico by default, space-delimited)
format('5512345678', 'phone')
// => { formatted: '55 1234 5678', raw: '5512345678', type: 'phone' }

// Numeral (thousand separators)
format('1234567', 'numeral')
// => { formatted: '1,234,567', raw: '1234567', type: 'numeral' }

// Date (raw Y-m-d → display d/m/Y)
format('2026-05-12', 'date')
// => { formatted: '12/05/2026', raw: '2026-05-12', type: 'date' }

// Credit card (grouped by brand, digits-only raw)
format('4111111111111111', 'creditCard')
// => { formatted: '4111 1111 1111 1111', raw: '4111111111111111', type: 'creditCard' }

// Card brand detection
format('4111111111111111', 'creditCardType')
// => { formatted: 'visa', raw: '4111111111111111', type: 'creditCardType' }

// Empty / nullish short-circuit
format('', 'phone')         // => { formatted: '', raw: '', type: 'phone' }
format(null, 'phone')       // => { formatted: '', raw: '', type: 'phone' }
format(undefined, 'phone')  // => { formatted: '', raw: '', type: 'phone' }
```

## Edge cases

- **Non-string values.** Values that are not strings are coerced via `String(value)` before processing. Numbers, bigints, booleans, and `Date`s all produce a sensible output through the formatter.
- **Server-prefilled raw dates.** When the visible field already carries the canonical raw (e.g. a Blade `old('birthday')` carrying `"19901212"`), the default `interpretInputAs: 'auto'` routes that through the raw-interpretation branch so the visible ends up showing the configured display form. See [Configuration → Date](../options.md#date).
- **Pasting exactly eight delimiter-less digits into a date field.** Always ambiguous — it could be `12121990` (display d/m/Y) or `19901212` (raw Y/m/d). If your pipeline always receives user-typed input, force `interpretInputAs: 'display'` to lock in the visible interpretation.
- **`numericOnly` and `rawPrefix: true`.** When both are enabled, `raw` derives its body from the *formatted* body (display delimiter stripped) and then runs `numericOnly` again, so a fat-fingered input no longer ships a contaminated identifier to the backend.
- **`tailPrefix` legacy.** When `prefix + tailPrefix: true` and `suffix` are both provided, `suffix` wins. The legacy shape is preserved for existing callers.

## Related

- [`isFormatType`](#isformattype) — runtime guard for unknown `formatType` strings.
- [`FORMAT_TYPES`](#format_types) — readonly tuple of every supported type.
- [`regex`](./regex.md) — paired validation patterns with ready-to-use error messages.
- [`options`](../options.md) — per-`formatType` option reference.
- [recipes](../recipes.md) — end-to-end wiring patterns (React, Vue, Svelte, vanilla, `<form>`).

---

# Advanced helpers

The package re-exports the building blocks `format()` is built on. Treat them as **internal API** — they are exported because they are useful in isolation, but the public contract is `format`.

## `formatPhone(value, country?, delimiter?)`

Format a phone number string using `libphonenumber-js`'s `AsYouType`. Non-digit characters are stripped before formatting (the leading `+` is preserved so international numbers keep their country prefix); the spaces produced by `AsYouType` are swapped for `delimiter` when a custom delimiter is provided.

```ts
import { formatPhone } from '@samline/formatter'

formatPhone('5512345678', 'MX', '-')  // '55-1234-5678'
formatPhone('2025551234', 'US')       // '202 555 1234'
```

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string` | — | The raw input (digits, `+`, spaces, dashes, parentheses). |
| `country` | `string` | `'MX'` | ISO 3166-1 alpha-2 country code (`'MX'`, `'US'`, `'AR'`, …). |
| `delimiter` | `string` | `' '` | Separator used between groups in the output. |

Returns the formatted phone string, or `''` when `value` is empty.

## `getRawValue(formatted, formatType, options?)`

Derive the canonical raw value from a formatted string. Called internally by `format()` for every type except `'creditCardType'` (where the formatted value carries the brand, not the digits).

```ts
import { getRawValue } from '@samline/formatter'

getRawValue('1,234.50', 'numeral')   // '1234.50'
getRawValue('12/05/2026', 'date', {
  datePattern: ['d', 'm', 'Y'],
  dateRawPattern: ['Y', 'm', 'd']
})                                    // '2026-05-12'
```

Useful for cases where you already have the formatted string (e.g. `<input type="date">` after the user picked a date) and need to derive the raw without re-running `format()`.

## `getDateValueFromRaw(raw, options?)`

Convert a raw date string (e.g. `2026-05-12`) into the digit order of the display pattern (e.g. `12/05/2026` → `12052026`). Output is digits-only and un-delimited — the caller passes the result through `format(..., 'date')` to add the configured delimiter.

```ts
import { getDateValueFromRaw } from '@samline/formatter'

getDateValueFromRaw('2026-05-12', { datePattern: ['d', 'm', 'Y'] })  // '12052026'
```

This is the **legacy round-trip helper**. It is exported because it is useful in isolation, but `format()` no longer calls it by default — see [`FormatOptions.interpretInputAs`](../options.md#date) for the live-keystroke preprocessing step.

## `getTimeValueFromRaw(raw, options?)`

Convert a raw time string (e.g. `14:30`) into the digit order of the display pattern (e.g. `14:30:00` → `1430`). Same shape as `getDateValueFromRaw` but for the `'time'` type.

```ts
import { getTimeValueFromRaw } from '@samline/formatter'

getTimeValueFromRaw('14:30', { timePattern: ['h', 'm', 's'] })  // '143000'
```

## `looksLikeRawDateValue(value, options?)` / `looksLikeRawTimeValue(value, options?)`

Heuristic that powers the v2.0.0 `interpretInputAs: 'auto'` default. Both helpers return `true` when the value looks like the canonical raw form (no delimiters present, digit length matches the configured raw pattern) and `false` otherwise. The caller falls back to the display interpretation in the `false` branch.

```ts
import { looksLikeRawDateValue, looksLikeRawTimeValue } from '@samline/formatter'

looksLikeRawDateValue('19901212', { dateRawPattern: ['Y', 'm', 'd'] })   // true
looksLikeRawDateValue('12/12/1990', { dateRawPattern: ['Y', 'm', 'd'] }) // false
looksLikeRawTimeValue('1430', { timeRawPattern: ['h', 'm'] })           // true
```

You rarely call these directly. The most common reason to reach for them is when you are building a custom input pipeline that needs to mimic the formatter's auto-detection logic — e.g. deciding whether to format a pre-filled value as raw or display before passing it to `format()`.

## `stripPrefixAndSuffix(value, options?)`

Strip the configured `prefix` and `suffix` from a string. Used internally when `format()` needs the plain body of a `general` value; exposed because it is useful in isolation when you write your own code path around `prefix` / `suffix`.

```ts
import { stripPrefixAndSuffix } from '@samline/formatter'

stripPrefixAndSuffix('$100', { prefix: '$' })            // '100'
stripPrefixAndSuffix('PRE-12345-END', {
  prefix: 'PRE-',
  suffix: '-END'
})                                                        // '12345'
```

Only exact affixes are removed. Partial passthrough handling belongs to `format()` and is not performed by this lower-level helper.
