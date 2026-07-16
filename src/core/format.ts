import {
  formatCreditCard,
  formatDate,
  formatGeneral,
  formatNumeral,
  formatTime,
  getCreditCardType,
  type FormatGeneralOptions
} from 'cleave-zen'

import { formatPhone } from './phone.js'
import {
  getDateValueFromRaw,
  getTimeValueFromRaw,
  type FormatOptions,
  type FormatType
} from './raw.js'

export type { FormatOptions, FormatType }

export const FORMAT_TYPES = [
  'general',
  'phone',
  'numeral',
  'date',
  'time',
  'creditCard',
  'creditCardType'
] as const satisfies readonly FormatType[]

export const isFormatType = (value: unknown): value is FormatType =>
  typeof value === 'string' &&
  (FORMAT_TYPES as readonly string[]).includes(value)

type RuntimeOptions = FormatOptions & {
  country: string
  delimiter?: string
}

// Per-type defaults applied only when the caller does not pass their own.
// `phone` overrides cleave-zen because libphonenumber emits spaces natively;
// every other type lets cleave-zen pick its own idiomatic delimiter
// (`/`, `:`, `,`, etc.) by leaving `delimiter` undefined on the runtime
// options object passed downstream.
const PHONE_DEFAULT_DELIMITER = ' '
const PHONE_DEFAULT_COUNTRY = 'MX'

/**
 * Internal: pick a country/delimiter-aware runtime options object with
 * phone-specific defaults applied. For non-phone formats the `delimiter`
 * is left as the user supplied it (or absent) so cleave-zen falls back to
 * its idiomatic defaults.
 */
const resolveRuntimeOptions = (
  formatType: FormatType,
  options: FormatOptions = {}
): RuntimeOptions => {
  const isPhone = formatType === 'phone'
  const country = options.country ?? (isPhone ? PHONE_DEFAULT_COUNTRY : '')

  // Build the runtime options without ever assigning `undefined` to optional
  // fields (so `exactOptionalPropertyTypes` stays happy) and without ever
  // adding an explicit empty-string `delimiter` for non-phone types (so
  // cleave-zen falls back to its own idiomatic default).
  const runtime: RuntimeOptions = {
    ...options,
    country
  }

  if (options.delimiter !== undefined) {
    runtime.delimiter = options.delimiter
  } else if (isPhone) {
    runtime.delimiter = PHONE_DEFAULT_DELIMITER
  }

  return runtime
}

/**
 * Internal: format a pre-processed value into its display representation
 * by delegating to the matching `cleave-zen` (or `formatPhone`) helper.
 */
const formatValue = (
  value: string,
  formatType: FormatType,
  options: RuntimeOptions
): string => {
  switch (formatType) {
    case 'phone':
      return formatPhone(value, options.country, options.delimiter)

    case 'numeral':
      return formatNumeral(value, options)

    case 'date':
      return formatDate(value, options)

    case 'time':
      return formatTime(value, options)

    case 'creditCard':
      return formatCreditCard(value, options)

    case 'creditCardType':
      return getCreditCardType(value, options.delimiter)

    case 'general':
      // cleave-zen's `formatGeneral` requires `blocks` in its options;
      // `FormatOptions` does not declare it (consumers pick blocks via
      // their own configuration). This cast is the documented seam.
      return formatGeneral(
        value,
        options as unknown as FormatGeneralOptions
      )
  }
}

/**
 * Internal: pre-process `value` before passing it to the per-type formatter.
 *
 * For `date` and `time`, the caller is presumed to be driving `format()` from
 * an `input` event listener — the value is whatever the user just typed
 * into the visible field, which is in display order (the user types what
 * they see). The default `interpretInputAs: 'display'` therefore returns
 * the value verbatim and lets `cleave-zen` re-segment the digits into
 * `datePattern` / `timePattern` order.
 *
 * Callers that pass a raw-formatted value (e.g. `setValue('birth_date',
 * '19890915')` from a pre-existing API contract) can opt into the legacy
 * round-trip rearrangement with `interpretInputAs: 'raw'`. Without that
 * opt-in, the digits would be mis-segmented whenever `datePattern` and
 * `dateRawPattern` (or `timePattern` and `timeRawPattern`) differ.
 */
const getValueForFormatting = (
  value: string,
  formatType: FormatType,
  options: RuntimeOptions
): string => {
  if (formatType === 'date') {
    if (options.interpretInputAs === 'raw') {
      return getDateValueFromRaw(value, options)
    }
    return value
  }

  if (formatType === 'time') {
    if (options.interpretInputAs === 'raw') {
      return getTimeValueFromRaw(value, options)
    }
    return value
  }

  return value
}

export { formatValue, getValueForFormatting, resolveRuntimeOptions }