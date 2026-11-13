import {
  fromParts,
  getParts,
  invalidDate,
  isValid,
  readDate,
  type DateInput,
  type DateParts,
} from './shared.js'

export interface ZoneOptions {
  /** IANA time zone such as `'America/Cancun'` or `'UTC'`. Defaults to the runtime zone. */
  timeZone?: string
}

/** The runtime's IANA time zone, such as `'America/Mexico_City'`. */
export const getTimeZone = (): string => new Intl.DateTimeFormat().resolvedOptions().timeZone

/**
 * Minutes east of UTC at `value` in `timeZone` (local by default):
 * `-360` for Mexico City, `60` for Madrid in winter. `NaN` for an invalid date.
 */
export const getTimeZoneOffset = (
  value: DateInput = new Date(),
  options: ZoneOptions = {}
): number => {
  const date = readDate(value, options.timeZone)
  return isValid(date) ? getParts(date, options.timeZone).offset : NaN
}

/**
 * The wall clock of `value` in `timeZone` (local by default): `year`,
 * `month` (1–12), `day`, `hour`, `minute`, `second`, `millisecond`,
 * `weekday` (0 Sunday – 6) and `offset` (minutes east of UTC). `undefined`
 * for an invalid date.
 */
export const getDateParts = (
  value: DateInput,
  options: ZoneOptions = {}
): DateParts | undefined => {
  const date = readDate(value, options.timeZone)
  return isValid(date) ? getParts(date, options.timeZone) : undefined
}

export interface DatePartsInput {
  year: number
  /** 1–12. Defaults to 1. */
  month?: number
  /** Defaults to 1. */
  day?: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
}

/**
 * The instant of a wall clock in `timeZone` (local by default):
 * `createDate({ year: 2026, month: 12, day: 24, hour: 20 }, { timeZone: 'America/Cancun' })`.
 * Out-of-range fields roll over like `Date` (`month: 13` → January of the
 * next year). A time skipped by daylight saving moves forward by the jump;
 * a repeated time resolves to the earlier instant.
 */
export const createDate = (parts: DatePartsInput, options: ZoneOptions = {}): Date => {
  const values = [
    parts.year,
    parts.month,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  ]
  if (values.some(value => value !== undefined && !Number.isFinite(value))) return invalidDate()
  return fromParts({ ...parts, month: parts.month ?? 1, day: parts.day ?? 1 }, options.timeZone)
}

/** A `Date` from Unix seconds (fractions keep milliseconds). */
export const fromUnix = (seconds: number): Date => new Date(seconds * 1000)

/** Unix seconds of `value`, rounded down, or `NaN`. */
export const toUnix = (value: DateInput, options: ZoneOptions = {}): number => {
  const date = readDate(value, options.timeZone)
  return isValid(date) ? Math.floor(date.getTime() / 1000) : NaN
}
