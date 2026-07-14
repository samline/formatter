// Browser IIFE bundle — exposes the formatter as `window.Formatter`
// for projects without a bundler (Shopify themes, WordPress templates,
// plain HTML pages). The tsup config wires this file as an IIFE entry
// with `globalName: "Formatter"` and `platform: "browser"`.

import { format } from '../core/formatter.js'
import { regex } from '../core/regex.js'
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

const Formatter: FormatterGlobal = {
  format,
  regex,
  // Keep in sync with `version` in `package.json`.
  version: '1.1.1'
}

if (typeof window !== 'undefined') {
  window.Formatter = Formatter
}

export default Formatter