/**
 * The single place where text casing is applied, for the `general` mask and
 * for matching typed prefixes/suffixes in `format()`.
 *
 * Kept isolated on purpose: more modes (title, sentence, capitalize, slug)
 * are planned through the upcoming `@samline/string` package, which will
 * plug in here instead of duplicating casing helpers inside formatter.
 */
export interface CaseOptions {
  uppercase?: boolean
  lowercase?: boolean
}

/** `lowercase` wins when both flags are set (historical engine order). */
export const applyCase = (value: string, { uppercase = false, lowercase = false }: CaseOptions = {}): string => {
  if (lowercase) return value.toLowerCase()
  if (uppercase) return value.toUpperCase()
  return value
}
