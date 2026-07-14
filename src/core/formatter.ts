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
 * Detect and strip whatever portion of `affix` the user has already
 * typed at either the start or end of `value`. Used for both the head
 * (`prefix`) and tail (`suffix`) decorations on `general` formats so we
 * never delegate affix handling to cleave-zen (whose `stripPrefix` /
 * `tailPrefix` are buggy / reused).
 */
const stripTypedAffix = (
  value: string,
  affix: string,
  side: 'start' | 'end',
  passthrough: boolean
): { typed: string; core: string } => {
  if (!affix) return { typed: '', core: value }

  if (side === 'end') {
    if (passthrough) {
      // Walk from the largest possible tail down to size 1, keeping the
      // longest match that aligns `affix[0..n]` with `value[value.length - n..]`.
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
    if (value.endsWith(affix)) {
      return { typed: affix, core: value.slice(0, value.length - affix.length) }
    }
    return { typed: '', core: value }
  }

  // side === 'start'
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
  return { typed: '', core: value }
}

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

  // Handle `general` + `prefix` / `suffix` decorations entirely on our
  // side. cleave-zen's `stripPrefix` discards any input that doesn't
  // already start with the prefix (snapping the field to the literal
  // prefix and emptying the raw), and cleave-zen has no real `suffix`
  // option — only a `tailPrefix` boolean that reuses the `prefix` string.
  // We therefore strip+re-apply the affix on the formatter's side and
  // never pass `prefix` to cleave-zen.
  //
  // Resolution rules:
  // - Head decoration = `prefix` unless `tailPrefix: true` is set (in
  //   which case `prefix` is repurposed as a tail decoration and we look
  //   for `suffix` first; the legacy `prefix + tailPrefix` shape still
  //   works for backwards compatibility, but `suffix` wins when both are
  //   provided).
  // - Tail decoration = `suffix`, falling back to the legacy
  //   `prefix + tailPrefix: true` shape.
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

      // Run cleave-zen on the body with the affix turned off. Passing
      // `prefix: ''` is safe — cleave-zen treats an empty prefix as no
      // prefix. `formatValue` expects a `RuntimeOptions` with a required
      // `country: string`, so we satisfy that explicitly.
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

      // `typed || configured` so partial affix typing sticks in
      // `passthrough` mode; in `lock` mode `typed` is always either the
      // full affix (paste case) or empty, so this resolves to the
      // configured affix.
      const displayedHead = effPrefix ? (typedHead || effPrefix) : ''
      const displayedTail = effSuffix ? (typedTail || effSuffix) : ''
      const formatted = displayedHead + bodyFormatted + displayedTail

      // Raw mirror: independent flags for head and tail. The body part is
      // always included; the affixes are added only when the caller
      // opts in.
      let raw = body
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