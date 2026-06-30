import {
  formatValue,
  getValueForFormatting,
  resolveRuntimeOptions,
  FORMAT_TYPES,
  isFormatType,
  type FormatType
} from './format.js'

import { getRawValue, stripPrefixAndSuffix } from './raw.js'

import type { FormatterResult, FormatOptions } from './types.js'

export type { FormatOptions, FormatType, FormatterResult }
export { FORMAT_TYPES, isFormatType, stripPrefixAndSuffix }

/**
 * Format `value` according to `formatType`, returning both a presentable
 * `formatted` string and a backend-ready `raw` string.
 *
 * The function is pure: it never touches the DOM and never reads from the
 * network. Pair it with your own input wiring (React, Vue, Svelte, vanilla)
 * to drive the visible field; mirror `result.raw` into a hidden input when
 * shipping to a server that expects clean digits.
 *
 * @param value - The raw value typed by the user (`null`/`undefined`/`''` return an empty result).
 * @param formatType - One of the supported `FormatType` values.
 * @param options - Per-type options (see `FormatOptions`).
 * @returns A `FormatterResult` with `formatted`, `raw`, and the echoed `type`.
 * @throws {TypeError} When `formatType` is not one of the supported types.
 */
export const format = (
  value: unknown,
  formatType: FormatType,
  options: FormatOptions = {}
): FormatterResult => {
  if (!isFormatType(formatType)) {
    throw new TypeError(
      `Invalid formatType: ${String(formatType)}. Expected one of: ${FORMAT_TYPES.join(', ')}`
    )
  }

  if (value === null || value === undefined || value === '') {
    return { formatted: '', raw: '', type: formatType }
  }

  const runtime = resolveRuntimeOptions(formatType, options)
  const stringValue = typeof value === 'string' ? value : String(value)
  const cleanValue = stripPrefixAndSuffix(stringValue, runtime)
  const preValue = getValueForFormatting(cleanValue, formatType, runtime)
  const formatted = formatValue(preValue, formatType, runtime)
  // `getRawValue` normally consumes the *formatted* display string (mirrors
  // the original `syncRawInputValue` pipeline). The one exception is
  // `creditCardType`, where `formatted` is the card brand name (e.g. "visa")
  // rather than the card number — the raw needs to come from the cleaned
  // input directly.
  const raw =
    formatType === 'creditCardType'
      ? getRawValue(cleanValue, formatType, runtime)
      : getRawValue(formatted, formatType, runtime)

  return { formatted, raw, type: formatType }
}