import {
  dayPeriods,
  monthNames,
  ordinal,
  timeZoneName,
  weekdayMinNames,
  weekdayNames,
} from './names.js'
import {
  cached,
  dateTimeFormat,
  dayNumber,
  getParts,
  isEmpty,
  isValid,
  readDate,
  toLocales,
  weekOf,
  weekRules,
  type DateInput,
  type DateLocale,
  type DateOptions,
  type DateParts,
} from './shared.js'

/**
 * Tokens, longest first. `[text]` is printed as is. Shared with `parseDate`.
 */
export const TOKENS =
  /\[([^\]]*)]|YYYY|YY|Q|MMMM|MMM|MM|M|Do|DDDD|DDD|DD|D|dddd|ddd|dd|d|E|e|ww|w|WW|W|gggg|GGGG|HH|H|hh|h|kk|k|mm|m|ss|s|SSS|SS|S|A|a|X|x|ZZ|Z|zzz|z|LTS|LT|LLLL|LLL|LL|L|llll|lll|ll|l/g

export interface FormatDatePatternOptions extends DateOptions {
  /** Returned when the value cannot be read as a date. Defaults to `''`. */
  fallback?: string
}

const pad = (value: number, length: number): string => {
  const text = String(Math.abs(Math.trunc(value))).padStart(length, '0')
  return value < 0 ? `-${text}` : text
}

const offsetText = (minutes: number, separator: string): string => {
  const sign = minutes < 0 ? '-' : '+'
  const absolute = Math.abs(minutes)
  return `${sign}${pad(Math.floor(absolute / 60), 2)}${separator}${pad(absolute % 60, 2)}`
}

const LOCALIZED: Record<string, Intl.DateTimeFormatOptions> = {
  LT: { hour: 'numeric', minute: '2-digit' },
  LTS: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
  L: { year: 'numeric', month: '2-digit', day: '2-digit' },
  l: { year: 'numeric', month: 'numeric', day: 'numeric' },
  LL: { year: 'numeric', month: 'long', day: 'numeric' },
  ll: { year: 'numeric', month: 'short', day: 'numeric' },
  LLL: { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  lll: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  LLLL: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
  llll: {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
}

const localized = (
  token: string,
  time: number,
  locale: DateLocale | undefined,
  timeZone: string | undefined
): string =>
  dateTimeFormat(locale, { ...LOCALIZED[token], ...(timeZone ? { timeZone } : {}) }).format(time)

const renderToken = (
  token: string,
  date: Date,
  parts: DateParts,
  options: DateOptions,
  monthContext: 'format' | 'standalone'
): string => {
  const { locale, timeZone } = options
  switch (token) {
    case 'YYYY':
      return pad(parts.year, 4)
    case 'YY':
      return pad(((parts.year % 100) + 100) % 100, 2)
    case 'Q':
      return String(Math.floor((parts.month - 1) / 3) + 1)
    case 'MMMM':
      return monthNames(locale, 'long', monthContext)[parts.month - 1] ?? ''
    case 'MMM':
      return monthNames(locale, 'short', monthContext)[parts.month - 1] ?? ''
    case 'MM':
      return pad(parts.month, 2)
    case 'M':
      return String(parts.month)
    case 'Do':
      return ordinal(parts.day, locale)
    case 'DDDD':
    case 'DDD': {
      const day = dayNumber(parts.year, parts.month, parts.day) - dayNumber(parts.year, 1, 1) + 1
      return token === 'DDDD' ? pad(day, 3) : String(day)
    }
    case 'DD':
      return pad(parts.day, 2)
    case 'D':
      return String(parts.day)
    case 'dddd':
      return weekdayNames(locale, 'long')[parts.weekday] ?? ''
    case 'ddd':
      return weekdayNames(locale, 'short')[parts.weekday] ?? ''
    case 'dd':
      return weekdayMinNames(locale)[parts.weekday] ?? ''
    case 'd':
      return String(parts.weekday)
    case 'E':
      return String(parts.weekday || 7)
    case 'e':
      return String((parts.weekday - weekRules(options).weekStart + 7) % 7)
    case 'w':
    case 'ww':
    case 'gggg': {
      const { weekStart, minimalDays } = weekRules(options)
      const week = weekOf(parts, weekStart, minimalDays)
      return token === 'gggg'
        ? pad(week.year, 4)
        : token === 'ww'
          ? pad(week.week, 2)
          : String(week.week)
    }
    case 'W':
    case 'WW':
    case 'GGGG': {
      const week = weekOf(parts, 1, 4)
      return token === 'GGGG'
        ? pad(week.year, 4)
        : token === 'WW'
          ? pad(week.week, 2)
          : String(week.week)
    }
    case 'HH':
      return pad(parts.hour, 2)
    case 'H':
      return String(parts.hour)
    case 'hh':
      return pad(parts.hour % 12 || 12, 2)
    case 'h':
      return String(parts.hour % 12 || 12)
    case 'kk':
      return pad(parts.hour || 24, 2)
    case 'k':
      return String(parts.hour || 24)
    case 'mm':
      return pad(parts.minute, 2)
    case 'm':
      return String(parts.minute)
    case 'ss':
      return pad(parts.second, 2)
    case 's':
      return String(parts.second)
    case 'SSS':
      return pad(parts.millisecond, 3)
    case 'SS':
      return pad(Math.floor(parts.millisecond / 10), 2)
    case 'S':
      return String(Math.floor(parts.millisecond / 100))
    case 'A':
    case 'a': {
      const period = dayPeriods(locale)[parts.hour < 12 ? 0 : 1]
      return token === 'A'
        ? period.toLocaleUpperCase(toTag(locale))
        : period.toLocaleLowerCase(toTag(locale))
    }
    case 'X':
      return String(Math.floor(date.getTime() / 1000))
    case 'x':
      return String(date.getTime())
    case 'Z':
      return offsetText(parts.offset, ':')
    case 'ZZ':
      return offsetText(parts.offset, '')
    case 'z':
    case 'zzz':
      return timeZoneName(date.getTime(), locale, timeZone, token === 'zzz')
    default:
      return localized(token, date.getTime(), locale, timeZone)
  }
}

const toTag = (locale: DateLocale | undefined): string | undefined =>
  locale === undefined ? undefined : typeof locale === 'string' ? locale : locale[0]

/** Months next to a day number use the "format" form ("12 ноября"); alone, the "standalone" form. */
const monthContextOf = (pattern: string): 'format' | 'standalone' =>
  /D/.test(pattern.replace(/\[[^\]]*]/g, '')) ? 'format' : 'standalone'

/**
 * Format a date with tokens: `formatDatePattern(date, 'DD/MM/YYYY')` →
 * `'12/11/2026'`, `formatDatePattern(date, 'dddd D [de] MMMM', { locale: 'es-MX' })`
 * → `'jueves 12 de noviembre'`. Names come from `Intl`, so every locale
 * works. Wrap text in `[brackets]` to print it as is. `null`, `undefined`
 * and `''` return `''`; unreadable values return `fallback`.
 */
export const formatDatePattern = (
  value: DateInput | null | undefined,
  pattern = 'YYYY-MM-DDTHH:mm:ssZ',
  options: FormatDatePatternOptions = {}
): string => {
  const { fallback = '' } = options
  if (isEmpty(value)) return ''
  const date = readDate(value, options.timeZone)
  if (!isValid(date)) return fallback
  const parts = getParts(date, options.timeZone)
  const monthContext = monthContextOf(pattern)
  return pattern.replace(TOKENS, (match: string, literal: string | undefined) =>
    literal !== undefined ? literal : renderToken(match, date, parts, options, monthContext)
  )
}

export interface CalendarOptions extends FormatDatePatternOptions {
  /** Reference instant. Defaults to now. */
  now?: DateInput
  /** Pattern for dates outside yesterday … six days ahead. Defaults to `'L'` (the locale's numeric date). */
  sameElse?: string
}

const capitalize = (text: string, locale: DateLocale | undefined): string =>
  text.charAt(0).toLocaleUpperCase(toTag(locale)) + text.slice(1)

/** The words a locale puts between a date and its time (`' at '` in English, `', '` in Spanish). */
const connector = (locale: DateLocale | undefined, timeZone: string | undefined): string => {
  const parts = dateTimeFormat(locale, {
    dateStyle: 'full',
    timeStyle: 'short',
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(Date.UTC(2021, 7, 15, 12))
  const timeIndex = parts.findIndex(part => part.type === 'hour' || part.type === 'dayPeriod')
  const literal = timeIndex > 0 ? parts[timeIndex - 1] : undefined
  return literal?.type === 'literal' ? literal.value : ' '
}

/**
 * A calendar-style label: `'Today at 3:30 PM'`, `'Tomorrow at 9:00 AM'`,
 * `'Friday at 10:00 AM'` for the next six days, and `sameElse` (the
 * locale's numeric date) otherwise. Words come from `Intl`, in any locale
 * (`'Mañana, 9:00 a.m.'` in `es-MX`).
 */
export const formatCalendar = (
  value: DateInput | null | undefined,
  options: CalendarOptions = {}
): string => {
  const { locale, timeZone, fallback = '', sameElse = 'L' } = options
  if (isEmpty(value)) return ''
  const date = readDate(value, timeZone)
  const now = options.now === undefined ? new Date() : readDate(options.now, timeZone)
  if (!isValid(date) || !isValid(now)) return fallback
  const day = getParts(date, timeZone)
  const today = getParts(now, timeZone)
  const days =
    dayNumber(day.year, day.month, day.day) - dayNumber(today.year, today.month, today.day)
  if (days < -1 || days > 6) return formatDatePattern(date, sameElse, options)
  const label =
    days <= 1
      ? cached(
          'relative',
          locale,
          {},
          () => new Intl.RelativeTimeFormat(toLocales(locale), { numeric: 'auto' })
        ).format(days, 'day')
      : (weekdayNames(locale, 'long')[day.weekday] ?? '')
  return (
    capitalize(label, locale) +
    connector(locale, timeZone) +
    localized('LT', date.getTime(), locale, timeZone)
  )
}
