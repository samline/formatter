# @samline/formatter

Input formatting for JavaScript, TypeScript and browser-based forms: numerals, dates, times, card numbers, custom masks and opt-in phones, returned as a display value and a backend-ready value from one pure call, plus `Intl` helpers to display stored numbers, currency and dates. No DOM access, no framework runtime and no runtime dependency in the core.

[Demo](https://samline.github.io/formatter/) · [Examples](https://samline.github.io/formatter/examples/) · [Documentation](https://samline.github.io/formatter/docs/) · [Changelog](CHANGELOG.md)

## Table of contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [HTML / CDN](#html--cdn)
- [Capabilities](#capabilities)
- [API at a glance](#api-at-a-glance)
- [Documentation](#documentation)
- [Changelog](#changelog)
- [AI agent skill](#ai-agent-skill)
- [License](#license)

## Installation

```sh
npm install @samline/formatter
```

```sh
pnpm add @samline/formatter
```

```sh
bun add @samline/formatter
```

Package tooling requires Node.js 20+; output targets ES2020. There is no stylesheet to import.

## Quick start

Format the visible field on every keystroke and mirror the raw value into the field your backend reads.

```html
<label for="phone">Mobile phone</label>
<input id="phone" type="text" inputmode="tel" autocomplete="tel" />
<input type="hidden" name="phone" />
```

```js
import { format } from '@samline/formatter'
import { registerPhone } from '@samline/formatter/phone'

registerPhone() // phones are opt-in since 3.0.0

const field = document.querySelector('#phone')
const hidden = document.querySelector('input[name="phone"]')

field.addEventListener('input', () => {
  const { formatted, raw } = format(field.value, 'phone', { country: 'MX' })
  field.value = formatted // '55 1234 5678'
  hidden.value = raw // '5512345678'
})
```

The same call works for every type:

```js
format('1234567.891', 'numeral', { prefix: '$', numeralDecimalScale: 2 })
// { formatted: '$1,234,567.89', raw: '1234567.89', type: 'numeral' }

format('1990-12-31', 'date', { dateRawPattern: ['Y', 'm', 'd'] })
// { formatted: '31/12/1990', raw: '1990-12-31', type: 'date' }

format('4111111111111111', 'creditCard')
// { formatted: '4111 1111 1111 1111', raw: '4111111111111111', type: 'creditCard' }

format('12345678', 'general', { prefix: 'ORD-', blocks: [4, 4], delimiter: '-' })
// { formatted: 'ORD-1234-5678', raw: '12345678', type: 'general' }
```

`format()` is pure and synchronous: there is no instance to create or destroy. Your code owns the listener, labels, error messages and caret behavior.

Pad a money field when it loses focus, and show stored values in a locale:

```js
format('1234.5', 'numeral', { prefix: '$', numeralDecimalPadding: true })
// { formatted: '$1,234.50', raw: '1234.5', type: 'numeral' }

format('1234.5', 'numeral', { prefix: '$', numeralDecimalPadding: true, rawDecimalPadding: true })
// { formatted: '$1,234.50', raw: '1234.50', type: 'numeral' }

import { formatCurrency, formatDate, formatRelativeTime } from '@samline/formatter/intl'

formatCurrency(1234.5, { locale: 'es-MX', currency: 'MXN' }) // '$1,234.50'
formatDate('2026-11-12', { locale: 'es-MX', preset: 'long' }) // '12 de noviembre de 2026'
formatRelativeTime(threeDaysAgo, { locale: 'es-MX' }) // 'hace 3 días'
```

## HTML / CDN

Load the versioned standalone script, then use `window.Formatter`:

```html
<script src="https://unpkg.com/@samline/formatter@3.1.0/dist/browser/formatter.phone.global.js"></script>
<script>
  const { format, regex } = window.Formatter
  console.log(format('5512345678', 'phone').formatted) // '55 1234 5678'
</script>
```

Both scripts are minified IIFEs that define `window.Formatter` with `format`, `intl`, `regex` and `version`:

| Script                                                                               | Phones      | Size (minified)           |
| ------------------------------------------------------------------------------------ | ----------- | ------------------------- |
| `https://unpkg.com/@samline/formatter@3.1.0/dist/browser/formatter.global.js`        | no          | about 25 KB (9 KB gzip)   |
| `https://unpkg.com/@samline/formatter@3.1.0/dist/browser/formatter.phone.global.js`  | registered  | about 165 KB (41 KB gzip) |

Pin the version in production, or self-host the same file. 3.0.0 renamed the former `global.global.js`.

## Capabilities

- Opt-in phones for any country through libphonenumber-js, with international `+` numbers kept in `raw`.
- Numerals with currency prefixes or suffixes, regional decimal marks, decimal and integer limits, optional decimal padding and positive-only values.
- `Intl` display helpers for numbers, currency, percentages, dates and relative time, with safe handling of empty and invalid values.
- Dates and times in any segment order, with a separate raw pattern (for example ISO for storage) and automatic recognition of stored values.
- Card numbers grouped by brand, and brand detection.
- Free text with title, sentence or capitalize casing (`'text'`) and live URL slugs (`'slug'`), built on [@samline/string](https://github.com/samline/utils/tree/main/packages/string).
- General block masks with delimiters, case transforms, numeric-only input and locked or typed prefixes and suffixes.
- A validation catalog that pairs each pattern with its error message, including parametric rules for digits, phones, cards, URLs and passwords.

[Working examples](https://samline.github.io/formatter/examples/) cover fifteen real fields: phones by country, currencies, quantities, ISO dates, card expiry, times, card numbers, order references, units, promo codes, ZIP codes, CURP, hex colors and validation rules. [Framework integrations](https://samline.github.io/formatter/docs/guides/frameworks/) covers React, Vue, Svelte, vanilla and server-side use.

### Formatted and raw

`formatted` is for people; submit `raw`. Prefixes and suffixes stay out of `raw` unless `rawPrefix` / `rawSuffix` is set, numerals always use a dot for decimals, and dates follow their raw pattern. Formatting a displayed value again returns the same `raw`. See [configuration](https://samline.github.io/formatter/docs/reference/configuration/).

## API at a glance

| API                                                                                                                                                                | Purpose        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| `format(value, formatType, options?)`                                                                                                                              | Format         |
| `'phone'`, `'numeral'`, `'date'`, `'time'`, `'creditCard'`, `'creditCardType'`, `'general'`, `'text'`, `'slug'`                                                                        | Format types   |
| `FORMAT_TYPES`, `isFormatType()`                                                                                                                                   | Type checks    |
| `regex` (static entries and the `digits`, `phone`, `creditCard`, `url`, `password` and `custom` builders)                                                          | Validation     |
| `getRawValue()`, `stripPrefixAndSuffix()`, `getDateValueFromRaw()`, `getTimeValueFromRaw()`, `looksLikeRawDateValue()`, `looksLikeRawTimeValue()`, `isPhoneRegistered()` | Helpers        |
| `registerPhone()`, `formatPhone()` from `@samline/formatter/phone`                                                                                                 | Phones         |
| `formatNumber()`, `formatCurrency()`, `formatPercent()`, `formatDate()`, `formatRelativeTime()` from `@samline/formatter/intl`                                     | Display        |
| `window.Formatter.format`, `window.Formatter.intl`, `window.Formatter.regex`, `window.Formatter.version`                                                           | Browser global |

### Entrypoints

| Entrypoint                         | When to use                                                               |
| ---------------------------------- | ------------------------------------------------------------------------- |
| `@samline/formatter`               | ESM and CommonJS with type declarations; about 19 KB minified (7 KB gzip). |
| `@samline/formatter/vanilla`       | The same API under an explicit subpath.                                   |
| `@samline/formatter/phone`         | `registerPhone()` and `formatPhone()`; adds libphonenumber-js.            |
| `@samline/formatter/intl`          | `Intl` display helpers; no dependencies.                                  |
| `@samline/formatter/browser`       | The standalone IIFE without phones (`formatter.global.js`).               |
| `@samline/formatter/browser/phone` | The standalone IIFE with phones (`formatter.phone.global.js`).            |

### Validation

```js
import { format, regex } from '@samline/formatter'

const rule = regex.phone({ length: 10 })
const { raw } = format(field.value, 'phone')
field.setCustomValidity(rule.pattern.test(raw) ? '' : rule.errorMessage)
```

Patterns give quick feedback; validate again on the server. Card formatting is not payment validation.

### TypeScript

The package includes declarations. Import `FormatType`, `FormatOptions` and `FormatterResult` for formatting, `DatePatternType`, `TimePatternType` and `NumeralThousandsGroupStyle` for patterns, `RegexEntry`, `RegexKey` and `Regex` for validation, and the `Intl*Options` types from `@samline/formatter/intl`. See the [TypeScript reference](https://samline.github.io/formatter/docs/reference/typescript/).

## Documentation

Read the [documentation](https://samline.github.io/formatter/docs/) for the full guides and API contracts, and explore [working examples](https://samline.github.io/formatter/examples/) with complete and separate source files for both loading modes.

| Guide                                                                                 | What it covers                                         |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [Getting started](https://samline.github.io/formatter/docs/getting-started/)          | Installation, the first field and starter files.       |
| [Configuration](https://samline.github.io/formatter/docs/reference/configuration/)    | Every option per type, with prefix and suffix rules.   |
| [Validation patterns](https://samline.github.io/formatter/docs/reference/regex/)      | The regex catalog and its parametric builders.         |
| [Framework integrations](https://samline.github.io/formatter/docs/guides/frameworks/) | React, Vue, Svelte, vanilla and server-side use.       |
| [Styling and UX](https://samline.github.io/formatter/docs/guides/styling-and-ux/)     | Markup, input attributes, validation states and caret. |
| [Recipes](https://samline.github.io/formatter/docs/guides/recipes/)                   | End-to-end patterns for real forms.                    |
| [API reference](https://samline.github.io/formatter/docs/reference/api/)              | `format()` and the helpers, with errors and returns.   |
| [Intl display helpers](https://samline.github.io/formatter/docs/reference/intl/)      | Numbers, currency, dates and relative time on `Intl`.  |
| [Entrypoints](https://samline.github.io/formatter/docs/reference/entrypoints/)        | Every subpath, the browser builds and their sizes.     |

## Changelog

Read [CHANGELOG.md](CHANGELOG.md) or the [published changelog](https://samline.github.io/formatter/docs/changelog/) for release history and explicitly marked breaking and behavior changes. Review the notes before upgrading.

### Upgrading to 3.0

- Phones are opt-in. Call `registerPhone()` from `@samline/formatter/phone` once, and import `formatPhone` from that subpath; until then `format(value, 'phone')` throws a `TypeError` that says so.
- The browser script `global.global.js` is now `formatter.phone.global.js` (with phones) or `formatter.global.js` (without).
- `cleave-zen` is no longer a dependency; its engine is maintained in the package. `numeralThousandsGroupStyle` takes plain strings (`'thousand'`, `'lakh'`, `'wan'`, `'none'`).
- Engine fixes change a few outputs: a `','` decimal mark groups with `'.'` by default, Mastercard detection is limited to 2221–2720, a 12-hour clock turns hour `00` into `12`, and numeral `raw` keeps only a leading minus.

Read the [3.0.0 notes](CHANGELOG.md) before upgrading.

## AI agent skill

<a id="agent-integration"></a>

The [Formatter skill](https://samline.github.io/formatter/skills/formatter/SKILL.md) describes 3.0 integration: loading modes, the formatted/raw contract, options per type, validation and host ownership. Pass it to an agent or install it using a skills-compatible tool. Verify the installed package version before applying its guidance.

The maintained [repository source](skills/formatter/SKILL.md) and website download are the same file.

Download [SKILL.md](https://samline.github.io/formatter/skills/formatter/SKILL.md) into a `formatter/` folder in your agent's supported skill directory. For agents that discover project skills from `.agents/skills/`:

```sh
mkdir -p .agents/skills/formatter
curl --fail --location https://samline.github.io/formatter/skills/formatter/SKILL.md \
  --output .agents/skills/formatter/SKILL.md
```

When working from this repository, copy `skills/formatter/SKILL.md` instead. Keep the filename `SKILL.md`; discovery paths and invocation syntax depend on the agent.

## License

MIT — [LICENSE.md](LICENSE.md). The formatting engine includes code adapted from [cleave-zen](https://github.com/nosir/cleave-zen) (MIT); its notice is in LICENSE.md.
