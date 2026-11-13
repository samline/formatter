import { addUnit, endOfDate, startOfDate } from './manipulate.js'
import {
  dayNumber,
  getParts,
  isLeap,
  isValid,
  monthDays,
  normalizeUnit,
  readDate,
  UNIT_MS,
  wallTime,
  weekInfoOf,
  weekOf,
  weekRules,
  type DateInput,
  type DateLocale,
  type DateOptions,
  type DateParts,
  type DateUnit,
  type WeekInfo,
} from './shared.js'

/* ------------------------------------------------------------------------ */
/* Differences                                                               */
/* ------------------------------------------------------------------------ */

export interface DiffOptions extends DateOptions {
  /** Return the exact fractional amount instead of truncating toward zero. */
  float?: boolean
}

/** Months from `b` to `a`, fractional, measured on the calendar. */
const monthsBetween = (a: Date, b: Date, options: DateOptions): number => {
  const pa = getParts(a, options.timeZone)
  const pb = getParts(b, options.timeZone)
  if (pa.day < pb.day) return -monthsBetween(b, a, options)
  const whole = (pb.year - pa.year) * 12 + (pb.month - pa.month)
  const anchor = addUnit(a, whole, 'month', options).getTime()
  const behind = b.getTime() - anchor < 0
  const anchor2 = addUnit(a, whole + (behind ? -1 : 1), 'month', options).getTime()
  const span = behind ? anchor - anchor2 : anchor2 - anchor
  return -(whole + (span === 0 ? 0 : (b.getTime() - anchor) / span)) || 0
}

/**
 * How much time is between two dates, as `a - b` in `unit`:
 * `diffDate('2026-12-24', '2026-12-20', 'day')` → `4`. Truncates toward zero
 * unless `float`. Months, quarters and years follow the calendar; days and
 * weeks count calendar days, so a daylight-saving change does not shorten them.
 */
export const diffDate = (
  a: DateInput,
  b: DateInput,
  unit: DateUnit = 'millisecond',
  options: DiffOptions = {}
): number => {
  const first = readDate(a, options.timeZone)
  const second = readDate(b, options.timeZone)
  if (!isValid(first) || !isValid(second)) return NaN
  const resolved = normalizeUnit(unit)
  let result: number
  if (resolved === 'year' || resolved === 'quarter' || resolved === 'month') {
    result =
      monthsBetween(first, second, options) /
      (resolved === 'year' ? 12 : resolved === 'quarter' ? 3 : 1)
  } else {
    let elapsed = first.getTime() - second.getTime()
    if (resolved === 'day' || resolved === 'week' || resolved === 'isoWeek') {
      const offsets =
        getParts(first, options.timeZone).offset - getParts(second, options.timeZone).offset
      elapsed += offsets * 60000
    }
    result = elapsed / (UNIT_MS[resolved] as number)
  }
  return options.float ? result : Math.trunc(result) || 0
}

/* ------------------------------------------------------------------------ */
/* Comparisons                                                               */
/* ------------------------------------------------------------------------ */

const pair = (a: DateInput, b: DateInput, options: DateOptions): [Date, Date] | undefined => {
  const first = readDate(a, options.timeZone)
  const second = readDate(b, options.timeZone)
  return isValid(first) && isValid(second) ? [first, second] : undefined
}

/** Whether `a` is before `b`; with `unit`, before the whole `unit` of `b` (`isBeforeDate(a, b, 'day')`). */
export const isBeforeDate = (
  a: DateInput,
  b: DateInput,
  unit?: DateUnit,
  options: DateOptions = {}
): boolean => {
  const dates = pair(a, b, options)
  if (!dates) return false
  return unit ? endOfDate(dates[0], unit, options) < dates[1] : dates[0] < dates[1]
}

/** Whether `a` is after `b`; with `unit`, after the whole `unit` of `b`. */
export const isAfterDate = (
  a: DateInput,
  b: DateInput,
  unit?: DateUnit,
  options: DateOptions = {}
): boolean => {
  const dates = pair(a, b, options)
  if (!dates) return false
  return unit ? dates[1] < startOfDate(dates[0], unit, options) : dates[0] > dates[1]
}

/** Whether both dates are the same instant, or fall in the same `unit` (`isSameDate(a, b, 'month')`). */
export const isSameDate = (
  a: DateInput,
  b: DateInput,
  unit?: DateUnit,
  options: DateOptions = {}
): boolean => {
  const dates = pair(a, b, options)
  if (!dates) return false
  if (!unit) return dates[0].getTime() === dates[1].getTime()
  return (
    startOfDate(dates[0], unit, options) <= dates[1] &&
    dates[1] <= endOfDate(dates[0], unit, options)
  )
}

/** `isSameDate || isBeforeDate`. */
export const isSameOrBeforeDate = (
  a: DateInput,
  b: DateInput,
  unit?: DateUnit,
  options: DateOptions = {}
): boolean => isSameDate(a, b, unit, options) || isBeforeDate(a, b, unit, options)

/** `isSameDate || isAfterDate`. */
export const isSameOrAfterDate = (
  a: DateInput,
  b: DateInput,
  unit?: DateUnit,
  options: DateOptions = {}
): boolean => isSameDate(a, b, unit, options) || isAfterDate(a, b, unit, options)

export interface BetweenOptions extends DateOptions {
  /** Compare whole units, such as `'day'`. */
  unit?: DateUnit
  /** Include the edges: `'()'` (default) excludes both, `'[]'` includes both, `'[)'` and `'(]'` one. */
  inclusivity?: '()' | '[]' | '[)' | '(]'
}

/** Whether `value` is between `from` and `to`, in either order. */
export const isBetweenDate = (
  value: DateInput,
  from: DateInput,
  to: DateInput,
  options: BetweenOptions = {}
): boolean => {
  const { unit, inclusivity = '()' } = options
  const date = readDate(value, options.timeZone)
  let start = readDate(from, options.timeZone)
  let end = readDate(to, options.timeZone)
  if (!isValid(date) || !isValid(start) || !isValid(end)) return false
  if (start > end) [start, end] = [end, start]
  const afterStart =
    inclusivity[0] === '['
      ? isSameOrAfterDate(date, start, unit, options)
      : isAfterDate(date, start, unit, options)
  const beforeEnd =
    inclusivity[1] === ']'
      ? isSameOrBeforeDate(date, end, unit, options)
      : isBeforeDate(date, end, unit, options)
  return afterStart && beforeEnd
}

const validDates = (values: DateInput[]): Date[] =>
  values.map(value => readDate(value)).filter(isValid)

/** The earliest valid date, or `undefined`. Accepts dates or one array. */
export const minDate = (...values: Array<DateInput | DateInput[]>): Date | undefined => {
  const dates = validDates(values.flat())
  return dates.length ? new Date(Math.min(...dates.map(Number))) : undefined
}

/** The latest valid date, or `undefined`. Accepts dates or one array. */
export const maxDate = (...values: Array<DateInput | DateInput[]>): Date | undefined => {
  const dates = validDates(values.flat())
  return dates.length ? new Date(Math.max(...dates.map(Number))) : undefined
}

/** `value` kept within `min` and `max` (either may be omitted). */
export const clampDate = (value: DateInput, min?: DateInput, max?: DateInput): Date => {
  const date = readDate(value)
  if (!isValid(date)) return date
  if (min !== undefined && date < readDate(min)) return readDate(min)
  if (max !== undefined && date > readDate(max)) return readDate(max)
  return date
}

/* ------------------------------------------------------------------------ */
/* Calendar facts                                                            */
/* ------------------------------------------------------------------------ */

const partsOf = (value: DateInput, options: DateOptions): DateParts | undefined => {
  const date = readDate(value, options.timeZone)
  return isValid(date) ? getParts(date, options.timeZone) : undefined
}

/** Whether a year (a number, or the year of a date) is a leap year. */
export const isLeapYear = (value: DateInput, options: DateOptions = {}): boolean => {
  if (typeof value === 'number' && Math.abs(value) < 100000) return isLeap(value)
  const parts = partsOf(value, options)
  return parts ? isLeap(parts.year) : false
}

/** Days in the month of `value` (28–31), or `NaN`. */
export const daysInMonth = (value: DateInput, options: DateOptions = {}): number => {
  const parts = partsOf(value, options)
  return parts ? monthDays(parts.year, parts.month) : NaN
}

/** Day of the year, 1–366, or `NaN`. */
export const dayOfYear = (value: DateInput, options: DateOptions = {}): number => {
  const parts = partsOf(value, options)
  return parts
    ? dayNumber(parts.year, parts.month, parts.day) - dayNumber(parts.year, 1, 1) + 1
    : NaN
}

/** Quarter of the year, 1–4, or `NaN`. */
export const quarter = (value: DateInput, options: DateOptions = {}): number => {
  const parts = partsOf(value, options)
  return parts ? Math.floor((parts.month - 1) / 3) + 1 : NaN
}

/** Week number by the locale's rules (`weekStart`, `minimalDays`), or `NaN`. */
export const weekOfYear = (value: DateInput, options: DateOptions = {}): number => {
  const parts = partsOf(value, options)
  if (!parts) return NaN
  const { weekStart, minimalDays } = weekRules(options)
  return weekOf(parts, weekStart, minimalDays).week
}

/** The year `weekOfYear` belongs to (Dec 31 can be week 1 of the next year), or `NaN`. */
export const weekYear = (value: DateInput, options: DateOptions = {}): number => {
  const parts = partsOf(value, options)
  if (!parts) return NaN
  const { weekStart, minimalDays } = weekRules(options)
  return weekOf(parts, weekStart, minimalDays).year
}

/** ISO 8601 week number (weeks start on Monday; week 1 contains January 4), or `NaN`. */
export const isoWeek = (value: DateInput, options: DateOptions = {}): number => {
  const parts = partsOf(value, options)
  return parts ? weekOf(parts, 1, 4).week : NaN
}

/** ISO 8601 week-year, or `NaN`. */
export const isoWeekYear = (value: DateInput, options: DateOptions = {}): number => {
  const parts = partsOf(value, options)
  return parts ? weekOf(parts, 1, 4).year : NaN
}

/** Number of ISO weeks (52 or 53) in a year, or in the ISO week-year of a date. */
export const isoWeeksInYear = (value: DateInput, options: DateOptions = {}): number => {
  const year =
    typeof value === 'number' && Math.abs(value) < 100000 ? value : isoWeekYear(value, options)
  if (Number.isNaN(year)) return NaN
  // December 28 is always in the last ISO week of its year.
  const weekday = new Date(wallTime(year, 12, 28)).getUTCDay() as DateParts['weekday']
  return weekOf({ year, month: 12, day: 28, weekday }, 1, 4).week
}

/** Week rules for a locale: first day, minimal days of week 1 and weekend days. */
export const getWeekInfo = (locale?: DateLocale): WeekInfo => {
  const info = weekInfoOf(locale)
  return { firstDay: info.firstDay, minimalDays: info.minimalDays, weekend: [...info.weekend] }
}

/** Whether `value` falls on the locale's weekend (Saturday and Sunday in most locales). */
export const isWeekend = (value: DateInput, options: DateOptions = {}): boolean => {
  const parts = partsOf(value, options)
  return parts ? weekInfoOf(options.locale).weekend.includes(parts.weekday) : false
}

export interface RelativeDayOptions extends DateOptions {
  /** Reference instant. Defaults to now. */
  now?: DateInput
}

const isDayFromNow = (value: DateInput, days: number, options: RelativeDayOptions): boolean => {
  const now = options.now === undefined ? new Date() : readDate(options.now, options.timeZone)
  return isSameDate(value, addUnit(now, days, 'day', options), 'day', options)
}

/** Whether `value` is today (in `timeZone`, local by default). */
export const isToday = (value: DateInput, options: RelativeDayOptions = {}): boolean =>
  isDayFromNow(value, 0, options)

/** Whether `value` is tomorrow. */
export const isTomorrow = (value: DateInput, options: RelativeDayOptions = {}): boolean =>
  isDayFromNow(value, 1, options)

/** Whether `value` is yesterday. */
export const isYesterday = (value: DateInput, options: RelativeDayOptions = {}): boolean =>
  isDayFromNow(value, -1, options)
