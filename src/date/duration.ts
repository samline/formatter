import type { DurationObject } from './manipulate.js'
import {
  cached,
  MS_DAY,
  MS_HOUR,
  MS_MINUTE,
  MS_SECOND,
  MS_WEEK,
  toLocales,
  type DateLocale,
} from './shared.js'

export type { DurationObject }

/** A duration with every field present. */
export type Duration = Required<DurationObject>

/** Milliseconds, an ISO 8601 duration (`'P1DT2H'`) or an object of units. */
export type DurationInput = number | string | DurationObject

export type DurationUnit =
  'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'

const FIELDS = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
] as const
const UNIT_OF: Record<(typeof FIELDS)[number], DurationUnit> = {
  years: 'year',
  months: 'month',
  weeks: 'week',
  days: 'day',
  hours: 'hour',
  minutes: 'minute',
  seconds: 'second',
  milliseconds: 'millisecond',
}

const MS_YEAR = 365.2425 * MS_DAY // average Gregorian year
const UNIT_MS: Record<DurationUnit, number> = {
  year: MS_YEAR,
  month: MS_YEAR / 12,
  week: MS_WEEK,
  day: MS_DAY,
  hour: MS_HOUR,
  minute: MS_MINUTE,
  second: MS_SECOND,
  millisecond: 1,
}

const ISO =
  /^([+-])?P(?!$)(?:(\d+(?:[.,]\d+)?)Y)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)W)?(?:(\d+(?:[.,]\d+)?)D)?(?:T(?!$)(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)S)?)?$/i

const zero = (): Duration => ({
  years: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
})

/**
 * A complete duration from milliseconds, an ISO 8601 string or an object.
 * Milliseconds are split into days, hours, minutes, seconds and
 * milliseconds (never months, whose length varies). `undefined` when the
 * input cannot be read.
 */
export const createDuration = (input: DurationInput): Duration | undefined => {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) return undefined
    const sign = input < 0 ? -1 : 1
    let rest = Math.abs(input)
    const duration = zero()
    duration.days = Math.floor(rest / MS_DAY)
    rest -= duration.days * MS_DAY
    duration.hours = Math.floor(rest / MS_HOUR)
    rest -= duration.hours * MS_HOUR
    duration.minutes = Math.floor(rest / MS_MINUTE)
    rest -= duration.minutes * MS_MINUTE
    duration.seconds = Math.floor(rest / MS_SECOND)
    duration.milliseconds = Math.round(rest - duration.seconds * MS_SECOND)
    for (const field of FIELDS) duration[field] = duration[field] * sign || 0
    return duration
  }
  if (typeof input === 'string') {
    const match = ISO.exec(input.trim())
    if (!match) return undefined
    const sign = match[1] === '-' ? -1 : 1
    const [years, months, weeks, days, hours, minutes, seconds] = match
      .slice(2)
      .map(value => (value === undefined ? 0 : Number(value.replace(',', '.')) * sign))
    const whole = Math.trunc(seconds ?? 0)
    return {
      years: years ?? 0,
      months: months ?? 0,
      weeks: weeks ?? 0,
      days: days ?? 0,
      hours: hours ?? 0,
      minutes: minutes ?? 0,
      seconds: whole || 0,
      milliseconds: Math.round(((seconds ?? 0) - whole) * 1000) || 0,
    }
  }
  if (input === null || typeof input !== 'object') return undefined
  const duration = zero()
  for (const field of FIELDS) {
    const value = input[field]
    if (value === undefined) continue
    if (!Number.isFinite(value)) return undefined
    duration[field] = value
  }
  return duration
}

/**
 * The total of a duration in `unit`: `durationAs({ hours: 36 }, 'day')` →
 * `1.5`. Months and years use the average Gregorian length (30.44 and
 * 365.2425 days). `NaN` for an unreadable input.
 */
export const durationAs = (input: DurationInput, unit: DurationUnit = 'millisecond'): number => {
  const duration = createDuration(input)
  if (!duration) return NaN
  const total = FIELDS.reduce((sum, field) => sum + duration[field] * UNIT_MS[UNIT_OF[field]], 0)
  return total / UNIT_MS[unit]
}

/** ISO 8601 form: `durationToISO({ days: 1, hours: 2 })` → `'P1DT2H'`. Empty durations are `'PT0S'`. */
export const durationToISO = (input: DurationInput): string => {
  const duration = createDuration(input)
  if (!duration) return ''
  const values = FIELDS.map(field => duration[field])
  const negative = values.some(value => value < 0) && values.every(value => value <= 0)
  const value = (field: (typeof FIELDS)[number]): number =>
    negative ? -duration[field] : duration[field]
  const seconds = value('seconds') + value('milliseconds') / 1000
  const date = `${value('years') ? `${value('years')}Y` : ''}${value('months') ? `${value('months')}M` : ''}${
    value('weeks') ? `${value('weeks')}W` : ''
  }${value('days') ? `${value('days')}D` : ''}`
  const time = `${value('hours') ? `${value('hours')}H` : ''}${value('minutes') ? `${value('minutes')}M` : ''}${
    seconds ? `${Number(seconds.toFixed(3))}S` : ''
  }`
  if (!date && !time) return 'PT0S'
  return `${negative ? '-' : ''}P${date}${time ? `T${time}` : ''}`
}

export interface FormatDurationOptions {
  locale?: DateLocale
  /** `'long'` ("1 hour, 30 minutes"), `'short'` ("1 hr, 30 min"), `'narrow'` ("1h 30m") or `'digital'` ("1:30:00"). */
  style?: 'long' | 'short' | 'narrow' | 'digital'
  /** Returned when the duration cannot be read. Defaults to `''`. */
  fallback?: string
}

type ListFormatLike = { format: (items: string[]) => string }
type ListFormatConstructor = new (
  locale: string | string[] | undefined,
  options: object
) => ListFormatLike

const joinList = (
  items: string[],
  locale: DateLocale | undefined,
  style: 'long' | 'short' | 'narrow'
): string => {
  const ListFormat = (Intl as unknown as { ListFormat?: ListFormatConstructor }).ListFormat
  if (!ListFormat) return items.join(style === 'narrow' ? ' ' : ', ')
  return cached(
    'list',
    locale,
    { style },
    () => new ListFormat(toLocales(locale), { type: 'unit', style })
  ).format(items)
}

const unitFormat = (
  locale: DateLocale | undefined,
  unit: DurationUnit,
  display: 'long' | 'short' | 'narrow'
): Intl.NumberFormat => {
  const options = {
    style: 'unit',
    unit,
    unitDisplay: display,
    maximumFractionDigits: 3,
  } as Intl.NumberFormatOptions
  return cached('unit', locale, options, () => new Intl.NumberFormat(toLocales(locale), options))
}

/**
 * Show a duration in words: `formatDuration({ hours: 1, minutes: 30 }, { locale: 'es-MX' })`
 * → `'1 hora, 30 minutos'`, or as a clock with `style: 'digital'` (`'1:30:00'`).
 * Zero fields are left out.
 */
export const formatDuration = (
  input: DurationInput,
  options: FormatDurationOptions = {}
): string => {
  const { locale, style = 'long', fallback = '' } = options
  const duration = createDuration(input)
  if (!duration) return fallback
  if (style === 'digital') {
    const total = Math.abs(durationAs(duration, 'millisecond'))
    const sign = durationAs(duration, 'millisecond') < 0 ? '-' : ''
    const hours = Math.floor(total / MS_HOUR)
    const minutes = Math.floor((total % MS_HOUR) / MS_MINUTE)
    const seconds = Math.floor((total % MS_MINUTE) / MS_SECOND)
    const number = cached(
      'digits',
      locale,
      {},
      () => new Intl.NumberFormat(toLocales(locale), { useGrouping: false })
    )
    const two = cached(
      'two',
      locale,
      {},
      () => new Intl.NumberFormat(toLocales(locale), { minimumIntegerDigits: 2 })
    )
    return `${sign}${number.format(hours)}:${two.format(minutes)}:${two.format(seconds)}`
  }
  const items = FIELDS.filter(field => duration[field] !== 0).map(field =>
    unitFormat(locale, UNIT_OF[field], style).format(duration[field])
  )
  return items.length
    ? joinList(items, locale, style)
    : unitFormat(locale, 'second', style).format(0)
}

/**
 * Show a duration with tokens: `formatDurationPattern(duration, 'HH:mm:ss')`.
 * Tokens: `Y`, `M`, `W`, `D`, `H`/`HH`, `m`/`mm`, `s`/`ss`, `SSS`; `[text]`
 * is printed as is. Each token prints its own field.
 */
export const formatDurationPattern = (
  input: DurationInput,
  pattern: string,
  fallback = ''
): string => {
  const duration = createDuration(input)
  if (!duration) return fallback
  const pad = (value: number, length: number): string => {
    const text = String(Math.abs(Math.trunc(value))).padStart(length, '0')
    return value < 0 ? `-${text}` : text
  }
  const values: Record<string, string> = {
    Y: String(duration.years),
    M: String(duration.months),
    W: String(duration.weeks),
    D: String(duration.days),
    HH: pad(duration.hours, 2),
    H: String(duration.hours),
    mm: pad(duration.minutes, 2),
    m: String(duration.minutes),
    ss: pad(duration.seconds, 2),
    s: String(duration.seconds),
    SSS: pad(duration.milliseconds, 3),
  }
  return pattern.replace(
    /\[([^\]]*)]|SSS|HH|mm|ss|[YMWDHms]/g,
    (match, literal: string | undefined) =>
      literal !== undefined ? literal : (values[match] ?? match)
  )
}

const HUMAN_UNITS: DurationUnit[] = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second']

export interface HumanizeDurationOptions {
  locale?: DateLocale
  /** `'in 3 days'` / `'3 days ago'` instead of `'3 days'`. */
  withSuffix?: boolean
  style?: 'long' | 'short' | 'narrow'
  /** Returned when the duration cannot be read. Defaults to `''`. */
  fallback?: string
}

/**
 * The duration rounded to its largest unit: `humanizeDuration({ minutes: 90 })`
 * → `'2 hours'`; with `withSuffix`, `'in 2 hours'` (negative: `'2 hours ago'`).
 */
export const humanizeDuration = (
  input: DurationInput,
  options: HumanizeDurationOptions = {}
): string => {
  const { locale, withSuffix = false, style = 'long', fallback = '' } = options
  const total = durationAs(input, 'millisecond')
  if (Number.isNaN(total)) return fallback
  const unit = HUMAN_UNITS.find(candidate => Math.abs(total) >= UNIT_MS[candidate]) ?? 'second'
  const amount = Math.round(total / UNIT_MS[unit]) || 0
  if (withSuffix) {
    const options = { numeric: 'always', style } as Intl.RelativeTimeFormatOptions
    return cached(
      'relative-always',
      locale,
      options,
      () => new Intl.RelativeTimeFormat(toLocales(locale), options)
    ).format(amount, unit as Intl.RelativeTimeFormatUnit)
  }
  return unitFormat(locale, unit, style).format(Math.abs(amount))
}
