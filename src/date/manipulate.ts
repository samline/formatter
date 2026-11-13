import {
  fromParts,
  getParts,
  invalidDate,
  isValid,
  monthDays,
  normalizeUnit,
  readDate,
  UNIT_MS,
  weekRules,
  type DateInput,
  type DateOptions,
  type DateParts,
  type DateUnit,
  type Weekday,
} from './shared.js'

/** An amount of time by unit. Any field may be negative or fractional below a day. */
export interface DurationObject {
  years?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
  milliseconds?: number
}

const withCalendar = (
  date: Date,
  options: DateOptions,
  change: (parts: DateParts) => void
): Date => {
  const parts = getParts(date, options.timeZone)
  change(parts)
  return fromParts(parts, options.timeZone)
}

/** Move `months` months, keeping the day inside the target month (Jan 31 + 1 month → Feb 28/29). */
const shiftMonths = (date: Date, months: number, options: DateOptions): Date =>
  withCalendar(date, options, parts => {
    const index = parts.year * 12 + parts.month - 1 + Math.trunc(months)
    parts.year = Math.floor(index / 12)
    parts.month = index - parts.year * 12 + 1
    parts.day = Math.min(parts.day, monthDays(parts.year, parts.month))
  })

const addUnit = (date: Date, amount: number, unit: DateUnit, options: DateOptions): Date => {
  if (!isValid(date) || !Number.isFinite(amount)) return invalidDate()
  switch (unit) {
    case 'year':
      return shiftMonths(date, amount * 12, options)
    case 'quarter':
      return shiftMonths(date, amount * 3, options)
    case 'month':
      return shiftMonths(date, amount, options)
    case 'week':
    case 'isoWeek':
    case 'day': {
      // Calendar days: 09:00 stays 09:00 across a daylight-saving change.
      const days = Math.trunc(amount) * (unit === 'day' ? 1 : 7)
      return withCalendar(date, options, parts => {
        parts.day += days
      })
    }
    default:
      // Hours and smaller are exact elapsed time.
      return new Date(date.getTime() + amount * (UNIT_MS[unit] as number))
  }
}

const applyDuration = (
  date: Date,
  duration: DurationObject,
  sign: 1 | -1,
  options: DateOptions
): Date => {
  const {
    years = 0,
    months = 0,
    weeks = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
  } = duration
  let result = addUnit(date, sign * (years * 12 + months), 'month', options)
  result = addUnit(result, sign * (weeks * 7 + days), 'day', options)
  return addUnit(
    result,
    sign * (((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds),
    'millisecond',
    options
  )
}

/**
 * Add time: `addDate(date, 3, 'day')` or `addDate(date, { months: 1, days: 2 })`.
 * Years, quarters, months, weeks and days follow the calendar (Jan 31 + 1
 * month → Feb 28/29, and 09:00 stays 09:00 across a daylight-saving change);
 * hours and smaller are exact elapsed time. Returns a new `Date`.
 */
export function addDate(
  value: DateInput,
  amount: number,
  unit: DateUnit,
  options?: DateOptions
): Date
export function addDate(value: DateInput, duration: DurationObject, options?: DateOptions): Date
export function addDate(
  value: DateInput,
  amount: number | DurationObject,
  unitOrOptions?: DateUnit | DateOptions,
  maybeOptions: DateOptions = {}
): Date {
  if (typeof amount === 'number') {
    const options = maybeOptions
    return addUnit(
      readDate(value, options.timeZone),
      amount,
      normalizeUnit(unitOrOptions as string),
      options
    )
  }
  const options = (unitOrOptions as DateOptions | undefined) ?? {}
  return applyDuration(readDate(value, options.timeZone), amount, 1, options)
}

/** Subtract time; the opposite of `addDate`. */
export function subtractDate(
  value: DateInput,
  amount: number,
  unit: DateUnit,
  options?: DateOptions
): Date
export function subtractDate(
  value: DateInput,
  duration: DurationObject,
  options?: DateOptions
): Date
export function subtractDate(
  value: DateInput,
  amount: number | DurationObject,
  unitOrOptions?: DateUnit | DateOptions,
  maybeOptions: DateOptions = {}
): Date {
  if (typeof amount === 'number') {
    const options = maybeOptions
    return addUnit(
      readDate(value, options.timeZone),
      -amount,
      normalizeUnit(unitOrOptions as string),
      options
    )
  }
  const options = (unitOrOptions as DateOptions | undefined) ?? {}
  return applyDuration(readDate(value, options.timeZone), amount, -1, options)
}

/** Move `parts` to the start of `unit`. */
export const floorParts = (parts: DateParts, unit: DateUnit, options: DateOptions): void => {
  switch (unit) {
    case 'year':
    case 'quarter':
    case 'month':
      if (unit === 'year') parts.month = 1
      if (unit === 'quarter') parts.month = Math.floor((parts.month - 1) / 3) * 3 + 1
      parts.day = 1
      break
    case 'week':
    case 'isoWeek': {
      const weekStart: Weekday = unit === 'isoWeek' ? 1 : weekRules(options).weekStart
      parts.day -= (parts.weekday - weekStart + 7) % 7
      break
    }
    default:
  }
  if (unit === 'millisecond') return
  parts.millisecond = 0
  if (unit === 'second') return
  parts.second = 0
  if (unit === 'minute') return
  parts.minute = 0
  if (unit === 'hour') return
  parts.hour = 0
}

/** The first instant of `unit` that contains `value` (`'week'` uses the locale's first day). */
export const startOfDate = (value: DateInput, unit: DateUnit, options: DateOptions = {}): Date => {
  const date = readDate(value, options.timeZone)
  if (!isValid(date)) return date
  const resolved = normalizeUnit(unit)
  if (resolved === 'millisecond') return date
  // Below a day there are no wall-clock surprises: round the instant.
  if (resolved === 'hour' || resolved === 'minute' || resolved === 'second') {
    const step = UNIT_MS[resolved] as number
    const offset = getParts(date, options.timeZone).offset * 60000
    return new Date(Math.floor((date.getTime() + offset) / step) * step - offset)
  }
  return withCalendar(date, options, parts => floorParts(parts, resolved, options))
}

/** The last millisecond of `unit` that contains `value`. */
export const endOfDate = (value: DateInput, unit: DateUnit, options: DateOptions = {}): Date => {
  const resolved = normalizeUnit(unit)
  if (resolved === 'millisecond') return readDate(value, options.timeZone)
  const start = startOfDate(value, resolved, options)
  return new Date(addUnit(start, 1, resolved, options).getTime() - 1)
}

/** Units `setDateUnit` can change. */
export type DateSetUnit =
  | 'year'
  | 'quarter'
  | 'month'
  | 'day'
  | 'weekday'
  | 'isoWeekday'
  | 'dayOfYear'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'

/**
 * Return a copy with one part set: `setDateUnit(date, 'month', 2)`. `month`
 * is 1–12 and keeps the day inside it; `weekday` is 0 (Sunday) – 6 and
 * `isoWeekday` 1 (Monday) – 7, both within the same week; out-of-range
 * values roll over (`'day', 32` → next month).
 */
export const setDateUnit = (
  value: DateInput,
  unit: DateSetUnit,
  amount: number,
  options: DateOptions = {}
): Date => {
  const date = readDate(value, options.timeZone)
  if (!isValid(date) || !Number.isFinite(amount)) return invalidDate()
  return withCalendar(date, options, parts => {
    switch (unit) {
      case 'year':
        parts.year = amount
        parts.day = Math.min(parts.day, monthDays(parts.year, parts.month))
        break
      case 'quarter':
      case 'month': {
        const month = unit === 'quarter' ? (amount - 1) * 3 + ((parts.month - 1) % 3) + 1 : amount
        const index = parts.year * 12 + month - 1
        parts.year = Math.floor(index / 12)
        parts.month = index - parts.year * 12 + 1
        parts.day = Math.min(parts.day, monthDays(parts.year, parts.month))
        break
      }
      case 'day':
        parts.day = amount
        break
      case 'weekday':
        parts.day += amount - parts.weekday
        break
      case 'isoWeekday':
        parts.day += amount - (parts.weekday || 7)
        break
      case 'dayOfYear':
        parts.month = 1
        parts.day = amount
        break
      case 'hour':
        parts.hour = amount
        break
      case 'minute':
        parts.minute = amount
        break
      case 'second':
        parts.second = amount
        break
      case 'millisecond':
        parts.millisecond = amount
        break
      default:
        throw new RangeError(`Unknown date unit: ${String(unit)}`)
    }
  })
}

export { addUnit }
