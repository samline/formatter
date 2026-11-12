/*
 * Portions of this engine are adapted from cleave-zen 0.0.17
 * (https://github.com/nosir/cleave-zen), Copyright (c) 2023 Max Huang,
 * released under the MIT License. See LICENSE.md for the full notice.
 */

import type { BlocksType, FormatTimeOptions, TimeFormatType, TimePatternType, TimeUnit } from './types.js'
import { getFormattedValue, getMaxLength, headStr, stripNonNumeric } from './utils.js'

const DEFAULT_TIME_FORMAT: TimeFormatType = '24'
const DEFAULT_TIME_DELIMITER = ':'
const DEFAULT_TIME_PATTERN: TimePatternType = ['h', 'm', 's']

const getTimeLimits = (timeFormat: TimeFormatType) =>
  timeFormat === '12'
    ? { maxHourFirstDigit: 1, maxHours: 12, maxMinutesFirstDigit: 5, maxMinutes: 60 }
    : { maxHourFirstDigit: 2, maxHours: 23, maxMinutesFirstDigit: 5, maxMinutes: 60 }

const pad2 = (value: number): string => (value < 10 ? '0' : '') + value

/** Start offset of each unit inside a fully typed digit string. */
const getUnitStart = (pattern: TimePatternType, unit: TimeUnit): number => {
  let start = 0
  pattern.forEach((current, index) => {
    if (current === unit) start = index * 2
  })
  return start
}

const getFixedTimeString = (value: string, pattern: TimePatternType): string => {
  const complete = value.length === 6 || (value.length === 4 && !pattern.includes('s'))
  if (!complete) return value

  const read = (unit: TimeUnit): number => {
    const start = getUnitStart(pattern, unit)
    return parseInt(value.slice(start, start + 2), 10)
  }
  const hour = Math.min(read('h'), 60)
  const minute = Math.min(read('m'), 60)
  const second = value.length === 6 ? Math.min(read('s'), 60) : 0
  const time: Record<TimeUnit, number> = { h: hour, m: minute, s: second }

  return pattern.reduce((result, unit) => result + pad2(time[unit]), '')
}

/** Clamp each typed segment to the limits of the 12/24-hour clock. */
const getValidatedTime = (value: string, blocks: BlocksType, pattern: TimePatternType, timeFormat: TimeFormatType): string => {
  const limits = getTimeLimits(timeFormat)
  let result = ''
  let remaining = value

  blocks.forEach((length, index) => {
    if (remaining.length === 0) return
    let sub = remaining.slice(0, length)
    const sub0 = sub.slice(0, 1)
    remaining = remaining.slice(length)

    switch (pattern[index]) {
      case 'h':
        // A 12-hour clock has no hour 00 (upstream accepted it); midnight is 12.
        if (timeFormat === '12' && sub === '00') sub = '12'
        else if (parseInt(sub0, 10) > limits.maxHourFirstDigit) sub = '0' + sub0
        else if (parseInt(sub, 10) > limits.maxHours) sub = String(limits.maxHours)
        break
      case 'm':
      case 's':
        if (parseInt(sub0, 10) > limits.maxMinutesFirstDigit) sub = '0' + sub0
        else if (parseInt(sub, 10) > limits.maxMinutes) sub = String(limits.maxMinutes)
        break
    }

    result += sub
  })

  return getFixedTimeString(result, pattern)
}

export const formatTime = (value: string, options: FormatTimeOptions = {}): string => {
  const {
    delimiterLazyShow = false,
    delimiter = DEFAULT_TIME_DELIMITER,
    timePattern = DEFAULT_TIME_PATTERN,
    timeFormat = DEFAULT_TIME_FORMAT
  } = options
  const blocks: BlocksType = timePattern.map(() => 2)
  const result = getValidatedTime(stripNonNumeric(value), blocks, timePattern, timeFormat)
  return getFormattedValue(headStr(result, getMaxLength(blocks)), { blocks, delimiter, delimiterLazyShow })
}
