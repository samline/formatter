/*
 * Portions of this engine are adapted from cleave-zen 0.0.17
 * (https://github.com/nosir/cleave-zen), Copyright (c) 2023 Max Huang,
 * released under the MIT License. See LICENSE.md for the full notice.
 */

import type { FormatNumeralOptions } from './types.js'

const DEFAULT_NUMERAL_DELIMITER = ','
const DEFAULT_NUMERAL_DECIMAL_MARK = '.'
const DEFAULT_NUMERAL_DECIMAL_SCALE = 2
const DEFAULT_NUMERAL_INTEGER_SCALE = 0 // no limit

const groupInteger = (integer: string, style: FormatNumeralOptions['numeralThousandsGroupStyle'], delimiter: string): string => {
  switch (style) {
    case 'lakh':
      return integer.replace(/(\d)(?=(\d\d)+\d$)/g, '$1' + delimiter)
    case 'wan':
      return integer.replace(/(\d)(?=(\d{4})+$)/g, '$1' + delimiter)
    case 'thousand':
      return integer.replace(/(\d)(?=(\d{3})+$)/g, '$1' + delimiter)
    default:
      // 'none' (and any unknown style) leaves the integer ungrouped.
      return integer
  }
}

export const formatNumeral = (value: string, options: FormatNumeralOptions = {}): string => {
  // An empty mark would split every character (upstream produced `.5`).
  const numeralDecimalMark = options.numeralDecimalMark || DEFAULT_NUMERAL_DECIMAL_MARK
  const {
    // A comma decimal mark defaults to dot grouping; upstream kept ',' for
    // both, so `1234,5` became `1,234,5`.
    delimiter = numeralDecimalMark === ',' ? '.' : DEFAULT_NUMERAL_DELIMITER,
    numeralThousandsGroupStyle = 'thousand',
    numeralIntegerScale = DEFAULT_NUMERAL_INTEGER_SCALE,
    numeralDecimalScale = DEFAULT_NUMERAL_DECIMAL_SCALE,
    numeralDecimalPadding = false,
    stripLeadingZeroes = true,
    numeralPositiveOnly = false,
    tailPrefix = false,
    signBeforePrefix = false,
    prefix = ''
  } = options

  let result = value
    // strip alphabet letters
    .replace(/[A-Za-z]/g, '')
    // keep the first decimal mark behind a reserved placeholder
    .replace(numeralDecimalMark, 'M')
    // strip everything but digits, minus and the placeholder (drops the prefix)
    .replace(/[^\dM-]/g, '')
    // keep only a leading minus
    .replace(/^-/, 'N')
    .replace(/-/g, '')
    .replace('N', numeralPositiveOnly ? '' : '-')
    .replace('M', numeralDecimalMark)

  if (stripLeadingZeroes) result = result.replace(/^(-)?0+(?=\d)/, '$1')

  const partSign = result.slice(0, 1) === '-' ? '-' : ''
  const partSignAndPrefix = signBeforePrefix ? partSign + prefix : prefix + partSign

  let partInteger = result
  let decimals: string | undefined
  if (result.includes(numeralDecimalMark)) {
    const [integer = '', fraction = ''] = result.split(numeralDecimalMark)
    partInteger = integer
    decimals = fraction.slice(0, numeralDecimalScale)
  }

  if (partSign === '-') partInteger = partInteger.slice(1)
  if (numeralIntegerScale > 0) partInteger = partInteger.slice(0, numeralIntegerScale)

  if (numeralDecimalPadding && numeralDecimalScale > 0 && /\d/.test(partInteger + (decimals ?? ''))) {
    if (partInteger === '') partInteger = '0'
    decimals = (decimals ?? '').padEnd(numeralDecimalScale, '0')
  }

  partInteger = groupInteger(partInteger, numeralThousandsGroupStyle, delimiter)
  const partDecimal = numeralDecimalScale > 0 && decimals !== undefined ? numeralDecimalMark + decimals : ''

  return tailPrefix
    ? partSign + partInteger + partDecimal + prefix
    : partSignAndPrefix + partInteger + partDecimal
}

/**
 * Read a displayed numeral back as a dot-decimal string. Only a minus before
 * the first digit counts as the sign. Upstream used `M` as a placeholder, so a
 * prefix such as `MXN` left in the value produced `-.5` for `-MXN 5`.
 */
export const unformatNumeral = (
  value: string,
  options: Pick<FormatNumeralOptions, 'numeralDecimalMark'> = {}
): string => {
  const mark = options.numeralDecimalMark || DEFAULT_NUMERAL_DECIMAL_MARK
  const markIndex = value.indexOf(mark)
  const integerPart = markIndex === -1 ? value : value.slice(0, markIndex)
  const sign = /^\D*-/.test(integerPart) ? '-' : ''
  const integer = integerPart.replace(/\D/g, '')
  return markIndex === -1
    ? sign + integer
    : sign + integer + '.' + value.slice(markIndex + mark.length).replace(/\D/g, '')
}
