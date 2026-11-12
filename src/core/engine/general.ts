/*
 * Portions of this engine are adapted from cleave-zen 0.0.17
 * (https://github.com/nosir/cleave-zen), Copyright (c) 2023 Max Huang,
 * released under the MIT License. See LICENSE.md for the full notice.
 */

import { applyCase } from './case.js'
import type { FormatGeneralOptions } from './types.js'
import { getFormattedValue, stripDelimiters, stripNonNumeric } from './utils.js'

/**
 * Remove a leading `prefix`. A value that does not start with the prefix
 * collapses to `''` (upstream behavior: the prefix is locked).
 */
const stripPrefix = (value: string, prefix: string): string => {
  if (prefix.length === 0) return value
  if (value === prefix) return ''
  if (value.slice(0, prefix.length) !== prefix) return ''
  return value.slice(prefix.length)
}

/**
 * Apply a block mask. Unlike upstream, the caller's `delimiters` array is
 * never mutated (upstream pushed `delimiter` into it on every call).
 */
export const formatGeneral = (value: string, options: FormatGeneralOptions): string => {
  const {
    blocks,
    delimiter = '',
    delimiterLazyShow = false,
    prefix = '',
    numericOnly = false,
    uppercase = false,
    lowercase = false
  } = options
  const delimiters = delimiter.length > 0 ? [...(options.delimiters ?? []), delimiter] : [...(options.delimiters ?? [])]

  let result = stripDelimiters(value, delimiters)
  result = stripPrefix(result, prefix)
  if (numericOnly) result = stripNonNumeric(result)
  result = applyCase(result, { uppercase, lowercase })
  if (prefix.length > 0) result = prefix + result

  return getFormattedValue(result, { blocks, delimiter, delimiters, delimiterLazyShow })
}

export const unformatGeneral = (
  value: string,
  options: Pick<FormatGeneralOptions, 'delimiter' | 'delimiters'> = {}
): string => {
  const { delimiter = '', delimiters = [] } = options
  return stripDelimiters(value, [...delimiters, delimiter])
}
