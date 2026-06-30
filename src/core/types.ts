// Public types for `@samline/formatter`.
//
// The runtime surfaces (`format`, `regex`, helpers) live in sibling modules;
// this file only exposes the type contract so consumers can build strictly
// typed form pipelines.

export type {
  FormatOptions,
  FormatType
} from './raw.js'

export {
  FORMAT_TYPES,
  isFormatType
} from './format.js'

import type { FormatType } from './raw.js'

/**
 * Result returned by `format()`. `formatted` is the display string
 * (with delimiters, prefix, etc.); `raw` is the canonical backend-ready
 * representation (digits only, no separators); `type` echoes the requested
 * format type for chaining or debugging.
 */
export interface FormatterResult {
  readonly formatted: string
  readonly raw: string
  readonly type: FormatType
}