import {
  unformatCreditCard,
  unformatGeneral,
  unformatNumeral,
  type DatePatternType,
  type DateUnit,
  type FormatCreditCardOptions,
  type FormatDateOptions,
  type FormatGeneralOptions,
  type FormatNumeralOptions,
  type FormatTimeOptions,
  type TimePatternType,
  type TimeUnit
} from 'cleave-zen'

export type FormatType =
  | 'general'
  | 'phone'
  | 'numeral'
  | 'date'
  | 'time'
  | 'creditCard'
  | 'creditCardType'

type ExtraFormatOptions = {
  country?: string
  dateRawPattern?: DatePatternType
  dateRawPatternDelimiter?: string
  timeRawPattern?: TimePatternType
  timeRawPatternDelimiter?: string
  tailPrefix?: boolean
}

export type FormatOptions = Partial<
FormatGeneralOptions &
FormatNumeralOptions &
FormatDateOptions &
FormatTimeOptions &
FormatCreditCardOptions
> &
ExtraFormatOptions

type DateSegmentKey = 'day' | 'month' | 'year'
type TimeSegmentKey = 'hours' | 'minutes' | 'seconds'

const DEFAULT_DATE_PATTERN: DatePatternType = ['d', 'm', 'Y']
const DEFAULT_DATE_RAW_PATTERN: DatePatternType = ['Y', 'm', 'd']
const DEFAULT_DATE_RAW_PATTERN_DELIMITER = '-'
const DEFAULT_TIME_PATTERN: TimePatternType = ['h', 'm', 's']
const DEFAULT_TIME_RAW_PATTERN: TimePatternType = ['h', 'm']
const DEFAULT_TIME_RAW_PATTERN_DELIMITER = ':'

const getDateSegmentKey = (unit: DateUnit): DateSegmentKey => {
  switch (unit.toLowerCase()) {
    case 'd':
      return 'day'
    case 'm':
      return 'month'
    default:
      return 'year'
  }
}

const getDateUnitLength = (unit: DateUnit): 2 | 4 =>
  unit === 'Y' ? 4 : 2

const normalizeDateSegment = (segment: string, unit: DateUnit): string => {
  if (!segment) return ''

  switch (unit) {
    case 'y':
      return segment.slice(-2)
    case 'Y':
      return segment.slice(0, 4)
    default:
      return segment.slice(0, 2)
  }
}

const getDateSegments = (
  value: string,
  pattern: DatePatternType
): Partial<Record<DateSegmentKey, string>> => {
  const digits = value.replace(/[^\d]/g, '')
  const segments: Partial<Record<DateSegmentKey, string>> = {}
  let start = 0

  for (const unit of pattern) {
    const end = start + getDateUnitLength(unit)
    const segment = digits.slice(start, end)

    if (segment) {
      segments[getDateSegmentKey(unit)] = segment
    }

    start = end
  }

  return segments
}

const formatDateSegments = (
  segments: Partial<Record<DateSegmentKey, string>>,
  pattern: DatePatternType,
  delimiter = ''
): string =>
  pattern
    .map((unit) =>
      normalizeDateSegment(segments[getDateSegmentKey(unit)] ?? '', unit)
    )
    .filter(Boolean)
    .join(delimiter)

const getTimeSegmentKey = (unit: TimeUnit): TimeSegmentKey => {
  switch (unit) {
    case 'h':
      return 'hours'
    case 'm':
      return 'minutes'
    default:
      return 'seconds'
  }
}

const getTimeSegments = (
  value: string,
  pattern: TimePatternType
): Partial<Record<TimeSegmentKey, string>> => {
  const digits = value.replace(/[^\d]/g, '')
  const segments: Partial<Record<TimeSegmentKey, string>> = {}
  let start = 0

  for (const unit of pattern) {
    const end = start + 2
    const segment = digits.slice(start, end)

    if (segment) {
      segments[getTimeSegmentKey(unit)] = segment
    }

    start = end
  }

  return segments
}

const formatTimeSegments = (
  segments: Partial<Record<TimeSegmentKey, string>>,
  pattern: TimePatternType,
  delimiter = ''
): string =>
  pattern
    .map((unit) => (segments[getTimeSegmentKey(unit)] ?? '').slice(0, 2))
    .filter(Boolean)
    .join(delimiter)

/**
 * Convert a raw date string (e.g. `2026-05-12`) into the digit order of the
 * display pattern (e.g. `12/05/2026` → `12052026`).
 *
 * The output is intentionally digits-only and un-delimited — the caller is
 * expected to pass the result through `cleave-zen`'s `formatDate` (or an
 * equivalent) to add the configured delimiter. The source pattern is
 * `dateRawPattern`; the target pattern is `datePattern`.
 */
export const getDateValueFromRaw = (
  value: string,
  options: FormatOptions = {}
): string => {
  const sourcePattern = options.dateRawPattern ?? DEFAULT_DATE_RAW_PATTERN
  const targetPattern = options.datePattern ?? DEFAULT_DATE_PATTERN

  return formatDateSegments(
    getDateSegments(value, sourcePattern),
    targetPattern
  )
}

/**
 * Convert a raw time string (e.g. `14:30`) into the digit order of the
 * display pattern (e.g. `14:30:00` → `1430`).
 *
 * The output is intentionally digits-only and un-delimited — the caller is
 * expected to pass the result through `cleave-zen`'s `formatTime` (or an
 * equivalent) to add the configured delimiter and pad missing segments.
 * The source pattern is `timeRawPattern`; the target pattern is
 * `timePattern`.
 */
export const getTimeValueFromRaw = (
  value: string,
  options: FormatOptions = {}
): string => {
  const sourcePattern =
    options.timeRawPattern ?? options.timePattern ?? DEFAULT_TIME_RAW_PATTERN
  const targetPattern = options.timePattern ?? DEFAULT_TIME_PATTERN

  return formatTimeSegments(
    getTimeSegments(value, sourcePattern),
    targetPattern
  )
}

const getDateRawValue = (
  value: string,
  options: FormatOptions = {}
): string => {
  const sourcePattern = options.datePattern ?? DEFAULT_DATE_PATTERN
  const targetPattern = options.dateRawPattern ?? DEFAULT_DATE_RAW_PATTERN
  const delimiter =
    options.dateRawPatternDelimiter ?? DEFAULT_DATE_RAW_PATTERN_DELIMITER

  return formatDateSegments(
    getDateSegments(value, sourcePattern),
    targetPattern,
    delimiter
  )
}

const getTimeRawValue = (
  value: string,
  options: FormatOptions = {}
): string => {
  const sourcePattern = options.timePattern ?? DEFAULT_TIME_PATTERN
  const targetPattern =
    options.timeRawPattern ?? options.timePattern ?? DEFAULT_TIME_RAW_PATTERN
  const delimiter =
    options.timeRawPatternDelimiter ?? DEFAULT_TIME_RAW_PATTERN_DELIMITER

  return formatTimeSegments(
    getTimeSegments(value, sourcePattern),
    targetPattern,
    delimiter
  )
}

/**
 * Strip a configured `prefix` from either the start or the end of `value`.
 * `tailPrefix: true` treats the prefix as a suffix.
 */
export const stripPrefixAndSuffix = (
  value: string,
  options: FormatOptions = {}
): string => {
  if (!value || !options.prefix) return value

  const { prefix } = options
  const tailPrefix = options.tailPrefix ?? false

  if (tailPrefix && value.endsWith(prefix)) {
    return value.slice(0, -prefix.length)
  }

  if (!tailPrefix && value.startsWith(prefix)) {
    return value.slice(prefix.length)
  }

  return value
}

/**
 * Convert a formatted value back into its raw counterpart (digits only,
 * canonical structure ready to ship to a backend).
 */
export const getRawValue = (
  value: string,
  formatType: FormatType,
  options: FormatOptions = {}
): string => {
  if (!value) return ''

  const cleanValue = stripPrefixAndSuffix(value, options)

  switch (formatType) {
    case 'numeral': {
      const numeralOpts: { numeralDecimalMark?: string } = {}
      if (options.numeralDecimalMark !== undefined) {
        numeralOpts.numeralDecimalMark = options.numeralDecimalMark
      }
      return unformatNumeral(cleanValue, numeralOpts)
    }

    case 'creditCard':
    case 'creditCardType':
      return unformatCreditCard(cleanValue)

    case 'general': {
      const generalOpts: {
        delimiter?: string
        delimiters?: string[]
      } = {}
      if (options.delimiter !== undefined) generalOpts.delimiter = options.delimiter
      if (options.delimiters !== undefined) generalOpts.delimiters = options.delimiters
      return unformatGeneral(cleanValue, generalOpts)
    }

    case 'date':
      return getDateRawValue(cleanValue, options)

    case 'time':
      return getTimeRawValue(cleanValue, options)

    case 'phone':
      return cleanValue.replace(/[^\d+]/g, '')

    default:
      return cleanValue.replace(/\s+/g, '')
  }
}