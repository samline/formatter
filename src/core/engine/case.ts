import { capitalize, sentenceCase, titleCase } from '@samline/string'

/**
 * The single place where text casing is applied: the `general` mask, the
 * `text` type and matching typed prefixes/suffixes in `format()`.
 *
 * Title, sentence and capitalize come from `@samline/string` (bundled at build
 * time, so formatter keeps no runtime dependency).
 */
export type CaseMode = 'upper' | 'lower' | 'title' | 'sentence' | 'capitalize'

export interface CaseOptions {
  /** One casing mode; takes precedence over `uppercase` / `lowercase`. */
  case?: CaseMode
  uppercase?: boolean
  lowercase?: boolean
  /** `case: 'title'` keeps these words lower case unless they come first. */
  smallWords?: readonly string[]
  /** Locale for upper/lower casing, for example `'tr'`. */
  locale?: string | string[]
}

// Without a locale use the locale-independent conversions, so output never
// depends on the visitor's system language (a Turkish system would otherwise
// turn `i` into `İ`).
const upper = (value: string, locale?: string | string[]): string =>
  locale ? value.toLocaleUpperCase(locale) : value.toUpperCase()
const lower = (value: string, locale?: string | string[]): string =>
  locale ? value.toLocaleLowerCase(locale) : value.toLowerCase()

/** `lowercase` wins over `uppercase` when both flags are set (historical engine order). */
export const applyCase = (
  value: string,
  { case: mode, uppercase = false, lowercase = false, smallWords, locale }: CaseOptions = {}
): string => {
  switch (mode) {
    case 'upper':
      return upper(value, locale)
    case 'lower':
      return lower(value, locale)
    case 'title':
      return titleCase(value, { ...(smallWords && { smallWords }), ...(locale && { locale }) })
    case 'sentence':
      return sentenceCase(value, locale ? { locale } : {})
    case 'capitalize':
      return capitalize(value, locale ? { locale } : {})
  }
  if (lowercase) return lower(value, locale)
  if (uppercase) return upper(value, locale)
  return value
}
