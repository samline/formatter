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
 * Whether `value` contains `affix` with exactly one character removed at
 * `side`. This is what a single Backspace/Delete inside a locked decoration
 * produces (e.g. `100 US` for the suffix ` USD`).
 */
const damagedAffixLength = (
  value: string,
  affix: string,
  side: 'start' | 'end'
): number => {
  if (affix.length < 2) return 0
  const length = affix.length - 1
  const candidate = side === 'start' ? value.slice(0, length) : value.slice(-length)
  if (candidate.length !== length) return 0
  for (let index = 0; index < affix.length; index++) {
    if (affix.slice(0, index) + affix.slice(index + 1) === candidate) return length
  }
  return 0
}

/**
 * Detect and strip whatever portion of `affix` the user has already
 * typed at either the start or end of `value`.
 */
const stripTypedAffix = (
  value: string,
  affix: string,
  side: 'start' | 'end',
  passthrough: boolean
): { typed: string; core: string } => {
  if (!affix) return { typed: '', core: value }

  if (side === 'end') {
    if (value.endsWith(affix)) {
      return { typed: affix, core: value.slice(0, value.length - affix.length) }
    }
    if (passthrough) {
      // Keep the longest partial suffix that the user has typed.
      let typedLen = 0
      const max = Math.min(affix.length, value.length)
      for (let n = 1; n <= max; n++) {
        if (value.slice(value.length - n) === affix.slice(0, n)) {
          typedLen = n
        }
      }
      return {
        typed: value.slice(value.length - typedLen),
        core: value.slice(0, value.length - typedLen)
      }
    }
    // Lock mode: a single deleted character restores the whole suffix.
    const damaged = damagedAffixLength(value, affix, 'end')
    return { typed: '', core: value.slice(0, value.length - damaged) }
  }

  if (passthrough) {
    let typed = ''
    const max = Math.min(affix.length, value.length)
    for (let i = 0; i < max; i++) {
      if (value[i] === affix[i]) typed += value[i]
      else break
    }
    return { typed, core: value.slice(typed.length) }
  }

  if (value.startsWith(affix)) {
    return { typed: affix, core: value.slice(affix.length) }
  }
  // Lock mode: a single deleted character restores the whole prefix.
  const damaged = damagedAffixLength(value, affix, 'start')
  return { typed: '', core: value.slice(damaged) }
}

/**
 * Format `value` according to `formatType`, returning both a presentable
 * `formatted` string and a backend-ready `raw` string.
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

  if (
    formatType === 'general' &&
    (!Array.isArray(options.blocks) || options.blocks.length === 0)
  ) {
    throw new TypeError(
      "The 'general' format requires a non-empty `blocks` array, e.g. { blocks: [4, 4, 4] }."
    )
  }

  const runtime = resolveRuntimeOptions(formatType, options)
  const stringValue = typeof value === 'string' ? value : String(value)

  // Manage affixes here because cleave-zen has no independent suffix.
  if (formatType === 'general') {
    const rawPrefix = runtime.prefix
    const rawSuffix = runtime.suffix
    const tailLegacy = runtime.tailPrefix === true

    const hasSuffix =
      (typeof rawSuffix === 'string' && rawSuffix.length > 0) ||
      (typeof rawPrefix === 'string' &&
        rawPrefix.length > 0 &&
        tailLegacy &&
        !(typeof rawSuffix === 'string' && rawSuffix.length > 0))
    const hasHeadSuffixOverlap = tailLegacy && !(typeof rawSuffix === 'string' && rawSuffix.length > 0)
    const hasPrefix =
      typeof rawPrefix === 'string' &&
      rawPrefix.length > 0 &&
      !hasHeadSuffixOverlap

    if (hasPrefix || hasSuffix) {
      const effPrefix = hasPrefix ? rawPrefix : ''
      const effSuffix = hasSuffix
        ? ((typeof rawSuffix === 'string' && rawSuffix.length > 0)
            ? rawSuffix
            : rawPrefix)
        : ''

      let body = stringValue
      let typedHead = ''
      let typedTail = ''

      if (effPrefix) {
        const r = stripTypedAffix(
          body,
          effPrefix,
          'start',
          runtime.prefixMode === 'passthrough'
        )
        typedHead = r.typed
        body = r.core
      }

      if (effSuffix) {
        const r = stripTypedAffix(
          body,
          effSuffix,
          'end',
          runtime.suffixMode === 'passthrough'
        )
        typedTail = r.typed
        body = r.core
      }

      const {
        prefix: _p,
        suffix: _s,
        rawPrefix: _rp,
        rawSuffix: _rs,
        prefixMode: _pm,
        suffixMode: _sm,
        tailPrefix: _tp,
        ...generalRest
      } = runtime
      void _p
      void _s
      void _rp
      void _rs
      void _pm
      void _sm
      void _tp
      const bodyFormatted = formatValue(body, formatType, {
        ...generalRest,
        prefix: '',
        country: runtime.country ?? ''
      })

      const displayedHead = effPrefix ? (typedHead || effPrefix) : ''
      const displayedTail = effSuffix ? (typedTail || effSuffix) : ''
      const formatted = displayedHead + bodyFormatted + displayedTail

      // Canonical raw values inherit display transformations without
      // separators. The default keeps the historical typed-body contract.
      const wantsCanonicalRaw =
        (runtime.rawPrefix === true && effPrefix) ||
        (runtime.rawSuffix === true && effSuffix)

      const delimiterOptions = {
        ...(runtime.delimiter !== undefined ? { delimiter: runtime.delimiter } : {}),
        ...(runtime.delimiters !== undefined ? { delimiters: runtime.delimiters } : {})
      }
      // Default: the typed body without the formatter's own delimiters, so
      // re-formatting a displayed value (every keystroke) keeps `raw` stable.
      let raw = getRawValue(body, formatType, delimiterOptions)
      if (wantsCanonicalRaw) {
        raw = getRawValue(bodyFormatted, formatType, delimiterOptions).replace(/\s/g, '')
        if (runtime.numericOnly) raw = raw.replace(/\D/g, '')
      }

      if (runtime.rawPrefix === true && effPrefix) {
        raw = displayedHead + raw
      }
      if (runtime.rawSuffix === true && effSuffix) {
        raw = raw + displayedTail
      }

      return { formatted, raw, type: formatType }
    }
  }

  const cleanValue = stripPrefixAndSuffix(stringValue, runtime)
  const preValue = getValueForFormatting(cleanValue, formatType, runtime)
  const formatted = formatValue(preValue, formatType, runtime)
  // A card type's display value is its brand, so derive raw from the number.
  const raw =
    formatType === 'creditCardType'
      ? getRawValue(cleanValue, formatType, runtime)
      : getRawValue(formatted, formatType, runtime)

  return { formatted, raw, type: formatType }
}
