import { describe, expect, it } from 'vitest'
import {
  formatCreditCard,
  formatDate,
  formatGeneral,
  formatNumeral,
  formatTime,
  getCreditCardType,
  unformatCreditCard,
  unformatGeneral,
  unformatNumeral,
} from '../../src/core/engine/index'

// Expected values were recorded from cleave-zen 0.0.17 before it was removed
// (a 100k-case randomized comparison matched the port exactly).

describe('engine: numeral', () => {
  it('groups thousands and limits decimals by default', () => {
    expect(formatNumeral('1234567.891')).toBe('1,234,567.89')
    expect(formatNumeral('-0001234')).toBe('-1,234')
    expect(formatNumeral('12a3b4')).toBe('1,234')
    expect(formatNumeral('1.2.3')).toBe('1.23')
  })

  it('supports every grouping style', () => {
    expect(formatNumeral('123456789', { numeralThousandsGroupStyle: 'lakh' })).toBe('12,34,56,789')
    expect(formatNumeral('123456789', { numeralThousandsGroupStyle: 'wan' })).toBe('1,2345,6789')
    expect(formatNumeral('123456789', { numeralThousandsGroupStyle: 'none' })).toBe('123456789')
  })

  it('applies marks, scales, sign and prefix options', () => {
    expect(formatNumeral('1234,5', { numeralDecimalMark: ',', delimiter: '.' })).toBe('1.234,5')
    expect(formatNumeral('123456.789', { numeralIntegerScale: 3, numeralDecimalScale: 1 })).toBe(
      '123.7'
    )
    expect(formatNumeral('12.5', { numeralDecimalScale: 0 })).toBe('12')
    expect(formatNumeral('-5', { numeralPositiveOnly: true })).toBe('5')
    expect(formatNumeral('00012', { stripLeadingZeroes: false })).toBe('00,012')
    expect(formatNumeral('-5', { prefix: '$' })).toBe('$-5')
    expect(formatNumeral('-5', { prefix: '$', signBeforePrefix: true })).toBe('-$5')
    expect(formatNumeral('-5', { prefix: ' USD', tailPrefix: true })).toBe('-5 USD')
  })

  it('unformats to a dot-decimal string', () => {
    expect(unformatNumeral('$1,234.56')).toBe('1234.56')
    expect(unformatNumeral('1.234,56', { numeralDecimalMark: ',' })).toBe('1234.56')
  })
})

describe('engine: numeral decimal padding', () => {
  const pad = { numeralDecimalPadding: true } as const

  it('is off by default', () => {
    expect(formatNumeral('1234.5')).toBe('1,234.5')
  })

  it('pads integers and partial decimals to numeralDecimalScale', () => {
    expect(formatNumeral('1234567.5', pad)).toBe('1,234,567.50')
    expect(formatNumeral('1234', pad)).toBe('1,234.00')
    expect(formatNumeral('1234.', pad)).toBe('1,234.00')
    expect(formatNumeral('.5', pad)).toBe('0.50')
    expect(formatNumeral('1.5', { ...pad, numeralDecimalScale: 4 })).toBe('1.5000')
  })

  it('keeps sign, prefix, tail prefix and custom marks', () => {
    expect(formatNumeral('-1234.5', pad)).toBe('-1,234.50')
    expect(formatNumeral('1234.5', { ...pad, prefix: '$' })).toBe('$1,234.50')
    expect(formatNumeral('-12', { ...pad, prefix: '$', signBeforePrefix: true })).toBe('-$12.00')
    expect(formatNumeral('12', { ...pad, prefix: ' MXN', tailPrefix: true })).toBe('12.00 MXN')
    expect(formatNumeral('1234,5', { ...pad, numeralDecimalMark: ',', delimiter: '.' })).toBe(
      '1.234,50'
    )
  })

  it('leaves values without digits and zero-scale numbers alone', () => {
    expect(formatNumeral('', pad)).toBe('')
    expect(formatNumeral('-', pad)).toBe('-')
    expect(formatNumeral('abc', { ...pad, prefix: '$' })).toBe('$')
    expect(formatNumeral('12.5', { ...pad, numeralDecimalScale: 0 })).toBe('12')
  })
})

describe('engine: date', () => {
  it('formats and clamps segments by pattern', () => {
    expect(formatDate('12052026')).toBe('12/05/2026')
    expect(formatDate('4')).toBe('04/')
    expect(formatDate('00')).toBe('01/')
    expect(formatDate('3113')).toBe('31/12/')
    expect(formatDate('20260512', { datePattern: ['Y', 'm', 'd'], delimiter: '-' })).toBe(
      '2026-05-12'
    )
    expect(formatDate('0526', { datePattern: ['m', 'y'] })).toBe('05/26')
  })

  it('fixes impossible days for the month and leap years', () => {
    expect(formatDate('31042026')).toBe('30/04/2026')
    expect(formatDate('29022025')).toBe('28/02/2025')
    expect(formatDate('29022024')).toBe('29/02/2024')
  })

  it('applies dateMin and dateMax', () => {
    expect(formatDate('01011990', { dateMin: '2000-01-01' })).toBe('01/01/2000')
    expect(formatDate('01012040', { dateMax: '2030-12-31' })).toBe('31/12/2030')
  })

  it('supports lazy delimiters', () => {
    expect(formatDate('1205', { delimiterLazyShow: true })).toBe('12/05')
    expect(formatDate('12', { delimiterLazyShow: true })).toBe('12')
    expect(formatDate('12')).toBe('12/')
  })
})

describe('engine: time', () => {
  it('formats and clamps 24-hour values', () => {
    expect(formatTime('143000')).toBe('14:30:00')
    expect(formatTime('9')).toBe('09:')
    expect(formatTime('2961')).toBe('23:06:')
    expect(formatTime('1430', { timePattern: ['h', 'm'] })).toBe('14:30')
  })

  it('formats 12-hour values', () => {
    expect(formatTime('1530', { timePattern: ['h', 'm'], timeFormat: '12' })).toBe('12:30')
    expect(formatTime('1259', { timePattern: ['h', 'm'], timeFormat: '12' })).toBe('12:59')
  })
})

describe('engine: credit card', () => {
  it('detects brands and their blocks', () => {
    expect(getCreditCardType('4111')).toBe('visa')
    expect(getCreditCardType('3782')).toBe('amex')
    expect(getCreditCardType('5555')).toBe('mastercard')
    expect(getCreditCardType('2200')).toBe('mir')
    expect(getCreditCardType('9999')).toBe('general')
    expect(formatCreditCard('378282246310005')).toBe('3782 822463 10005')
    expect(formatCreditCard('41111111111111119999')).toBe('4111 1111 1111 1111')
  })

  it('supports strict mode and custom delimiters', () => {
    expect(formatCreditCard('4111111111111111999', { strictMode: true })).toBe(
      '4111 1111 1111 1111 999'
    )
    expect(formatCreditCard('4111111111111111', { delimiter: '-' })).toBe('4111-1111-1111-1111')
    expect(unformatCreditCard('4111 1111')).toBe('41111111')
  })
})

describe('engine: general', () => {
  it('applies blocks, delimiters, prefix and case options', () => {
    expect(formatGeneral('123456789', { blocks: [3, 3, 3], delimiter: '-' })).toBe('123-456-789')
    expect(formatGeneral('12345678', { blocks: [2, 3, 3], delimiters: ['.', '-'] })).toBe(
      '12.345-678'
    )
    expect(formatGeneral('ab12cd', { blocks: [2, 2], numericOnly: true })).toBe('12')
    expect(formatGeneral('abcd', { blocks: [2, 2], delimiter: ' ', uppercase: true })).toBe('AB CD')
    expect(formatGeneral('EASY123', { blocks: [4, 3], prefix: 'EASY' })).toBe('EASY123')
    expect(unformatGeneral('12.345-678', { delimiters: ['.', '-'] })).toBe('12345678')
  })

  it('never mutates the caller delimiters array', () => {
    const delimiters = ['.']
    formatGeneral('1234', { blocks: [2, 2], delimiter: '-', delimiters })
    formatGeneral('1234', { blocks: [2, 2], delimiter: '-', delimiters })
    expect(delimiters).toEqual(['.'])
  })
})

describe('engine: 3.0.0 audit fixes', () => {
  it('reads raw numerals without the upstream M placeholder collision', () => {
    expect(unformatNumeral('-MXN 5')).toBe('-5')
    expect(unformatNumeral('-M5.5')).toBe('-5.5')
    expect(unformatNumeral('12-3')).toBe('123')
    expect(unformatNumeral('$-1,234.5')).toBe('-1234.5')
    expect(unformatNumeral('-')).toBe('-')
    expect(unformatNumeral('1234.')).toBe('1234.')
  })

  it('defaults to dot grouping when the decimal mark is a comma', () => {
    expect(formatNumeral('1234,5', { numeralDecimalMark: ',' })).toBe('1.234,5')
    expect(formatNumeral('1234,5', { numeralDecimalMark: ',', delimiter: ' ' })).toBe('1 234,5')
  })

  it('treats an empty decimal mark as the default dot', () => {
    expect(formatNumeral('5.25', { numeralDecimalMark: '' })).toBe('5.25')
    expect(unformatNumeral('5', { numeralDecimalMark: '' })).toBe('5')
  })

  it('limits Mastercard 2-series detection to 2221–2720', () => {
    expect(getCreditCardType('2220')).toBe('general')
    expect(getCreditCardType('2221')).toBe('mastercard')
    expect(getCreditCardType('2720')).toBe('mastercard')
    expect(getCreditCardType('2721')).toBe('general')
    expect(getCreditCardType('2799')).toBe('general')
    // Partial prefixes still resolve while typing.
    expect(getCreditCardType('222')).toBe('mastercard')
    expect(getCreditCardType('27')).toBe('mastercard')
    expect(getCreditCardType('272')).toBe('mastercard')
  })

  it('has no hour 00 on a 12-hour clock', () => {
    expect(formatTime('0030', { timePattern: ['h', 'm'], timeFormat: '12' })).toBe('12:30')
    expect(formatTime('0030', { timePattern: ['h', 'm'] })).toBe('00:30')
  })
})
