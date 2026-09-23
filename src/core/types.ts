export type {
  DatePatternType,
  FormatOptions,
  FormatType,
  TimePatternType
} from './raw.js'

export {
  FORMAT_TYPES,
  isFormatType
} from './format.js'

import type { FormatType } from './raw.js'

/**
 * Result returned by `format()`. `formatted` is the display string
 * (with delimiters, prefix, etc.); `raw` is the canonical backend-ready
 * representation required by the selected format; `type` echoes the requested
 * format type for chaining or debugging.
 */
export interface FormatterResult {
  readonly formatted: string
  readonly raw: string
  readonly type: FormatType
}
