/**
 * Shared building blocks for `@samline/formatter/date`: reading inputs,
 * wall-clock parts in the local or any IANA time zone, units and week rules.
 * Everything runs on the native `Date` and `Intl` APIs, with no dependencies.
 */

/** A `Date`, a timestamp in milliseconds or a date string. */
export type DateInput = Date | number | string

/** A BCP 47 locale tag or a list of them. Defaults to the runtime locale. */
export type DateLocale = string | readonly string[]

/** A day of the week: `0` is Sunday, `6` is Saturday (like `Date#getDay`). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Units for adding, rounding, comparing and measuring dates. */
export type DateUnit =
  | 'year'
  | 'quarter'
  | 'month'
  | 'week'
  | 'isoWeek'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'

export interface DateOptions {
  /**
   * IANA time zone (`'America/Mexico_City'`, `'UTC'`) whose wall clock is
   * used to read, round and change dates. Defaults to the runtime zone.
   */
  timeZone?: string
  /** Locale for names and week rules. Defaults to the runtime locale. */
  locale?: DateLocale
  /** First day of the week. Defaults to the locale's (`0` Sunday in `en-US`, `1` Monday in `es-ES`). */
  weekStart?: Weekday
  /** Days of the new year the first week must contain. Defaults to the locale's (`1` in `en-US`, `4` in ISO countries). */
  minimalDays?: number
}

/** Wall-clock parts. `month` is 1–12; `weekday` is 0 (Sunday) – 6; `offset` is minutes east of UTC. */
export interface DateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
  weekday: Weekday
  offset: number
}

export const MS_SECOND = 1000
export const MS_MINUTE = 60 * MS_SECOND
export const MS_HOUR = 60 * MS_MINUTE
export const MS_DAY = 24 * MS_HOUR
export const MS_WEEK = 7 * MS_DAY

export const invalidDate = (): Date => new Date(NaN)

export const isValid = (date: Date): boolean => !Number.isNaN(date.getTime())

export const isEmpty = (value: unknown): boolean =>
  value === null || value === undefined || value === ''

/* ------------------------------------------------------------------------ */
/* Cached Intl instances                                                     */
/* ------------------------------------------------------------------------ */

const CACHE_LIMIT = 64
const cache = new Map<string, unknown>()

export const cached = <T>(
  kind: string,
  locale: DateLocale | undefined,
  options: object,
  create: () => T
): T => {
  const key = JSON.stringify([kind, locale ?? null, options])
  if (cache.has(key)) return cache.get(key) as T
  const instance = create()
  // A small bound keeps long-running pages from growing the cache forever.
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(key, instance)
  return instance
}

export const toLocales = (locale: DateLocale | undefined): string | string[] | undefined =>
  locale === undefined ? undefined : typeof locale === 'string' ? locale : [...locale]

export const dateTimeFormat = (
  locale: DateLocale | undefined,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat =>
  cached('dtf', locale, options, () => new Intl.DateTimeFormat(toLocales(locale), options))

/* ------------------------------------------------------------------------ */
/* Calendar math                                                             */
/* ------------------------------------------------------------------------ */

export const isLeap = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

/** Days in `month` (1–12) of `year`. */
export const monthDays = (year: number, month: number): number =>
  month === 2 ? (isLeap(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31

/** UTC milliseconds of a wall clock, with years 0–99 kept as written. */
export const wallTime = (
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0
): number => {
  const time = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  if (!(year >= 0 && year < 100)) return time
  // Date.UTC reads years 0–99 as 1900–1999.
  const date = new Date(time)
  date.setUTCFullYear(date.getUTCFullYear() - 1900)
  return date.getTime()
}

/** Day number since 1970-01-01 of a calendar date. */
export const dayNumber = (year: number, month: number, day: number): number =>
  Math.floor(wallTime(year, month, day) / MS_DAY)

const partsOfWallTime = (time: number): Omit<DateParts, 'offset'> => {
  const date = new Date(time)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    millisecond: date.getUTCMilliseconds(),
    weekday: date.getUTCDay() as Weekday,
  }
}

/* ------------------------------------------------------------------------ */
/* Time zones                                                                */
/* ------------------------------------------------------------------------ */

const zoneFormat = (timeZone: string): Intl.DateTimeFormat =>
  dateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    era: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })

/** Wall-clock UTC milliseconds of instant `time` in `timeZone`. */
const zonedWallTime = (time: number, timeZone: string): number => {
  const values: Record<string, string> = {}
  for (const part of zoneFormat(timeZone).formatToParts(time)) values[part.type] = part.value
  const year = Number(values.year)
  const ms = ((time % MS_SECOND) + MS_SECOND) % MS_SECOND
  return wallTime(
    values.era === 'BC' || values.era === 'B' ? 1 - year : year,
    Number(values.month),
    Number(values.day),
    Number(values.hour) % 24,
    Number(values.minute),
    Number(values.second),
    ms
  )
}

/** Offset in minutes east of UTC of instant `time` in `timeZone` (local when omitted). */
export const offsetAt = (time: number, timeZone?: string): number =>
  timeZone === undefined
    ? -new Date(time).getTimezoneOffset()
    : Math.round((zonedWallTime(time, timeZone) - time) / MS_MINUTE)

/** Wall-clock parts of `date` in `timeZone` (local when omitted). */
export const getParts = (date: Date, timeZone?: string): DateParts => {
  const time = date.getTime()
  if (timeZone === undefined) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      millisecond: date.getMilliseconds(),
      weekday: date.getDay() as Weekday,
      offset: -date.getTimezoneOffset(),
    }
  }
  const wall = zonedWallTime(time, timeZone)
  return { ...partsOfWallTime(wall), offset: Math.round((wall - time) / MS_MINUTE) }
}

export interface WallClock {
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
}

/**
 * The instant of a wall clock in `timeZone` (local when omitted). Out-of-range
 * fields roll over like `Date` does. A time skipped by a daylight-saving jump
 * moves forward by the jump; a repeated time resolves to the earlier instant
 * (the same rules as `Date` and `Temporal`'s `'compatible'`).
 */
export const fromParts = (parts: WallClock, timeZone?: string): Date => {
  const { year, month, day, hour = 0, minute = 0, second = 0, millisecond = 0 } = parts
  if (timeZone === undefined) {
    // `Date` already resolves skipped and repeated local times this way.
    const date = new Date(year, month - 1, day, hour, minute, second, millisecond)
    // It also reads years 0–99 as 1900–1999.
    if (year >= 0 && year < 100) date.setFullYear(date.getFullYear() - 1900)
    return date
  }
  const wall = wallTime(year, month, day, hour, minute, second, millisecond)
  if (Number.isNaN(wall)) return invalidDate()
  const before = offsetAt(wall - MS_DAY, timeZone)
  const after = offsetAt(wall + MS_DAY, timeZone)
  const candidates = [wall - before * MS_MINUTE, wall - after * MS_MINUTE].filter(
    time => zonedWallTime(time, timeZone) === wall
  )
  // Repeated hour: the earlier instant. Skipped hour: shift forward by the gap.
  return new Date(candidates.length ? Math.min(...candidates) : wall - before * MS_MINUTE)
}

/* ------------------------------------------------------------------------ */
/* Reading inputs                                                            */
/* ------------------------------------------------------------------------ */

// Date-only and floating date-time strings, read as a wall clock (not UTC).
const FLOATING =
  /^([+-]?\d{4,6})-(\d{1,2})(?:-(\d{1,2}))?(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?)?$/

/**
 * Read a `Date`, a timestamp or a string. ISO strings without an offset,
 * such as `'2026-11-12'` or `'2026-11-12 09:30'`, are a wall clock in
 * `timeZone` (local when omitted) and impossible days such as `'2026-02-30'`
 * are invalid. Strings with `Z` or an offset are exact instants.
 */
export const readDate = (value: DateInput | null | undefined, timeZone?: string): Date => {
  if (value instanceof Date) return new Date(value.getTime())
  if (typeof value === 'number') return new Date(value)
  if (typeof value !== 'string') return invalidDate()
  const text = value.trim()
  const match = FLOATING.exec(text)
  if (match) {
    const [, y, m, d = '1', h = '0', mi = '0', s = '0', fraction = '0'] = match
    const year = Number(y)
    const month = Number(m)
    const day = Number(d)
    const hour = Number(h)
    const minute = Number(mi)
    const second = Number(s)
    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > monthDays(year, month) ||
      hour > 23 ||
      minute > 59 ||
      second > 59
    ) {
      return invalidDate()
    }
    const millisecond = Math.floor(Number(`0.${fraction}`) * 1000)
    return fromParts({ year, month, day, hour, minute, second, millisecond }, timeZone)
  }
  if (text === '') return invalidDate()
  return new Date(Date.parse(text))
}

/* ------------------------------------------------------------------------ */
/* Units                                                                     */
/* ------------------------------------------------------------------------ */

const UNITS = new Set<string>([
  'year',
  'quarter',
  'month',
  'week',
  'isoWeek',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
])

/** Accepts `'day'` and `'days'`; throws on an unknown unit. */
export const normalizeUnit = (unit: string): DateUnit => {
  const singular = unit.endsWith('s') && unit !== 's' ? unit.slice(0, -1) : unit
  if (UNITS.has(singular)) return singular as DateUnit
  throw new RangeError(`Unknown date unit: ${unit}`)
}

export const UNIT_MS: Partial<Record<DateUnit, number>> = {
  week: MS_WEEK,
  isoWeek: MS_WEEK,
  day: MS_DAY,
  hour: MS_HOUR,
  minute: MS_MINUTE,
  second: MS_SECOND,
  millisecond: 1,
}

/* ------------------------------------------------------------------------ */
/* Week rules                                                                */
/* ------------------------------------------------------------------------ */

export interface WeekInfo {
  /** First day of the week: `0` Sunday … `6` Saturday. */
  firstDay: Weekday
  /** Days of the new year the first week must contain (`1`–`7`). */
  minimalDays: number
  /** Weekend days, `0` Sunday … `6` Saturday. */
  weekend: Weekday[]
}

// CLDR week data, used where Intl.Locale has no week info (Firefox).
const SUNDAY_FIRST =
  'AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'
const SATURDAY_FIRST = 'AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'
const FOUR_DAY_WEEKS =
  'AD AN AT AX BE BG CH CZ DE DK EE ES FI FJ FO FR GB GF GG GI GP GR HU IE IM IS IT JE LI LT LU MC MQ NL NO PL RE RU SE SJ SK SM VA'
const FRIDAY_WEEKEND = 'AE BH DZ EG IQ IL JO KW LY OM QA SA SD SY YE'

type LocaleWithWeek = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number; weekend: number[] }
  weekInfo?: { firstDay: number; weekend: number[] }
}

const resolveLocaleTag = (locale: DateLocale | undefined): string => {
  const tags = toLocales(locale)
  const first = Array.isArray(tags) ? tags[0] : tags
  return first ?? new Intl.DateTimeFormat().resolvedOptions().locale
}

/** Week rules of `locale`: first day, minimal days of week 1 and weekend. */
export const weekInfoOf = (locale?: DateLocale): WeekInfo =>
  cached('week', locale, {}, () => {
    const intlLocale = new Intl.Locale(resolveLocaleTag(locale)) as LocaleWithWeek
    const region = intlLocale.maximize().region ?? 'US'
    // Intl dropped `minimalDays` from week info, so it always comes from CLDR here.
    const minimalDays = FOUR_DAY_WEEKS.includes(region) ? 4 : 1
    const native = intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo
    if (native && Number.isInteger(native.firstDay) && Array.isArray(native.weekend)) {
      return {
        firstDay: (native.firstDay % 7) as Weekday,
        minimalDays,
        weekend: native.weekend.map(day => (day % 7) as Weekday),
      }
    }
    const firstDay = SUNDAY_FIRST.includes(region) ? 0 : SATURDAY_FIRST.includes(region) ? 6 : 1
    const weekend: Weekday[] =
      region === 'AF'
        ? [4, 5]
        : region === 'IR'
          ? [5]
          : FRIDAY_WEEKEND.includes(region)
            ? [5, 6]
            : [6, 0]
    return { firstDay, minimalDays, weekend }
  })

export const weekRules = (options: DateOptions): { weekStart: Weekday; minimalDays: number } => {
  if (options.weekStart !== undefined && options.minimalDays !== undefined) {
    return { weekStart: options.weekStart, minimalDays: options.minimalDays }
  }
  const info = weekInfoOf(options.locale)
  return {
    weekStart: options.weekStart ?? info.firstDay,
    minimalDays: options.minimalDays ?? info.minimalDays,
  }
}

/**
 * Week number and week-year of a calendar date: week 1 is the first week
 * (starting on `weekStart`) with at least `minimalDays` days in the year.
 */
export const weekOf = (
  parts: Pick<DateParts, 'year' | 'month' | 'day' | 'weekday'>,
  weekStart: Weekday,
  minimalDays: number
): { week: number; year: number } => {
  const day = dayNumber(parts.year, parts.month, parts.day)
  const startOfWeek = day - ((parts.weekday - weekStart + 7) % 7)
  // The day that decides which year the week belongs to.
  const deciding = startOfWeek + 7 - minimalDays
  const year = new Date(deciding * MS_DAY).getUTCFullYear()
  return { week: Math.floor((deciding - dayNumber(year, 1, 1)) / 7) + 1, year }
}
