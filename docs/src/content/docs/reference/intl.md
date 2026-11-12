---
locale: en
sidebar:
  group: reference
  order: 7
title: 'Intl display helpers'
titleAccent: 'display helpers'
description: 'Show stored numbers, currency, percentages, dates and relative time with @samline/formatter/intl, built on the native Intl APIs with no dependencies.'
---

`format()` masks what people type. `@samline/formatter/intl` shows values you already store — an invoice total, a birth date, when something happened — with the browser's own `Intl` formatters and no extra dependency.

```ts
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from '@samline/formatter/intl'

formatCurrency(1234.5, { locale: 'es-MX', currency: 'MXN' }) // '$1,234.50'
formatNumber(1234, { locale: 'en-US', notation: 'compact' }) // '1.2K'
formatPercent(0.256, { locale: 'en-US', decimals: 1 }) // '25.6%'
formatDate('2026-11-12', { locale: 'es-MX', preset: 'long' }) // '12 de noviembre de 2026'
formatRelativeTime(threeDaysAgo, { locale: 'es-MX' }) // 'hace 3 días'
```

The browser builds expose the same functions as `window.Formatter.intl`.

## Safe input

Every helper accepts the values a page actually has and never prints `NaN` or `Invalid Date`:

| Input                                           | Result                    |
| ----------------------------------------------- | ------------------------- |
| `null`, `undefined`, `''`                       | `''`                      |
| A value that cannot be read as a number/date    | `fallback` (default `''`) |
| An invalid option (unknown currency, time zone) | throws, like `Intl` does  |

```ts
formatNumber('abc', { fallback: '—' }) // '—'
formatDate('2026-02-30', { fallback: '—' }) // '—' (no such day)
formatCurrency(null, { currency: 'MXN' }) // ''
```

Locales default to the runtime locale. Every helper takes `locale` (a BCP 47 tag or a list) and `fallback`. `Intl.*Format` instances are cached by locale and options, so calling a helper in a loop or a render function does not rebuild them.

Some locales use no-break or narrow no-break spaces (for example `'USD 2.00'` in `es-MX`); compare with that in mind in tests.

## `formatNumber(value, options?)`

Reads numbers, bigints and dot-decimal numeric strings such as the `raw` value of a `numeral` field. A display string like `'1,234'` is not a number and returns `fallback`.

| Option        | Type     | Meaning                                                       |
| ------------- | -------- | ------------------------------------------------------------- |
| `decimals`    | `number` | Exact fraction digits (sets both minimum and maximum).        |
| `minDecimals` | `number` | `minimumFractionDigits`.                                      |
| `maxDecimals` | `number` | `maximumFractionDigits`.                                      |
| `notation`    | `string` | `'standard'`, `'scientific'`, `'engineering'` or `'compact'`. |
| `signDisplay` | `string` | `'auto'`, `'always'`, `'exceptZero'` or `'never'`.            |

Any other `Intl.NumberFormatOptions` field (`useGrouping`, `compactDisplay`, `minimumIntegerDigits`…) passes through.

```ts
const { raw } = format('1,234.5', 'numeral') // raw: '1234.5'
formatNumber(raw, { locale: 'es-MX', decimals: 2 }) // '1,234.50'
formatNumber(1234.5, { locale: 'de-DE', decimals: 2 }) // '1.234,50'
formatNumber(5, { locale: 'en-US', signDisplay: 'always' }) // '+5'
```

## `formatCurrency(value, options)`

Same input and decimal options as `formatNumber`, plus:

| Option         | Type     | Default      | Meaning                                                        |
| -------------- | -------- | ------------ | -------------------------------------------------------------- |
| `currency`     | `string` | required     | ISO 4217 code such as `'MXN'` or `'USD'`.                      |
| `display`      | `string` | `'symbol'`   | `'symbol'`, `'narrowSymbol'`, `'code'` or `'name'`.            |
| `currencySign` | `string` | `'standard'` | `'accounting'` wraps negatives in parentheses in many locales. |

```ts
formatCurrency(1234.5, { locale: 'en-US', currency: 'USD' }) // '$1,234.50'
formatCurrency(2, { locale: 'en-US', currency: 'USD', display: 'name' }) // '2.00 US dollars'
formatCurrency(1234.567, { locale: 'en-US', currency: 'USD', decimals: 0 }) // '$1,235'
formatCurrency(-5, { locale: 'en-US', currency: 'USD', currencySign: 'accounting' }) // '($5.00)'
```

A missing `currency` throws a `TypeError`.

## `formatPercent(value, options?)`

Formats a ratio: `0.256` is 25.6 %. Takes the same decimal options.

```ts
formatPercent(0.256, { locale: 'en-US' }) // '26%'
formatPercent(0.256, { locale: 'es-MX', decimals: 1 }) // '25.6%'
```

## `formatDate(value, options?)`

Accepts a `Date`, a timestamp in milliseconds, an ISO date-time string, or a digit string in `pattern` order — the `raw` value of a formatter `date` field.

| Option     | Type              | Default           | Meaning                                                                                 |
| ---------- | ----------------- | ----------------- | --------------------------------------------------------------------------------------- |
| `preset`   | `string`          | `'medium'`        | `'short'`, `'medium'`, `'long'` or `'full'` (`dateStyle`).                              |
| `pattern`  | `DatePatternType` | `['Y', 'm', 'd']` | Segment order for digit strings such as `'2026-11-12'`, `'20261112'` or `'12/11/2026'`. |
| `timeZone` | `string`          | runtime zone      | Any `Intl.DateTimeFormatOptions` field passes through.                                  |

A preset is used only when no component option (`year`, `month`, `day`, `weekday`, `hour`, `minute`, `second`, `era`, `timeZoneName`, `dayPeriod`, `fractionalSecondDigits`) is given; components win. `timeStyle` combines with the preset.

Digit strings are read as **local calendar dates**, so `'2026-11-12'` is the 12th everywhere instead of being shifted by the UTC offset as `new Date('2026-11-12')` would. Invalid days (`'2026-02-30'`) return `fallback`. Two-digit years (`y`) map to 2000–2099, and a pattern without a year cannot be read.

```ts
formatDate('2026-11-12', { locale: 'en-US' }) // 'Nov 12, 2026'
formatDate(date, { locale: 'es-MX', preset: 'full' }) // 'jueves, 12 de noviembre de 2026'
formatDate(date, { locale: 'en-US', month: 'short', day: 'numeric' }) // 'Nov 12'
formatDate('12/11/2026', { locale: 'en-US', pattern: ['d', 'm', 'Y'] }) // 'Nov 12, 2026'
formatDate('11/26', { locale: 'en-US', pattern: ['m', 'y'], month: 'long', year: 'numeric' }) // 'November 2026'
```

## `formatRelativeTime(value, options?)`

Reads `value` like `formatDate` and formats its distance from `now`.

| Option    | Type                       | Default           | Meaning                                                                           |
| --------- | -------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| `now`     | `Date \| number \| string` | `Date.now()`      | Reference instant, read at call time.                                             |
| `style`   | `string`                   | `'long'`          | `'long'`, `'short'` or `'narrow'`.                                                |
| `numeric` | `string`                   | `'auto'`          | `'auto'` allows "yesterday", "next week", "now".                                  |
| `unit`    | `string`                   | automatic         | Force `'second'`, `'minute'`, `'hour'`, `'day'`, `'week'`, `'month'` or `'year'`. |
| `pattern` | `DatePatternType`          | `['Y', 'm', 'd']` | Segment order for digit strings.                                                  |

The automatic unit is the largest one whose rounded amount does not reach the next unit (60 seconds, 60 minutes, 24 hours, 7 days, about 4.35 weeks, 12 months), so 59.6 minutes reads "in 1 hour" rather than "in 60 minutes". Amounts round half away from zero, so past and future are symmetric.

```ts
formatRelativeTime(threeDaysAgo, { locale: 'es-MX' }) // 'hace 3 días'
formatRelativeTime(inTwoHours, { locale: 'en-US' }) // 'in 2 hours'
formatRelativeTime(yesterday, { locale: 'en-US', numeric: 'always' }) // '1 day ago'
formatRelativeTime(threeDaysAgo, { locale: 'en-US', unit: 'hour' }) // '72 hours ago'
```

## Migrating from `@samline/date`

`@samline/date` wraps Day.js and is asynchronous because it loads locales on demand. `Intl` already ships every locale, so the replacements are synchronous:

| `@samline/date`                                                                      | `@samline/formatter/intl`                                                                 |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `await getDate({ date: '23/03/2026', input: 'DD/MM/YYYY', output: 'MMMM D, YYYY' })` | `formatDate('23/03/2026', { pattern: ['d', 'm', 'Y'], locale: 'en-US', preset: 'long' })` |
| `createDateFormatter({ locale: 'es-mx' })`                                           | pass `locale: 'es-MX'` per call; instances are cached for you                             |
| Day.js output tokens (`MMMM D, YYYY`)                                                | a `preset` or `Intl.DateTimeFormatOptions` components (`month: 'long'`…)                  |
| `isValidDate(...)`                                                                   | `formatDate(value, { fallback: '' }) !== ''`, or `regex.date` for typed input             |

Output follows the locale's conventions instead of a token string, so exact punctuation can differ from a Day.js pattern. Date arithmetic and chaining (`createDateChain`) have no equivalent here; keep `@samline/date` or `Date` for those.

## Related

- [Options](../configuration/) — `numeralDecimalPadding` pads a numeral field on blur.
- [Entrypoints](../entrypoints/) — every subpath and its size.
- [TypeScript reference](../typescript/) — the Intl option types.
