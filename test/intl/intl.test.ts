import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatRelativeTime
} from '../../src/intl'
import { format } from '../../src'

// Intl output can contain narrow/no-break spaces; normalize for readability.
const s = (value: string): string => value.replace(/[  ]/g, ' ')

describe('intl: safe input handling', () => {
  it('returns an empty string for null, undefined and empty strings', () => {
    for (const fn of [formatNumber, formatPercent, formatDate, formatRelativeTime] as const) {
      expect(fn(null)).toBe('')
      expect(fn(undefined)).toBe('')
      expect(fn('')).toBe('')
    }
    expect(formatCurrency(null, { currency: 'MXN' })).toBe('')
  })

  it('returns the fallback instead of NaN or Invalid Date', () => {
    expect(formatNumber(NaN)).toBe('')
    expect(formatNumber('abc', { fallback: '—' })).toBe('—')
    expect(formatNumber('1,234')).toBe('') // formatted strings are not numbers
    expect(formatCurrency('x', { currency: 'USD', fallback: 'n/a' })).toBe('n/a')
    expect(formatDate(new Date('nope'), { fallback: '—' })).toBe('—')
    expect(formatDate('2026-02-30', { fallback: '—' })).toBe('—')
    expect(formatDate('not a date', { fallback: '—' })).toBe('—')
    expect(formatRelativeTime('nope', { fallback: '—' })).toBe('—')
  })

  it('still throws for invalid options', () => {
    // @ts-expect-error — currency is required
    expect(() => formatCurrency(1, {})).toThrow(TypeError)
    expect(() => formatCurrency(1, { currency: 'NOPE!' })).toThrow(RangeError)
  })
})

describe('intl: numbers', () => {
  it('formats en-US and es-MX numbers', () => {
    expect(formatNumber(1234567.891, { locale: 'en-US' })).toBe('1,234,567.891')
    expect(formatNumber(1234.5, { locale: 'es-MX', decimals: 2 })).toBe('1,234.50')
    expect(formatNumber(1234.5, { locale: 'de-DE', decimals: 2 })).toBe('1.234,50')
    expect(formatNumber(1.23456, { locale: 'en-US', maxDecimals: 2 })).toBe('1.23')
    expect(formatNumber(1, { locale: 'en-US', minDecimals: 1 })).toBe('1.0')
  })

  it('supports compact notation, sign display and bigint', () => {
    expect(formatNumber(1234, { locale: 'en-US', notation: 'compact' })).toBe('1.2K')
    expect(s(formatNumber(1234, { locale: 'es-MX', notation: 'compact' }))).toBe('1.2 k')
    expect(formatNumber(5, { locale: 'en-US', signDisplay: 'always' })).toBe('+5')
    expect(formatNumber(12345678901234567890n, { locale: 'en-US' })).toBe('12,345,678,901,234,567,890')
  })

  it("reads formatter's numeral raw strings", () => {
    const { raw } = format('1,234.5', 'numeral')
    expect(formatNumber(raw, { locale: 'es-MX', decimals: 2 })).toBe('1,234.50')
    expect(formatNumber(' -12.5 ', { locale: 'en-US' })).toBe('-12.5')
  })
})

describe('intl: currency and percent', () => {
  it('formats currencies by locale and display', () => {
    expect(formatCurrency(1234.5, { locale: 'es-MX', currency: 'MXN' })).toBe('$1,234.50')
    expect(formatCurrency(1234.5, { locale: 'en-US', currency: 'USD' })).toBe('$1,234.50')
    expect(s(formatCurrency(2, { locale: 'es-MX', currency: 'USD' }))).toBe('USD 2.00')
    expect(s(formatCurrency(2, { locale: 'en-US', currency: 'MXN', display: 'code' }))).toBe('MXN 2.00')
    expect(formatCurrency(2, { locale: 'en-US', currency: 'USD', display: 'name' })).toBe('2.00 US dollars')
    expect(formatCurrency(1234.567, { locale: 'en-US', currency: 'USD', decimals: 0 })).toBe('$1,235')
    expect(formatCurrency(-5, { locale: 'en-US', currency: 'USD', currencySign: 'accounting' })).toBe('($5.00)')
  })

  it('formats ratios as percentages', () => {
    expect(formatPercent(0.256, { locale: 'en-US' })).toBe('26%')
    expect(formatPercent(0.256, { locale: 'en-US', decimals: 1 })).toBe('25.6%')
    expect(s(formatPercent(0.256, { locale: 'es-MX', decimals: 1 }))).toBe('25.6%')
  })
})

describe('intl: dates', () => {
  const date = new Date(2026, 10, 12, 15, 30)

  it('formats presets in en-US and es-MX', () => {
    expect(formatDate(date, { locale: 'en-US' })).toBe('Nov 12, 2026')
    expect(formatDate(date, { locale: 'en-US', preset: 'short' })).toBe('11/12/26')
    expect(formatDate(date, { locale: 'es-MX', preset: 'long' })).toBe('12 de noviembre de 2026')
    expect(formatDate(date, { locale: 'es-MX', preset: 'full' })).toBe('jueves, 12 de noviembre de 2026')
  })

  it('accepts Intl.DateTimeFormat options, which override the preset', () => {
    expect(formatDate(date, { locale: 'en-US', month: 'short', day: 'numeric', preset: 'full' })).toBe('Nov 12')
    expect(formatDate(date, { locale: 'es-MX', weekday: 'long' })).toBe('jueves')
    expect(formatDate(Date.UTC(2026, 10, 12, 3), { locale: 'en-US', timeZone: 'UTC', preset: 'medium' })).toBe(
      'Nov 12, 2026'
    )
    expect(s(formatDate(date, { locale: 'en-US', preset: 'medium', timeStyle: 'short' }))).toBe('Nov 12, 2026, 3:30 PM')
  })

  it("reads timestamps, ISO strings and formatter's date raw strings as local dates", () => {
    expect(formatDate(date.getTime(), { locale: 'en-US' })).toBe('Nov 12, 2026')
    // A date-only string is a calendar date, never shifted by the UTC offset.
    expect(formatDate('2026-11-12', { locale: 'en-US' })).toBe('Nov 12, 2026')
    expect(formatDate('20261112', { locale: 'en-US' })).toBe('Nov 12, 2026')
    expect(formatDate('2026-11-12T15:30:00', { locale: 'en-US' })).toBe('Nov 12, 2026')

    const { raw } = format('12/11/2026', 'date', { datePattern: ['d', 'm', 'Y'], dateRawPattern: ['Y', 'm', 'd'] })
    expect(raw).toBe('2026-11-12')
    expect(formatDate(raw, { locale: 'es-MX', preset: 'long' })).toBe('12 de noviembre de 2026')
  })

  it('reads digit strings with a custom pattern', () => {
    expect(formatDate('12/11/2026', { locale: 'en-US', pattern: ['d', 'm', 'Y'] })).toBe('Nov 12, 2026')
    expect(formatDate('11/26', { locale: 'en-US', pattern: ['m', 'y'], month: 'long', year: 'numeric' })).toBe(
      'November 2026'
    )
    expect(formatDate('0099-01-01', { locale: 'en-US', year: 'numeric' })).toBe('99')
    expect(formatDate('12/11', { pattern: ['d', 'm'], fallback: '—' })).toBe('—') // no year
  })
})

describe('intl: relative time', () => {
  const now = new Date(2026, 10, 12, 12, 0, 0)
  const at = (seconds: number) => new Date(now.getTime() + seconds * 1000)

  it('picks the unit automatically', () => {
    expect(formatRelativeTime(at(0), { now, locale: 'en-US' })).toBe('now')
    expect(formatRelativeTime(at(-30), { now, locale: 'en-US' })).toBe('30 seconds ago')
    expect(formatRelativeTime(at(2 * 3600), { now, locale: 'en-US' })).toBe('in 2 hours')
    expect(formatRelativeTime(at(-3 * 86400), { now, locale: 'es-MX' })).toBe('hace 3 días')
    expect(formatRelativeTime(at(-86400), { now, locale: 'es-MX' })).toBe('ayer')
    expect(formatRelativeTime(at(10 * 86400), { now, locale: 'en-US' })).toBe('next week')
    expect(formatRelativeTime(at(-45 * 86400), { now, locale: 'en-US' })).toBe('last month')
    expect(formatRelativeTime(at(-800 * 86400), { now, locale: 'en-US' })).toBe('2 years ago')
  })

  it('promotes values that round up to the next unit', () => {
    expect(formatRelativeTime(at(59.6 * 60), { now, locale: 'en-US' })).toBe('in 1 hour')
    expect(formatRelativeTime(at(-23.7 * 3600), { now, locale: 'en-US' })).toBe('yesterday')
  })

  it('supports a forced unit, numeric always and styles', () => {
    expect(formatRelativeTime(at(-86400), { now, locale: 'en-US', numeric: 'always' })).toBe('1 day ago')
    expect(formatRelativeTime(at(-3 * 86400), { now, locale: 'en-US', unit: 'hour' })).toBe('72 hours ago')
    expect(formatRelativeTime(at(3 * 60), { now, locale: 'en-US', style: 'short' })).toBe('in 3 min.')
    expect(formatRelativeTime('2026-11-15', { now, locale: 'en-US', unit: 'day' })).toBe('in 3 days')
  })
})
