import { format } from '../core/formatter.js'
import { regex } from '../core/regex.js'
import packageJson from '../../package.json'
import type {
  FormatOptions,
  FormatType,
  FormatterResult
} from '../core/types.js'

export interface FormatterGlobal {
  /** Format any value using the core formatter. */
  format: (value: unknown, formatType: FormatType, options?: FormatOptions) => FormatterResult
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
export const version: string = packageJson.version

export { format, regex }

/*
 * The IIFE build (`globalName: 'Formatter'`) assigns this module's named
 * exports to `window.Formatter`. A default export would become
 * `window.Formatter.default` and hide `format`/`regex`, so this entry
 * intentionally exposes named exports only.
 */
