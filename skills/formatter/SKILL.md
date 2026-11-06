---
name: formatter
description: Integrate @samline/formatter into forms in JavaScript, TypeScript, frameworks, CMS templates or server code. Use for formatting phones, numerals, dates, times, card numbers and custom masks into display and backend-ready values, and for pairing them with the package's regex validation catalog; not for input-mask libraries that own the DOM.
metadata:
  package: '@samline/formatter'
  package-version: '2.1.0'
---

# Formatter

Build against the installed `@samline/formatter` version. This skill describes **2.1.0**. Check the dependency version before applying it: in 2.0.x the CDN script exposed only `window.Formatter.default`, so browser-global code needs 2.1.0 or later. Preserve the host project's markup, components, validation and design; Formatter returns strings and never touches the DOM.

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

Format types: `'phone'`, `'numeral'`, `'date'`, `'time'`, `'creditCard'`, `'creditCardType'`, `'general'`.

## Choose a loading mode

- **Package / ESM:** `npm install @samline/formatter` (or pnpm, yarn, bun), then `import { format, regex } from '@samline/formatter'`. CommonJS `require` works too. `@samline/formatter/vanilla` exposes the same API. No stylesheet exists or is needed.
- **HTML / CDN:** `<script src="https://unpkg.com/@samline/formatter@2.1.0/dist/browser/global.global.js"></script>`, then `const { format, regex } = window.Formatter`. The script is a minified IIFE (about 165 KB before compression, it bundles libphonenumber-js and cleave-zen). Load it once, before code that uses it. Pin the version; a repository version does not prove that npm or the CDN already serve it.

Use one setup per page. Do not load the CDN script in a bundled application.

## Wire a field

```html
<label for="phone">Mobile phone</label>
<input id="phone" type="text" inputmode="tel" autocomplete="tel" />
<input type="hidden" name="phone" />
```

```js
import { format } from '@samline/formatter'

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
- **numeral:** `prefix`, `tailPrefix` (prefix after the number), `numeralDecimalMark`, `delimiter`, `numeralDecimalScale`, `numeralIntegerScale`, `numeralThousandsGroupStyle` (`'thousand' | 'lakh' | 'wan' | 'none'`), `numeralPositiveOnly`, `stripLeadingZeroes`, `signBeforePrefix`. `raw` never includes the prefix and always uses `.` for decimals.
- **date:** `datePattern` (display, default `['d','m','Y']`), `delimiter` (default `/`), `dateRawPattern` and `dateRawPatternDelimiter` (raw shape), `dateMin`, `dateMax`, `interpretInputAs` (`'auto'` default, `'display'`, `'raw'`). With `'auto'`, a complete value without the display delimiter is read as raw, so `'1990-12-31'` displays as `31/12/1990`. Setting only `datePattern` makes the raw pattern mirror it; set `dateRawPattern` explicitly when the backend wants ISO.
- **time:** `timePattern` (default `['h','m','s']`), `timeRawPattern`, `timeRawPatternDelimiter`, `timeFormat`, `interpretInputAs`.
- **creditCard:** groups by detected brand; `raw` is digits. **creditCardType** returns the brand (`'visa'`, `'amex'`, `'mastercard'`…) as `formatted` and the digits as `raw`.
- **general:** requires a non-empty `blocks` array (throws otherwise). `delimiter` / `delimiters`, `delimiterLazyShow`, `numericOnly`, `uppercase`, `lowercase`, plus decorations:
  - `prefix` / `suffix` with `prefixMode` / `suffixMode`: `'lock'` (default, the decoration is added and a single deleted character restores it) or `'passthrough'` (people type it; matched case-insensitively when `uppercase`/`lowercase` is set).
  - `rawPrefix` / `rawSuffix`: include the decoration in `raw`; the body is then derived from the formatted value.
  - Default decorated `raw` is the typed body without the formatter's delimiters (characters hidden by `numericOnly` are kept). Undecorated `general` values derive `raw` from `formatted`.
  - `tailPrefix: true` without `suffix` is a deprecated alias; prefer `suffix`.

## Validate with the regex catalog

```js
import { format, regex } from '@samline/formatter'

const rule = regex.phone({ length: 10 })
field.addEventListener('input', () => {
  const { formatted, raw } = format(field.value, 'phone')
  field.value = formatted
  field.setCustomValidity(rule.pattern.test(raw) ? '' : rule.errorMessage)
})
```

Every entry is `{ pattern, errorMessage }`. Static entries include `email`, `phone`, `rfc`, `curp`, `cp`, `postalCode`, `numeral`, `onlyNumbers`, `creditCard`, `expirationDate`, `cardCvc`, `onlyLetters`, `onlyAlphanumeric`, `url`, `ipv4`, `ipv6`, `uuid`, `hexColor`, `hashtag`, `mention`, `time24`, `date`, `slug`, `username`, `macAddress`, `semver` and `base64`. Parametric builders: `digits(n | { length, min, max })`, `phone({ length })`, `creditCard({ min, max })`, `url({ protocol })`, `password({ min, max, uppercase, lowercase, numbers, special })` and `custom(pattern, message)`. Builders throw `RangeError` for negative, fractional or inverted ranges. `password` rules are requirements: any non-whitespace character is allowed. Choose whether a rule tests `raw` or `formatted` deliberately (`regex.date` expects ISO `raw`; `regex.expirationDate` expects `MM/YY`). These patterns give quick feedback; always validate again on the server.

## Frameworks and hosts

- **React:** in `onChange`, call `format(event.target.value, …)` and store both `formatted` (the input's `value`) and `raw` (a hidden input or form state) in React state. Do not mutate the DOM from the handler.
- **Vue / Svelte:** compute `formatted` from the stored `raw`, or format inside the input handler and write both values to reactive state.
- **Shopify / WordPress / plain HTML:** load the CDN script once in the layout and attach listeners to your own fields; nothing needs cleanup unless your code adds listeners to elements that are replaced.
- **Server:** call `format()` to normalize imported data or to render display values; it has no DOM access.

Remove your own listeners when the owning component unmounts; Formatter holds no state.

## Advanced helpers

`formatPhone(value, country, delimiter)`, `getRawValue(formatted, type, options)`, `stripPrefixAndSuffix(value, options)`, `getDateValueFromRaw`, `getTimeValueFromRaw`, `looksLikeRawDateValue` and `looksLikeRawTimeValue` are public but rarely needed; prefer `format()`. `formatValue`, `getValueForFormatting` and `resolveRuntimeOptions` are internal.

## Types

`FormatType`, `FormatOptions`, `FormatterResult`, `DatePatternType`, `TimePatternType`, `RegexEntry`, `RegexKey` (static entries only) and `Regex` are exported from the root.

For complete contracts and runnable files use https://samline.github.io/formatter/docs/ and https://samline.github.io/formatter/examples/. This skill teaches package integration; it does not authorize publishing or changing an application's design.
