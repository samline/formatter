---
locale: en
sidebar:
  group: reference
  order: 8
title: 'Date tools'
titleAccent: 'tools'
description: 'Read, format, change, compare and measure dates with @samline/formatter/date: tokens, parsing, time zones, weeks and durations on native Date and Intl.'
---

`format()` masks a date while people type it. `@samline/formatter/date` does everything after that: read the text into a `Date`, check it, move it, compare it, measure it and show it again in any pattern, locale or time zone. It runs on the native `Date` and `Intl` APIs with no dependencies.

```ts
import { addDate, diffDate, formatDatePattern, parseDate } from '@samline/formatter/date'

const checkIn = parseDate('24/12/2026', { format: 'DD/MM/YYYY' })
const checkOut = addDate(checkIn, 3, 'day')

diffDate(checkOut, checkIn, 'day') // 3
formatDatePattern(checkOut, 'dddd D [de] MMMM', { locale: 'es-MX' }) // 'domingo 27 de diciembre'
```

Every function is a separate export, so a bundle only carries what it imports: `formatDatePattern` alone is about 3.5 KB gzip, `addDate` with `diffDate` about 2 KB, and every function together under 10 KB. The browser builds add them as `window.Formatter.date` with the [date add-on](#browser).

## Rules shared by every function

- **Inputs.** Every function takes a `Date`, a timestamp in milliseconds or a string. ISO strings without an offset (`'2026-11-12'`, `'2026-11-12 09:30'`) are a wall clock in the time zone you pass, or the local one; impossible days such as `'2026-02-30'` are invalid. Strings with `Z` or an offset are exact instants.
- **Nothing is changed in place.** Functions that return a date return a new `Date`.
- **Months are 1–12** everywhere: in `getDateParts`, `createDate`, `setDateUnit` and the `M` token.
- **Invalid input never prints `Invalid Date`.** Formatting returns `''` for `null`, `undefined` and `''`, and `fallback` (default `''`) for unreadable values. Functions that return a date return an invalid `Date`, numbers are `NaN`, and checks are `false`. Invalid options, such as an unknown time zone, throw like `Intl` does.
- **Options.** Most functions take `{ timeZone, locale, weekStart, minimalDays }`. `timeZone` is any IANA zone (`'America/Cancun'`, `'UTC'`) and defaults to the runtime zone. `locale` gives names and week rules and defaults to the runtime locale.
- **Units** are `'year'`, `'quarter'`, `'month'`, `'week'`, `'isoWeek'`, `'day'`, `'hour'`, `'minute'`, `'second'` and `'millisecond'`. The plural (`'days'`) is accepted too.

## Reading dates

### `parseDate(value, options?)`

Returns a `Date`, or `undefined` when the value cannot be read.

```ts
parseDate('2026-11-12') // local midnight, November 12
parseDate('12/11/2026', { format: 'DD/MM/YYYY' }) // November 12, 2026
parseDate('31/02/2026', { format: 'DD/MM/YYYY' }) // undefined
parseDate('5 de marzo de 2026', { format: 'D [de] MMMM [de] YYYY', locale: 'es-MX' }) // March 5, 2026
parseDate('March 5th, 2026 3:30 PM', { format: 'MMMM Do, YYYY h:mm A', locale: 'en-US' })
parseDate('2026-11-12 09:00', { timeZone: 'America/Cancun' }) // 09:00 in Cancún
```

| Option     | Default | Meaning                                                                                                                                                                  |
| ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `format`   | none    | [Tokens](#tokens) the text is written in, or a list to try in order. Without it, `Date` values, timestamps and ISO strings are read.                                     |
| `strict`   | `true`  | Every number at its full width (`DD` is two digits), separators exactly as written and nothing left over. `false` accepts `1/2/2026` for `DD/MM/YYYY` and any separator. |
| `locale`   | runtime | Language of month, weekday and AM/PM names. Names match ignoring case, accents and dots.                                                                                 |
| `timeZone` | local   | Zone of the wall clock read. Ignored when the text has an offset (`Z`, `ZZ`).                                                                                            |

Missing parts are filled the way people expect: `'HH:mm'` alone is that time today, a year alone is January 1. Impossible dates and times (`31/02`, `25:00`, `13:00 PM`) are rejected, and in strict mode so is a wall time skipped by a daylight-saving jump.

Localized tokens (`L`, `LL`…), week tokens and time-zone names are output only.

### Matching a masked input

A `date` field formatted with `datePattern: ['d', 'm', 'Y']` and the `/` delimiter shows `DD/MM/YYYY`. Read it with the same tokens:

```ts
import { format } from '@samline/formatter'
import { isValidDate, parseDate } from '@samline/formatter/date'

const { formatted } = format(input.value, 'date', { datePattern: ['d', 'm', 'Y'], delimiter: '/' })
const date = parseDate(formatted, { format: 'DD/MM/YYYY' })
```

The pattern letters map to tokens: `d` → `DD`, `m` → `MM`, `Y` → `YYYY`, `y` → `YY`.

### `isValidDate(value, options?)`

`true` when `parseDate` with the same options returns a date. A `Date` object is valid when its time is a number.

```ts
isValidDate('29/02/2024', { format: 'DD/MM/YYYY' }) // true
isValidDate('29/02/2025', { format: 'DD/MM/YYYY' }) // false
```

## Showing dates

### `formatDatePattern(value, pattern?, options?)`

```ts
const date = parseDate('2026-11-12 15:04')

formatDatePattern(date, 'DD/MM/YYYY') // '12/11/2026'
formatDatePattern(date, 'MMMM D, YYYY', { locale: 'en-US' }) // 'November 12, 2026'
formatDatePattern(date, 'dddd, D [de] MMMM [de] YYYY', { locale: 'es-MX' }) // 'jueves, 12 de noviembre de 2026'
formatDatePattern(date, 'h:mm A', { locale: 'en-US' }) // '3:04 PM'
formatDatePattern(date, 'LL', { locale: 'es-MX' }) // '12 de noviembre de 2026'
formatDatePattern(date, 'HH:mm z', { timeZone: 'America/Mexico_City', locale: 'en-US' })
```

`pattern` defaults to ISO 8601 with the offset (`'YYYY-MM-DDTHH:mm:ssZ'`). Names come from `Intl`, so every locale works without loading locale files. Next to a day number, months use the grammatical form the language needs (`'12 ноября'`, but `'ноябрь 2026'`). `options` takes `timeZone`, `locale`, `weekStart`, `minimalDays` and `fallback`.

### Tokens

| Token                 | Output                                               | Example (Thursday, November 12, 2026, 15:04:05.678) |
| --------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `YYYY` / `YY`         | Year, four or two digits                             | `2026` / `26`                                       |
| `Q`                   | Quarter                                              | `4`                                                 |
| `M` / `MM`            | Month number                                         | `11` / `11`                                         |
| `MMM` / `MMMM`        | Month name, short or long                            | `Nov` / `November`                                  |
| `D` / `DD`            | Day of the month                                     | `12` / `12`                                         |
| `Do`                  | Day with its ordinal mark (`1st`, `1º`, `1er`, `1.`) | `12th`                                              |
| `DDD` / `DDDD`        | Day of the year                                      | `316` / `316`                                       |
| `d`                   | Weekday, `0` Sunday – `6`                            | `4`                                                 |
| `dd` / `ddd` / `dddd` | Weekday name, two letters, short or long             | `Th` / `Thu` / `Thursday`                           |
| `E`                   | ISO weekday, `1` Monday – `7`                        | `4`                                                 |
| `e`                   | Weekday counted from the locale's first day          | `4` (`en-US`)                                       |
| `w` / `ww`            | Week of the year by the locale's rules               | `46` / `46` (`en-US`)                               |
| `W` / `WW`            | ISO week                                             | `46` / `46`                                         |
| `gggg` / `GGGG`       | Week-year, by the locale or ISO                      | `2026` / `2026`                                     |
| `H` / `HH`            | Hour, 0–23                                           | `15` / `15`                                         |
| `h` / `hh`            | Hour, 1–12                                           | `3` / `03`                                          |
| `k` / `kk`            | Hour, 1–24                                           | `15` / `15`                                         |
| `m` / `mm`            | Minute                                               | `4` / `04`                                          |
| `s` / `ss`            | Second                                               | `5` / `05`                                          |
| `S` / `SS` / `SSS`    | Fraction of a second                                 | `6` / `67` / `678`                                  |
| `A` / `a`             | Localized AM/PM, upper or lower case                 | `PM` / `pm`                                         |
| `X` / `x`             | Unix seconds / milliseconds                          | `1794495845`                                        |
| `Z` / `ZZ`            | Offset from UTC                                      | `+00:00` / `+0000` (UTC)                            |
| `z` / `zzz`           | Time-zone name, short or long                        | `CST` / `Central Standard Time`                     |
| `LT` / `LTS`          | Locale time, without or with seconds                 | `3:04 PM`                                           |
| `L` / `l`             | Locale numeric date                                  | `11/12/2026` / `11/12/2026`                         |
| `LL` / `ll`           | Locale date with the month name, long or short       | `November 12, 2026` / `Nov 12, 2026`                |
| `LLL` / `lll`         | `LL` with the time                                   | `November 12, 2026 at 3:04 PM`                      |
| `LLLL` / `llll`       | `LLL` with the weekday                               | `Thursday, November 12, 2026 at 3:04 PM`            |
| `[text]`              | Printed as is                                        | `[de]` → `de`                                       |

The `L` family comes from `Intl.DateTimeFormat`, so its exact punctuation follows the browser.

### `formatCalendar(value, options?)`

A label for nearby days: `'Today at 3:30 PM'`, `'Yesterday at 9:00 AM'`, `'Tomorrow at 9:00 AM'`, the weekday for the next six days (`'Monday at 9:30 AM'`), and `sameElse` (default `'L'`, the numeric date) for anything else. Words and the connector come from `Intl`, so `es-MX` reads `'Mañana, 9:30 a.m.'`. Takes `now` (default: now), `sameElse`, `timeZone`, `locale` and `fallback`.

### `formatRelativeTime(value, options?)`

The distance from now (`'hace 3 días'`, `'in 2 hours'`). It is the same function as in [`@samline/formatter/intl`](../intl/#formatrelativetimevalue-options), re-exported here.

## Changing dates

### `addDate(value, amount, unit, options?)` and `subtractDate`

```ts
addDate('2026-01-31', 1, 'month') // February 28, 2026
addDate('2024-02-29', 1, 'year') // February 28, 2025
addDate(date, { months: 1, days: 2, hours: 3 }) // a duration object, larger units first
subtractDate(date, 90, 'minute')
```

Years, quarters, months, weeks and days follow the calendar: the day stays inside a shorter month, and 09:00 stays 09:00 when daylight saving changes overnight. Hours and smaller are exact elapsed time, so `addDate(date, 24, 'hour')` across that night lands at 10:00. Pass `timeZone` to do this on another zone's calendar.

### `startOfDate(value, unit, options?)` and `endOfDate`

The first and last millisecond of the unit that contains `value`: `startOfDate(date, 'month')`, `endOfDate(date, 'day')`. `'week'` starts on the locale's first day (`weekStart` overrides it); `'isoWeek'` starts on Monday. On a daylight-saving day, the day is 23 or 25 hours long.

### `setDateUnit(value, unit, amount, options?)`

Set one part: `'year'`, `'quarter'`, `'month'` (1–12), `'day'`, `'weekday'` (0 Sunday – 6, within the same week), `'isoWeekday'` (1 Monday – 7), `'dayOfYear'`, `'hour'`, `'minute'`, `'second'` or `'millisecond'`. Setting the month or year keeps the day inside the month; other values roll over (`'day', 32` → the next month).

### `clampDate(value, min?, max?)`

`value` kept within `min` and `max`, either of which may be omitted. Useful with an input's `dateMin` and `dateMax`.

## Comparing and measuring

### `diffDate(a, b, unit?, options?)`

`a - b` in `unit` (default `'millisecond'`), truncated toward zero unless `float: true`.

```ts
diffDate('2026-12-24', '2026-12-20', 'day') // 4
diffDate('2026-03-31', '2026-01-31', 'month') // 2
diffDate('2026-11-12 12:00', '2026-11-12 10:30', 'hour', { float: true }) // 1.5
```

Months, quarters and years are measured on the calendar (January 31 to February 28 is one month, because adding one month to January 31 gives February 28). Days and weeks count calendar days, so a 23-hour daylight-saving day is still one day.

### Checks

| Function                                                  | `true` when                                                                                                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `isBeforeDate(a, b, unit?, options?)`                     | `a` is before `b`; with `unit`, before the whole unit of `b`                                                             |
| `isAfterDate(a, b, unit?, options?)`                      | `a` is after `b`; with `unit`, after the whole unit of `b`                                                               |
| `isSameDate(a, b, unit?, options?)`                       | Same instant, or same unit (`isSameDate(a, b, 'day')`)                                                                   |
| `isSameOrBeforeDate` / `isSameOrAfterDate`                | Either of the two                                                                                                        |
| `isBetweenDate(value, from, to, options?)`                | Between the edges, in either order. `inclusivity`: `'()'` (default), `'[]'`, `'[)'`, `'(]'`; `unit` compares whole units |
| `isToday` / `isTomorrow` / `isYesterday(value, options?)` | On that day in `timeZone`; `now` sets the reference                                                                      |
| `isWeekend(value, options?)`                              | On the locale's weekend                                                                                                  |
| `isLeapYear(yearOrDate)`                                  | A leap year                                                                                                              |

`minDate(...dates)` and `maxDate(...dates)` return the earliest and latest valid date (or `undefined`); they accept dates or one array.

### Calendar facts

| Function                      | Returns                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `daysInMonth(value)`          | 28–31                                                                        |
| `dayOfYear(value)`            | 1–366                                                                        |
| `quarter(value)`              | 1–4                                                                          |
| `weekOfYear(value, options?)` | Week number by the locale's rules (`weekStart`, `minimalDays` override them) |
| `weekYear(value, options?)`   | The year that week belongs to                                                |
| `isoWeek` / `isoWeekYear`     | ISO 8601 week and week-year (Monday first; week 1 contains January 4)        |
| `isoWeeksInYear(yearOrDate)`  | 52 or 53                                                                     |
| `getWeekInfo(locale?)`        | `{ firstDay, minimalDays, weekend }` for the locale                          |

Week rules come from `Intl.Locale` where the browser has them and from CLDR data otherwise, so `en-US` and `es-MX` weeks start on Sunday and `es-ES` and `de-DE` weeks on Monday.

## Time zones

A `Date` is an instant; a time zone decides which wall clock it shows. Pass `timeZone` to any function to read, round, change or show dates on that zone's clock, whatever zone the visitor is in.

```ts
import { createDate, formatDatePattern, getDateParts } from '@samline/formatter/date'

// 8:00 PM on December 24 in Cancún, from any visitor's browser.
const dinner = createDate(
  { year: 2026, month: 12, day: 24, hour: 20 },
  { timeZone: 'America/Cancun' }
)

formatDatePattern(dinner, 'LLL', { timeZone: 'Europe/Madrid', locale: 'es-ES' }) // the same instant in Madrid
getDateParts(dinner, { timeZone: 'Asia/Tokyo' }) // { year: 2026, month: 12, day: 25, hour: 10, … }
```

| Function                              | Returns                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `createDate(parts, options?)`         | The instant of `{ year, month?, day?, hour?, minute?, second?, millisecond? }` in `timeZone`. Out-of-range fields roll over. |
| `getDateParts(value, options?)`       | `{ year, month, day, hour, minute, second, millisecond, weekday, offset }` in `timeZone`, or `undefined`                     |
| `getTimeZoneOffset(value?, options?)` | Minutes east of UTC (`-360` in Mexico City, `60` in Madrid in winter)                                                        |
| `getTimeZone()`                       | The runtime's zone, such as `'America/Mexico_City'`                                                                          |
| `fromUnix(seconds)` / `toUnix(value)` | Conversion from and to Unix seconds                                                                                          |

A wall time skipped when clocks jump forward moves forward by the jump (2:30 becomes 3:30); a repeated wall time when clocks go back resolves to the earlier instant. These are the same rules as `Date` and `Temporal`.

## Durations

```ts
import {
  createDuration,
  durationAs,
  formatDuration,
  humanizeDuration,
} from '@samline/formatter/date'

formatDuration({ hours: 1, minutes: 30 }, { locale: 'es-MX' }) // '1 hora y 30 minutos'
formatDuration(5_400_000, { style: 'digital' }) // '1:30:00'
durationAs('PT1M30S', 'second') // 90
humanizeDuration({ days: 3 }, { withSuffix: true, locale: 'en-US' }) // 'in 3 days'
```

A duration is milliseconds, an ISO 8601 string (`'P1DT2H'`) or an object with any of `years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds` and `milliseconds`.

| Function                                | Returns                                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createDuration(input)`                 | Every field filled in, or `undefined`. Milliseconds split into days and smaller units, never months.                                                |
| `durationAs(input, unit?)`              | The total in `unit`; months and years use the average Gregorian length (30.44 and 365.2425 days)                                                    |
| `durationToISO(input)`                  | `'P1DT2H'`; empty durations are `'PT0S'`                                                                                                            |
| `formatDuration(input, options?)`       | Words in the locale, leaving out zero fields. `style`: `'long'`, `'short'`, `'narrow'` or `'digital'` (`H:mm:ss`). `fallback` for unreadable input. |
| `formatDurationPattern(input, pattern)` | Each field with tokens: `Y`, `M`, `W`, `D`, `H`/`HH`, `m`/`mm`, `s`/`ss`, `SSS`, `[text]`                                                           |
| `humanizeDuration(input, options?)`     | Rounded to the largest unit (`'2 hours'`); `withSuffix` gives `'in 2 hours'` or `'2 hours ago'`                                                     |

Add a duration with `addDate(date, duration)`, and measure one with `createDuration(diffDate(a, b))`.

## Browser

The date tools are an add-on to the browser builds, so pages that do not use them do not load them. Load it after `formatter.global.js` or `formatter.phone.global.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@samline/formatter@3.2.0/dist/browser/formatter.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@samline/formatter@3.2.0/dist/browser/formatter.date.global.js"></script>
<script>
  const { addDate, formatDatePattern } = window.Formatter.date
  formatDatePattern(addDate(new Date(), 1, 'day'), 'dddd D', { locale: 'es-MX' })
</script>
```

The add-on is about 24 KB minified (9 KB gzip). It reuses `Formatter.intl.formatRelativeTime` as `Formatter.date.formatRelativeTime` instead of shipping it twice.

## Types

Exported from `@samline/formatter/date`: `DateInput`, `DateLocale`, `DateOptions`, `DateParts`, `DatePartsInput`, `DateUnit`, `DateSetUnit`, `Weekday`, `WeekInfo`, `ParseDateOptions`, `FormatDatePatternOptions`, `CalendarOptions`, `DiffOptions`, `BetweenOptions`, `RelativeDayOptions`, `ZoneOptions`, `Duration`, `DurationInput`, `DurationObject`, `DurationUnit`, `FormatDurationOptions` and `HumanizeDurationOptions`.
