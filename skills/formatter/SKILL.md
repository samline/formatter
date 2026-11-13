---
name: formatter
description: Integrate @samline/formatter into forms in JavaScript, TypeScript, frameworks, CMS templates or server code. Use for formatting numerals, dates, times, card numbers, custom masks and opt-in phones into display and backend-ready values, for showing stored values with its Intl helpers, and for pairing them with the package's regex validation catalog; not for input-mask libraries that own the DOM.
metadata:
  package: '@samline/formatter'
  package-version: '3.2.0'
---

# Formatter

Build against the installed `@samline/formatter` version. This skill describes **3.2.0** (`@samline/formatter/date` is new in 3.2.0; `'text'` and `'slug'` in 3.1.0). Check the dependency version before applying it: before 3.0.0 phones worked without `registerPhone()`, `formatPhone` lived in the root and the CDN file was `global.global.js`; in 2.0.x that script exposed only `window.Formatter.default`. Preserve the host project's markup, components, validation and design; Formatter returns strings and never touches the DOM.

## The one contract

```ts
import { format } from '@samline/formatter'

const { formatted, raw, type } = format(value, formatType, options)
```

- `formatted` is for people: put it in the visible input.
- `raw` is for the backend: mirror it into a hidden input, form state or request body.
- `format()` is pure and synchronous. There is no instance, no lifecycle and nothing to destroy; call it on every `input` event, on the server or in tests.
- `null`, `undefined` and `''` return empty strings. Other non-strings go through `String()`.
- An unknown `formatType` throws `TypeError`. Use `isFormatType(value)` or `FORMAT_TYPES` for types that come from configuration or URLs.
- `'phone'` throws `TypeError` until `registerPhone()` from `@samline/formatter/phone` has run once (even for an empty value). Call it at application startup; it enables every entrypoint. Projects that format no phones skip it and do not bundle libphonenumber-js.

Format types: `'phone'`, `'numeral'`, `'date'`, `'time'`, `'creditCard'`, `'creditCardType'`, `'general'`, `'text'` (casing via `case: 'upper' | 'lower' | 'title' | 'sentence' | 'capitalize'`, `smallWords`, `locale`) and `'slug'` (`formatted` keeps a trailing separator while typing, `raw` is the final slug; `delimiter`, `replacements`, `maxLength`). `general` also accepts `case`.

## Choose a loading mode

- **Package / ESM:** `npm install @samline/formatter` (or pnpm, yarn, bun), then `import { format, regex } from '@samline/formatter'`. For phones also `import { registerPhone } from '@samline/formatter/phone'` and call `registerPhone()` once. CommonJS `require` works too. `@samline/formatter/vanilla` exposes the same API. No stylesheet exists or is needed.
- **HTML / CDN:** `<script src="https://unpkg.com/@samline/formatter@3.2.0/dist/browser/formatter.phone.global.js"></script>` when the page formats phones (about 170 KB minified), or `formatter.global.js` from the same folder when it does not (about 29 KB). Then `const { format, regex, intl } = window.Formatter`. Load it once, before code that uses it. Pin the version; a repository version does not prove that npm or the CDN already serve it.

Use one setup per page. Do not load the CDN script in a bundled application.

## Date tools (`@samline/formatter/date`)

- Use `@samline/formatter/date` for parsing, formatting, arithmetic, comparisons, time zones and durations. It has no dependencies and is built on native `Date` and `Intl`; import only what you use and it tree-shakes.
- Every function takes `Date | number | string`, returns a new value and never mutates. Months are 1–12. Invalid input gives `''` (or `fallback`) from formatters, `undefined` from `parseDate`, an invalid `Date`, `NaN` or `false`.
- `options.timeZone` accepts any IANA zone; `locale` drives names and week rules (`weekStart` and `minimalDays` override them).
- Main calls: `parseDate(text, { format: 'DD/MM/YYYY' })`, `formatDatePattern(date, 'dddd D [de] MMMM', { locale: 'es' })`, `formatCalendar`, `addDate(date, 1, 'month')` or `addDate(date, { days: 2 })`, `subtractDate`, `startOfDate`/`endOfDate`, `setDateUnit`, `diffDate(a, b, 'day')`, `isBeforeDate`/`isAfterDate`/`isSameDate`/`isBetweenDate`, `clampDate`, `isoWeek`, `weekOfYear`, `getTimeZoneOffset`, `createDate(parts, { timeZone })`, `createDuration`, `formatDuration`, `humanizeDuration`. `formatRelativeTime` is re-exported from `@samline/formatter/intl`.
- Masked date inputs still use `format(value, 'date', { datePattern })` from the core; map its pattern to parse tokens (`d`→`DD`, `m`→`MM`, `Y`→`YYYY`, `y`→`YY`) when you parse the result.
- CDN: load `https://unpkg.com/@samline/formatter@3.2.0/dist/browser/formatter.date.global.js` after `formatter.global.js`; it adds `window.Formatter.date` and reuses `Formatter.intl.formatRelativeTime`.

## Wire a field

```html
<label for="phone">Mobile phone</label>
<input id="phone" type="text" inputmode="tel" autocomplete="tel" />
<input type="hidden" name="phone" />
```

```js
import { format } from '@samline/formatter'
import { registerPhone } from '@samline/formatter/phone'

registerPhone()

const field = document.querySelector('#phone')
const hidden = document.querySelector('input[name="phone"]')

field.addEventListener('input', () => {
  const { formatted, raw } = format(field.value, 'phone', { country: 'MX' })
  field.value = formatted
  hidden.value = raw
})
```

- Use `type="text"` with `inputmode` (`tel`, `numeric`, `decimal`) and a real `autocomplete` token. `type="number"` rejects separators and decorations.
- Attach one listener per field. When an option changes at runtime (a country select), read it inside the listener (`{ country: select.value }`) and listen to the select's `change`; never re-attach the input listener.
- To prefill from stored data, run the stored raw value through `format()` and assign `formatted`.
- Assigning `field.value` moves the caret to the end. Formatter does not manage selection; for mid-string editing save `selectionStart` and restore with `setSelectionRange()`.

## Options by type

- **phone:** `country` (ISO 3166-1 alpha-2, case-insensitive, default `'MX'`), `delimiter` (default `' '`). Non-digits are stripped; a leading `+` is kept for international numbers in both outputs.
- **numeral:** `prefix`, `tailPrefix` (prefix after the number), `numeralDecimalMark`, `delimiter`, `numeralDecimalScale`, `numeralIntegerScale`, `numeralThousandsGroupStyle` (`'thousand' | 'lakh' | 'wan' | 'none'`), `numeralPositiveOnly`, `stripLeadingZeroes` (default `true`), `signBeforePrefix`, `numeralDecimalPadding`. `raw` never includes the prefix and always uses `.` for decimals. A `','` mark groups with `'.'` unless `delimiter` is set. `numeralDecimalPadding: true` pads `formatted` decimals to `numeralDecimalScale` (`1,234.50`) while `raw` stays unpadded (`1234.5`); use it on `blur` or for display, not on every `input`, because it fights the caret. `rawDecimalPadding: true` pads `raw` instead (`1234.50`), independently and safely on every `input`, for backends that expect a fixed scale.
- **date:** `datePattern` (display, default `['d','m','Y']`), `delimiter` (default `/`), `dateRawPattern` and `dateRawPatternDelimiter` (raw shape), `dateMin`, `dateMax`, `interpretInputAs` (`'auto'` default, `'display'`, `'raw'`). With `'auto'`, a complete value without the display delimiter is read as raw, so `'1990-12-31'` displays as `31/12/1990`. Setting only `datePattern` makes the raw pattern mirror it; set `dateRawPattern` explicitly when the backend wants ISO.
- **time:** `timePattern` (default `['h','m','s']`), `timeRawPattern`, `timeRawPatternDelimiter`, `timeFormat` (`'12'` turns a typed `00` hour into `12`), `interpretInputAs`.
- **creditCard:** groups by detected brand; `strictMode: true` allows 19 digits; `raw` is digits. **creditCardType** returns the brand (`'visa'`, `'amex'`, `'mastercard'`…) as `formatted` and the digits as `raw`.
- **general:** requires a non-empty `blocks` array (throws otherwise). `delimiter` / `delimiters`, `delimiterLazyShow`, `numericOnly`, `uppercase`, `lowercase`, plus decorations:
  - `prefix` / `suffix` with `prefixMode` / `suffixMode`: `'lock'` (default, the decoration is added and a single deleted character restores it) or `'passthrough'` (people type it; matched case-insensitively when `uppercase`/`lowercase` is set).
  - `rawPrefix` / `rawSuffix`: include the decoration in `raw`; the body is then derived from the formatted value.
  - Default decorated `raw` is the typed body without the formatter's delimiters (characters hidden by `numericOnly` are kept). Undecorated `general` values derive `raw` from `formatted`.
  - `tailPrefix: true` without `suffix` is a deprecated alias; prefer `suffix`.

## Validate with the regex catalog

```js
import { format, regex } from '@samline/formatter'
// registerPhone() has already run at startup.

const rule = regex.phone({ length: 10 })
field.addEventListener('input', () => {
  const { formatted, raw } = format(field.value, 'phone')
  field.value = formatted
  field.setCustomValidity(rule.pattern.test(raw) ? '' : rule.errorMessage)
})
```

Every entry is `{ pattern, errorMessage }`. Static entries include `email`, `phone`, `rfc`, `curp`, `cp`, `clabe`, `nss`, `postalCode`, `numeral`, `onlyNumbers`, `creditCard` (12–19 digits), `expirationDate`, `cardCvc`, `onlyLetters`, `onlyAlphanumeric`, `personName`, `url`, `domain`, `ipv4`, `ipv6`, `uuid` (v1–v8), `hexColor`, `hashtag`, `mention`, `time24`, `time12`, `date` (real calendar days), `isoDateTime`, `latitude`, `longitude`, `slug`, `username`, `macAddress`, `semver`, `base64` and `base64url`. Parametric builders: `digits(n | { length, min, max })`, `phone({ length })`, `creditCard({ min, max })`, `url({ protocol })`, `uuid({ version })`, `password({ min, max, uppercase, lowercase, numbers, special })` and `custom(pattern, message)`. `date(options)`, `time(options)` and `numeral(options)` take the same options as `format()` and accept exactly what that mask writes, so pass the field's format options to validate `formatted`. Builders throw `RangeError` for negative, fractional or inverted ranges. `password` rules are requirements: any non-whitespace character is allowed. Choose whether a rule tests `raw` or `formatted` deliberately (`regex.date` expects ISO `raw`; `regex.expirationDate` expects `MM/YY`). These patterns give quick feedback; always validate again on the server.

## Frameworks and hosts

- **React:** in `onChange`, call `format(event.target.value, …)` and store both `formatted` (the input's `value`) and `raw` (a hidden input or form state) in React state. Do not mutate the DOM from the handler.
- **Vue / Svelte:** compute `formatted` from the stored `raw`, or format inside the input handler and write both values to reactive state.
- **Shopify / WordPress / plain HTML:** load the CDN script once in the layout and attach listeners to your own fields; nothing needs cleanup unless your code adds listeners to elements that are replaced.
- **Server:** call `format()` to normalize imported data or to render display values; it has no DOM access.

Remove your own listeners when the owning component unmounts; Formatter holds no per-field state (the only module state is the phone registration).

## Display stored values with Intl

`@samline/formatter/intl` (also `window.Formatter.intl`) formats values you already have; it never masks typing:

```js
import { formatCurrency, formatDate, formatNumber, formatPercent, formatRelativeTime } from '@samline/formatter/intl'

formatCurrency(1234.5, { locale: 'es-MX', currency: 'MXN' }) // '$1,234.50'
formatNumber(1234, { locale: 'en-US', notation: 'compact' }) // '1.2K'
formatPercent(0.256, { locale: 'en-US', decimals: 1 }) // '25.6%'
formatDate('2026-11-12', { locale: 'es-MX', preset: 'long' }) // '12 de noviembre de 2026'
formatRelativeTime(date, { locale: 'es-MX', now }) // 'hace 3 días'
```

- `null`, `undefined` and `''` return `''`; unreadable values return `fallback` (default `''`). Invalid options (unknown currency or time zone) throw.
- Number helpers take numbers, bigints or dot-decimal strings such as a numeral `raw`; a display string like `'1,234'` is not a number. Options: `decimals`, `minDecimals`, `maxDecimals` and any `Intl.NumberFormatOptions` field. `formatCurrency` requires `currency`; `display` is `'symbol' | 'narrowSymbol' | 'code' | 'name'`.
- `formatDate` reads `Date`, timestamps, ISO date-times and digit strings in `pattern` order (default `['Y','m','d']`, the date `raw`) as local calendar dates. `preset` (`'short' | 'medium' | 'long' | 'full'`, default `'medium'`) applies only when no component option such as `month` or `weekday` is given.
- `formatRelativeTime` picks the unit automatically (pass `unit` to force one); `now` defaults to the current time, so pass it for deterministic output.
- Output can contain no-break spaces; do not compare it to strings typed with regular spaces.

## Advanced helpers

`formatPhone(value, country, delimiter)` (from `@samline/formatter/phone`), `isPhoneRegistered()`, `getRawValue(formatted, type, options)`, `stripPrefixAndSuffix(value, options)`, `getDateValueFromRaw`, `getTimeValueFromRaw`, `looksLikeRawDateValue` and `looksLikeRawTimeValue` are public but rarely needed; prefer `format()`. `formatValue`, `getValueForFormatting` and `resolveRuntimeOptions` are internal.

## Types

`FormatType`, `FormatOptions`, `FormatterResult`, `DatePatternType`, `TimePatternType`, `NumeralThousandsGroupStyle`, `RegexEntry`, `RegexKey` (static entries only) and `Regex` are exported from the root; `IntlNumberOptions`, `IntlCurrencyOptions`, `IntlPercentOptions`, `IntlDateOptions` and `IntlRelativeTimeOptions` from `@samline/formatter/intl`.

For complete contracts and runnable files use https://samline.github.io/formatter/docs/ and https://samline.github.io/formatter/examples/. This skill teaches package integration; it does not authorize publishing or changing an application's design.
