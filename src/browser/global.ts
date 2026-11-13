import { format } from '../core/formatter.js'
import { regex } from '../core/regex.js'
// Named import: esbuild then inlines only `version`, not the whole manifest.
import { version as packageVersion } from '../../package.json'
import * as intl from '../intl/index.js'
import type {
  FormatOptions,
  FormatType,
  FormatterResult
} from '../core/types.js'

export interface FormatterGlobal {
  /** Format any value using the core formatter. */
  format: (value: unknown, formatType: FormatType, options?: FormatOptions) => FormatterResult
  /** Intl display helpers, the same functions as `@samline/formatter/intl`. */
  intl: typeof intl
  /** Validation regex patterns with paired error messages. */
  regex: typeof regex
  /** Library version, mirrors the `version` field in `package.json`. */
  version: string
}

declare global {
  interface Window {
    Formatter?: FormatterGlobal
  }
}

/** Library version, mirrors the `version` field in `package.json`. */
export const version: string = packageVersion

export { format, intl, regex }

/*
 * The IIFE build (`globalName: 'Formatter'`) assigns this module's named
 * exports to `window.Formatter`. A default export would become
 * `window.Formatter.default` and hide `format`/`intl`/`regex`, so this entry
 * intentionally exposes named exports only.
 */
