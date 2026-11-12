/*
 * Portions of this engine are adapted from cleave-zen 0.0.17
 * (https://github.com/nosir/cleave-zen), Copyright (c) 2023 Max Huang,
 * released under the MIT License. See LICENSE.md for the full notice.
 */

import type { BlocksType, DelimiterType } from './types.js'

export const stripNonNumeric = (value: string): string => value.replace(/[^\d]/g, '')

export const getMaxLength = (blocks: BlocksType): number =>
  blocks.reduce((total, length) => total + length, 0)

export const headStr = (value: string, length: number): string => value.slice(0, length)

/** Remove every character of every delimiter from `value` (no RegExp per call). */
export const stripDelimiters = (value: string, delimiters: readonly DelimiterType[]): string => {
  let result = value
  for (const delimiter of delimiters) {
    for (const letter of delimiter) {
      if (result.includes(letter)) result = result.split(letter).join('')
    }
  }
  return result
}

export interface GetFormattedValueOptions {
  blocks: BlocksType
  delimiter?: DelimiterType
  delimiters?: readonly DelimiterType[]
  delimiterLazyShow?: boolean
}

/** Split `value` into `blocks` and join them with the configured delimiters. */
export const getFormattedValue = (
  value: string,
  { blocks, delimiter = '', delimiters = [], delimiterLazyShow = false }: GetFormattedValueOptions
): string => {
  let result = ''
  let remaining = value
  let currentDelimiter = ''

  blocks.forEach((length, index) => {
    if (remaining.length === 0) return

    const sub = remaining.slice(0, length)
    remaining = remaining.slice(length)

    currentDelimiter =
      delimiters.length > 0
        ? (delimiters[delimiterLazyShow ? index - 1 : index] ?? currentDelimiter)
        : delimiter

    if (delimiterLazyShow) {
      if (index > 0) result += currentDelimiter
      result += sub
    } else {
      result += sub
      if (sub.length === length && index < blocks.length - 1) result += currentDelimiter
    }
  })

  return result
}
