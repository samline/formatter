import { describe, it, expect } from 'vitest'
import {
  getRawValue,
  getDateValueFromRaw,
  getTimeValueFromRaw,
  stripPrefixAndSuffix,
  type FormatOptions
} from '../../src/core/raw'

describe('getRawValue', () => {
  describe('phone', () => {
    it('returns only digits and +', () => {
      expect(getRawValue('+52 (55) 1234-5678', 'phone')).toBe('+525512345678')
    })

    it('returns empty for empty input', () => {
      expect(getRawValue('', 'phone')).toBe('')
    })
  })

  describe('numeral', () => {
    it('strips thousand separators', () => {
      expect(getRawValue('1,234,567', 'numeral')).toBe('1234567')
    })

    it('preserves decimal mark', () => {
      expect(
        getRawValue('1,234.50', 'numeral', { numeralDecimalMark: '.' })
      ).toBe('1234.50')
    })
  })

  describe('creditCard', () => {
    it('strips spaces and dashes', () => {
      expect(getRawValue('4111 1111 1111 1111', 'creditCard')).toBe(
        '4111111111111111'
      )
    })
  })

  describe('general', () => {
    it('strips delimiter', () => {
      const opts: FormatOptions = { delimiter: ' ' }
      expect(getRawValue('1234 5678', 'general', opts)).toBe('12345678')
    })

    it('strips multiple delimiters', () => {
      const opts: FormatOptions = { delimiters: [' ', '-'] }
      expect(getRawValue('1234-5678 9012', 'general', opts)).toBe('123456789012')
    })
  })

  describe('date', () => {
    it('converts d/m/Y to Y-m-d', () => {
      expect(getRawValue('12/05/2026', 'date')).toBe('2026-05-12')
    })

    it('honors a custom raw pattern', () => {
      expect(
        getRawValue('12-05-2026', 'date', { dateRawPatternDelimiter: '-' })
      ).toBe('2026-05-12')
    })
  })

  describe('time', () => {
    it('converts h/m/s to h/m', () => {
      expect(getRawValue('14:30:00', 'time')).toBe('14:30')
    })
  })

  describe('unknown formatType', () => {
    it('falls back to stripping whitespace', () => {
      expect(
        // @ts-expect-error — testing runtime fallback
        getRawValue('a b c', 'bogus')
      ).toBe('abc')
    })
  })
})

describe('getDateValueFromRaw', () => {
  it('rearranges Y-m-d segments into d/m/Y order (digits only)', () => {
    // Returns digits-only because the consumer (formatDate) re-applies delimiters.
    expect(getDateValueFromRaw('2026-05-12')).toBe('12052026')
  })

  it('honors custom datePattern', () => {
    expect(
      getDateValueFromRaw('2026-05-12', { datePattern: ['Y', 'm', 'd'] })
    ).toBe('20260512')
  })

  it('passes short segments through', () => {
    // Short month/day are not zero-padded at this stage.
    expect(getDateValueFromRaw('2026-5-2')).toBe('522026')
  })

  it('returns empty for empty input', () => {
    expect(getDateValueFromRaw('')).toBe('')
  })
})

describe('getTimeValueFromRaw', () => {
  it('rearranges h:m into h/m pattern (digits only)', () => {
    // Returns digits-only because the consumer (formatTime) re-applies delimiters.
    expect(getTimeValueFromRaw('14:30')).toBe('1430')
  })

  it('honors custom timePattern', () => {
    expect(
      getTimeValueFromRaw('14:30', { timePattern: ['h', 'm'] })
    ).toBe('1430')
  })

  it('returns empty for empty input', () => {
    expect(getTimeValueFromRaw('')).toBe('')
  })
})

describe('stripPrefixAndSuffix', () => {
  it('returns value unchanged when no prefix', () => {
    expect(stripPrefixAndSuffix('hello')).toBe('hello')
  })

  it('returns empty unchanged', () => {
    expect(stripPrefixAndSuffix('', { prefix: '$' })).toBe('')
  })

  it('strips a leading prefix', () => {
    expect(stripPrefixAndSuffix('$100', { prefix: '$' })).toBe('100')
  })

  it('strips a tailPrefix (suffix) when tailPrefix: true', () => {
    expect(
      stripPrefixAndSuffix('100 USD', { prefix: ' USD', tailPrefix: true })
    ).toBe('100')
  })

  it('leaves value untouched when prefix not present', () => {
    expect(stripPrefixAndSuffix('hello', { prefix: '$' })).toBe('hello')
  })

  it('does not strip leading prefix when tailPrefix: true', () => {
    expect(
      stripPrefixAndSuffix('USD 100', { prefix: 'USD', tailPrefix: true })
    ).toBe('USD 100')
  })
})