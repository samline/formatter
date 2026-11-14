import type { DatePatternType, DateUnit } from '../core/engine/types.js'

/**
 * Display helpers built on the native `Intl` APIs. They never throw for bad
 * *values*: `null`, `undefined` and `''` return `''`, and anything that cannot
 * be read as a number or date returns `fallback` (default `''`). Invalid
 * *options* (an unknown currency or time zone) still throw, like `Intl` does.
 */

export type IntlLocale = string | readonly string[]

export interface IntlCommonOptions {
  /** BCP 47 locale(s). Defaults to the runtime locale. */
  locale?: IntlLocale
  /** Returned when the value cannot be parsed. Defaults to `''`. */
  fallback?: string
}

type IntlNumberBase = Omit<
  Intl.NumberFormatOptions,
  'style' | 'currency' | 'currencyDisplay' | 'currencySign' | 'unit' | 'unitDisplay'
>

interface DecimalOptions {
  /** Exact number of fraction digits (sets both minimum and maximum). */
  decimals?: number
  /** `minimumFractionDigits`. */
  minDecimals?: number
  /** `maximumFractionDigits`. */
  maxDecimals?: number
}

export interface IntlNumberOptions extends IntlCommonOptions, IntlNumberBase, DecimalOptions {}

export interface IntlCurrencyOptions extends IntlCommonOptions, IntlNumberBase, DecimalOptions {
  /** ISO 4217 code such as `'MXN'` or `'USD'`. */
  currency: string
  /** How the currency is shown. Defaults to `'symbol'`. */
  display?: 'symbol' | 'narrowSymbol' | 'code' | 'name'
  /** `'accounting'` wraps negative amounts in parentheses in many locales. */
  currencySign?: 'standard' | 'accounting'
}

export interface IntlPercentOptions extends IntlCommonOptions, IntlNumberBase, DecimalOptions {}

export type IntlDatePreset = 'short' | 'medium' | 'long' | 'full'

export interface IntlDateOptions extends IntlCommonOptions, Intl.DateTimeFormatOptions {
  /**
   * `dateStyle` shortcut. Used only when no component option (`year`,
   * `month`, `weekday`, `hour`…) is given. Defaults to `'medium'`.
   */
  preset?: IntlDatePreset
  /**
   * Segment order used to read digit strings such as `'2026-11-12'`,
   * `'20261112'` or `'12/11/2026'`. Defaults to formatter's raw date
   * pattern, `['Y', 'm', 'd']`.
   */
  pattern?: DatePatternType
}

export type IntlRelativeTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

export interface IntlRelativeTimeOptions extends IntlCommonOptions {
  /** Reference instant. Defaults to `Date.now()` at call time. */
  now?: Date | number | string
  /** Defaults to `'long'`. */
  style?: 'long' | 'short' | 'narrow'
  /** `'auto'` (default) allows words such as "yesterday" or "now". */
  numeric?: 'auto' | 'always'
  /** Force a unit instead of picking the largest one that fits. */
  unit?: IntlRelativeTimeUnit
  /** Segment order for digit-only date strings; see `IntlDateOptions.pattern`. */
  pattern?: DatePatternType
}

export type IntlNumberInput = number | bigint | string | null | undefined
export type IntlDateInput = Date | number | string | null | undefined

/* ------------------------------------------------------------------------ */
/* Cached Intl instances                                                     */
/* ------------------------------------------------------------------------ */

const CACHE_LIMIT = 64
const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>()

const cached = <T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
  kind: string,
  locale: IntlLocale | undefined,
  options: object,
  create: () => T
): T => {
  const key = JSON.stringify([kind, locale ?? null, options])
  const hit = cache.get(key)
  if (hit) return hit as T
  const instance = create()
  // A small bound keeps long-running pages from growing the cache forever.
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(key, instance)
  return instance
}

const toLocales = (locale: IntlLocale | undefined): string | string[] | undefined =>
  locale === undefined ? undefined : typeof locale === 'string' ? locale : [...locale]

/** Drop `undefined` so options compare equal in the cache key and satisfy Intl. */
const compact = <T extends object>(options: T): T =>
  Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined)) as T

/* ------------------------------------------------------------------------ */
/* Numbers                                                                   */
/* ------------------------------------------------------------------------ */

const NUMERIC_STRING = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i

const isEmpty = (value: unknown): boolean => value === null || value === undefined || value === ''

/** Read a number, bigint or a dot-decimal numeric string (formatter's numeral `raw`). */
const toNumber = (value: number | bigint | string): number | bigint | undefined => {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value
  const trimmed = value.trim()
  return NUMERIC_STRING.test(trimmed) ? Number(trimmed) : undefined
}

const splitNumberOptions = <T extends IntlCommonOptions & DecimalOptions>(options: T) => {
  const { locale, fallback = '', decimals, minDecimals, maxDecimals, ...rest } = options
  const digits =
    decimals !== undefined
      ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
      : { minimumFractionDigits: minDecimals, maximumFractionDigits: maxDecimals }
  return { locale, fallback, rest, digits }
}

const formatWithNumberFormat = (
  value: IntlNumberInput,
  locale: IntlLocale | undefined,
  fallback: string,
  options: Intl.NumberFormatOptions
): string => {
  if (isEmpty(value)) return ''
  const number = toNumber(value as number | bigint | string)
  if (number === undefined) return fallback
  const resolved = compact(options)
  return cached(
    'number',
    locale,
    resolved,
    () => new Intl.NumberFormat(toLocales(locale), resolved)
  ).format(number)
}

/**
 * Format a number for display: `formatNumber(1234.5, { locale: 'es-MX', decimals: 2 })` → `'1,234.50'`.
 * Accepts numbers, bigints and numeric strings such as formatter's numeral `raw`.
 */
export const formatNumber = (value: IntlNumberInput, options: IntlNumberOptions = {}): string => {
  const { locale, fallback, rest, digits } = splitNumberOptions(options)
  return formatWithNumberFormat(value, locale, fallback, { ...rest, ...digits, style: 'decimal' })
}

/** Format an amount of money: `formatCurrency(1234.5, { locale: 'es-MX', currency: 'MXN' })` → `'$1,234.50'`. */
export const formatCurrency = (value: IntlNumberInput, options: IntlCurrencyOptions): string => {
  if (!options || typeof options.currency !== 'string' || options.currency === '') {
    throw new TypeError("formatCurrency() requires a `currency` code, e.g. { currency: 'MXN' }.")
  }
  const { currency, display = 'symbol', currencySign, ...numberOptions } = options
  const { locale, fallback, rest, digits } = splitNumberOptions(numberOptions)
  return formatWithNumberFormat(value, locale, fallback, {
    ...rest,
    ...digits,
    style: 'currency',
    currency,
    currencyDisplay: display,
    currencySign,
  })
}

/** Format a ratio as a percentage: `formatPercent(0.256, { decimals: 1 })` → `'25.6%'`. */
export const formatPercent = (value: IntlNumberInput, options: IntlPercentOptions = {}): string => {
  const { locale, fallback, rest, digits } = splitNumberOptions(options)
  return formatWithNumberFormat(value, locale, fallback, { ...rest, ...digits, style: 'percent' })
}

/* ------------------------------------------------------------------------ */
/* Dates                                                                     */
/* ------------------------------------------------------------------------ */

const DEFAULT_PATTERN: DatePatternType = ['Y', 'm', 'd']
const DIGITS_AND_DELIMITERS = /^[\d\s./-]+$/

const unitLength = (unit: DateUnit): number => (unit === 'Y' ? 4 : 2)

const daysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate()

/**
 * Read a digit string by `pattern` as a local calendar date. Delimited
 * values split on the delimiters; undelimited values split by unit length.
 */
const parsePatternDate = (value: string, pattern: DatePatternType): Date | undefined => {
  const groups = value.split(/[^\d]+/).filter(Boolean)
  let segments: string[]
  if (groups.length === 1) {
    const digits = groups[0] ?? ''
    const expected = pattern.reduce((total, unit) => total + unitLength(unit), 0)
    if (digits.length !== expected) return undefined
    let start = 0
    segments = pattern.map(unit => {
      const segment = digits.slice(start, start + unitLength(unit))
      start += unitLength(unit)
      return segment
    })
  } else if (groups.length === pattern.length) {
    segments = groups
  } else {
    return undefined
  }

  let year: number | undefined
  let month = 1
  let day = 1
  pattern.forEach((unit, index) => {
    const segment = segments[index] ?? ''
    if (segment.length !== unitLength(unit)) return
    const number = parseInt(segment, 10)
    if (unit === 'Y') year = number
    else if (unit === 'y') year = 2000 + number
    else if (unit === 'm') month = number
    else day = number
  })

  // Every segment must have its full length; a missing year cannot be guessed.
  const complete = pattern.every(
    (unit, index) => (segments[index] ?? '').length === unitLength(unit)
  )
  if (
    !complete ||
    year === undefined ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    return undefined
  }
  const date = new Date(year, month - 1, day)
  // `new Date(y, …)` maps years 0–99 to 1900–1999; set the full year explicitly.
  date.setFullYear(year)
  return date
}

const toDate = (value: Date | number | string, pattern: DatePatternType): Date | undefined => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value
  if (typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  if (DIGITS_AND_DELIMITERS.test(trimmed)) return parsePatternDate(trimmed, pattern)
  const timestamp = Date.parse(trimmed)
  return Number.isNaN(timestamp) ? undefined : new Date(timestamp)
}

const DATE_COMPONENTS = [
  'weekday',
  'era',
  'year',
  'month',
  'day',
  'dayPeriod',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
  'timeZoneName',
] as const

/**
 * Format a date for display: `formatDate('2026-11-12', { locale: 'es-MX', preset: 'long' })`
 * → `'12 de noviembre de 2026'`. Accepts `Date`, timestamps, ISO strings and
 * digit strings in `pattern` order (formatter's date `raw`).
 */
export const formatDate = (value: IntlDateInput, options: IntlDateOptions = {}): string => {
  const { locale, fallback = '', preset, pattern = DEFAULT_PATTERN, ...intlOptions } = options
  if (isEmpty(value)) return ''
  const date = toDate(value as Date | number | string, pattern)
  if (!date) return fallback

  const record = intlOptions as Record<string, unknown>
  const hasComponents = DATE_COMPONENTS.some(key => record[key] !== undefined)
  const resolved = compact(
    hasComponents || intlOptions.dateStyle !== undefined || intlOptions.timeStyle !== undefined
      ? intlOptions
      : { ...intlOptions, dateStyle: preset ?? 'medium' }
  )
  if (!hasComponents && preset !== undefined) resolved.dateStyle = preset
  return cached(
    'date',
    locale,
    resolved,
    () => new Intl.DateTimeFormat(toLocales(locale), resolved)
  ).format(date)
}

/* ------------------------------------------------------------------------ */
/* Relative time                                                             */
/* ------------------------------------------------------------------------ */

const SECONDS: Record<IntlRelativeTimeUnit, number> = {
  second: 1,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2629746, // average Gregorian month (365.2425 / 12 days)
  year: 31556952,
}

/** Each unit, and how many of it make the next one. */
const LADDER: ReadonlyArray<readonly [IntlRelativeTimeUnit, number]> = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', SECONDS.month / SECONDS.week],
  ['month', 12],
  ['year', Infinity],
]

/** Round half away from zero so past and future values are symmetric. */
const roundAway = (value: number): number => {
  const rounded = Math.sign(value) * Math.round(Math.abs(value))
  return rounded === 0 ? 0 : rounded
}

/** Pick the largest unit whose rounded amount does not reach the next unit. */
const pickUnit = (seconds: number): [number, IntlRelativeTimeUnit] => {
  let amount = seconds
  for (const [unit, next] of LADDER) {
    const rounded = roundAway(amount)
    if (Math.abs(rounded) < next) return [rounded, unit]
    amount /= next
  }
  return [roundAway(amount), 'year']
}

/**
 * Format the distance from `now`: `formatRelativeTime(threeDaysAgo, { locale: 'es-MX' })`
 * → `'hace 3 días'`. The unit is chosen automatically unless `unit` is set.
 */
export const formatRelativeTime = (
  value: IntlDateInput,
  options: IntlRelativeTimeOptions = {}
): string => {
  const {
    locale,
    fallback = '',
    now,
    style = 'long',
    numeric = 'auto',
    unit,
    pattern = DEFAULT_PATTERN,
  } = options
  if (isEmpty(value)) return ''
  const date = toDate(value as Date | number | string, pattern)
  const reference = now === undefined ? new Date() : toDate(now, pattern)
  if (!date || !reference) return fallback

  const seconds = (date.getTime() - reference.getTime()) / 1000
  const [amount, resolvedUnit] = unit
    ? [roundAway(seconds / SECONDS[unit]), unit]
    : pickUnit(seconds)
  const resolved = { style, numeric }
  return cached(
    'relative',
    locale,
    resolved,
    () => new Intl.RelativeTimeFormat(toLocales(locale), resolved)
  ).format(amount, resolvedUnit)
}
