/*
 * Portions of this engine are adapted from cleave-zen 0.0.17
 * (https://github.com/nosir/cleave-zen), Copyright (c) 2023 Max Huang,
 * released under the MIT License. See LICENSE.md for the full notice.
 */

import type { BlocksType, DatePatternType, DateUnit, FormatDateOptions } from './types.js'
import { getFormattedValue, getMaxLength, headStr, stripNonNumeric } from './utils.js'

const DEFAULT_DATE_DELIMITER = '/'
const DEFAULT_DATE_PATTERN: DatePatternType = ['d', 'm', 'Y']

/** `[day, month, year]`; `0` marks a missing part. */
type DateParts = [number, number, number]

const getBlocksByDatePattern = (pattern: DatePatternType): BlocksType =>
  pattern.map(unit => (unit === 'Y' ? 4 : 2))

/** Parse `YYYY-MM-DD` or `YYYY-MM` bounds into `[day, month, year]`. */
const parseDateBound = (bound: string): number[] => {
  const parts = bound
    .split('-')
    .reverse()
    .map(part => parseInt(part, 10))
  if (parts.length === 2) parts.unshift(0)
  return parts
}

const pad = (value: number, length: number): string => String(value).padStart(length, '0')

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

const getFixedDate = (day: number, month: number, year: number): DateParts => {
  const fixedMonth = Math.min(month, 12)
  let fixedDay = Math.min(day, 31)
  if ((fixedMonth < 7 && fixedMonth % 2 === 0) || (fixedMonth > 8 && fixedMonth % 2 === 1)) {
    fixedDay = Math.min(fixedDay, fixedMonth === 2 ? (isLeapYear(year) ? 29 : 28) : 30)
  }
  return [fixedDay, fixedMonth, year]
}

/** Whether `[day, month, year]` `a` is later than `b`. Missing parts compare as `NaN` (always false). */
const isAfter = (a: readonly number[], b: readonly number[]): boolean => {
  const [aDay = NaN, aMonth = NaN, aYear = NaN] = a
  const [bDay = NaN, bMonth = NaN, bYear = NaN] = b
  return (
    aYear > bYear || (aYear === bYear && (aMonth > bMonth || (aMonth === bMonth && aDay > bDay)))
  )
}

const getRangeFixedDate = (
  date: readonly number[],
  pattern: DatePatternType,
  min: readonly number[],
  max: readonly number[]
): readonly number[] => {
  if (date.length === 0 || (min.length < 3 && max.length < 3)) return date
  if (pattern.some(unit => unit.toLowerCase() === 'y') && date[2] === 0) return date
  if (max.length > 0 && isAfter(date, max)) return max
  if (min.length > 0 && isAfter(min, date)) return min
  return date
}

const getFixedDateString = (
  value: string,
  pattern: DatePatternType,
  min: readonly number[],
  max: readonly number[]
): string => {
  const [first, second] = pattern
  let date: readonly number[] = []
  let fullYearDone = false

  // mm-dd || dd-mm
  if (value.length === 4 && first?.toLowerCase() !== 'y' && second?.toLowerCase() !== 'y') {
    const dayStart = first === 'd' ? 0 : 2
    const monthStart = 2 - dayStart
    date = getFixedDate(
      parseInt(value.slice(dayStart, dayStart + 2), 10),
      parseInt(value.slice(monthStart, monthStart + 2), 10),
      0
    )
  }

  // yyyy-mm-dd || yyyy-dd-mm || mm-dd-yyyy || dd-mm-yyyy || dd-yyyy-mm || mm-yyyy-dd
  if (value.length === 8) {
    let dayIndex = 0
    let monthIndex = 0
    let yearIndex = 0
    pattern.forEach((unit, index) => {
      if (unit === 'd') dayIndex = index
      else if (unit === 'm') monthIndex = index
      else yearIndex = index
    })

    const yearStart = yearIndex * 2
    const dayStart = dayIndex <= yearIndex ? dayIndex * 2 : dayIndex * 2 + 2
    const monthStart = monthIndex <= yearIndex ? monthIndex * 2 : monthIndex * 2 + 2
    const yearDigits = value.slice(yearStart, yearStart + 4)

    fullYearDone = yearDigits.length === 4
    date = getFixedDate(
      parseInt(value.slice(dayStart, dayStart + 2), 10),
      parseInt(value.slice(monthStart, monthStart + 2), 10),
      parseInt(yearDigits, 10)
    )
  }

  // mm-yy || yy-mm
  if (value.length === 4 && (first === 'y' || second === 'y')) {
    const monthStart = first === 'm' ? 0 : 2
    const yearStart = 2 - monthStart
    const yearDigits = value.slice(yearStart, yearStart + 2)
    fullYearDone = yearDigits.length === 2
    date = [0, parseInt(value.slice(monthStart, monthStart + 2), 10), parseInt(yearDigits, 10)]
  }

  // mm-yyyy || yyyy-mm
  if (value.length === 6 && (first === 'Y' || second === 'Y')) {
    const monthStart = first === 'm' ? 0 : 4
    const yearStart = 2 - 0.5 * monthStart
    const yearDigits = value.slice(yearStart, yearStart + 4)
    fullYearDone = yearDigits.length === 4
    date = [0, parseInt(value.slice(monthStart, monthStart + 2), 10), parseInt(yearDigits, 10)]
  }

  date = getRangeFixedDate(date, pattern, min, max)
  if (date.length === 0) return value

  const [day = 0, month = 0, year = 0] = date
  return pattern.reduce((result: string, unit: DateUnit) => {
    switch (unit) {
      case 'd':
        return result + (day === 0 ? '' : pad(day, 2))
      case 'm':
        return result + (month === 0 ? '' : pad(month, 2))
      case 'y':
        return result + (fullYearDone ? pad(year, 2) : '')
      case 'Y':
        return result + (fullYearDone ? pad(year, 4) : '')
    }
  }, '')
}

/** Clamp each typed segment (`00` → `01`, day `4` → `04`, month `13` → `12`). */
const getValidatedDate = (
  value: string,
  blocks: BlocksType,
  pattern: DatePatternType,
  min: readonly number[],
  max: readonly number[]
): string => {
  let result = ''
  let remaining = value

  blocks.forEach((length, index) => {
    if (remaining.length === 0) return
    let sub = remaining.slice(0, length)
    const sub0 = sub.slice(0, 1)
    remaining = remaining.slice(length)

    switch (pattern[index]) {
      case 'd':
        if (sub === '00') sub = '01'
        else if (parseInt(sub0, 10) > 3) sub = '0' + sub0
        else if (parseInt(sub, 10) > 31) sub = '31'
        break
      case 'm':
        if (sub === '00') sub = '01'
        else if (parseInt(sub0, 10) > 1) sub = '0' + sub0
        else if (parseInt(sub, 10) > 12) sub = '12'
        break
    }

    result += sub
  })

  return getFixedDateString(result, pattern, min, max)
}

export const formatDate = (value: string, options: FormatDateOptions = {}): string => {
  const {
    delimiterLazyShow = false,
    delimiter = DEFAULT_DATE_DELIMITER,
    datePattern = DEFAULT_DATE_PATTERN,
    dateMax = '',
    dateMin = '',
  } = options
  const blocks = getBlocksByDatePattern(datePattern)
  // Validation only ever sees digits, so the delimiter never needs stripping.
  const result = getValidatedDate(
    stripNonNumeric(value),
    blocks,
    datePattern,
    parseDateBound(dateMin),
    parseDateBound(dateMax)
  )
  return getFormattedValue(headStr(result, getMaxLength(blocks)), {
    blocks,
    delimiter,
    delimiterLazyShow,
  })
}
