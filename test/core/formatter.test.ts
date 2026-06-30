import { describe, it, expect } from 'vitest'
import { format, FORMAT_TYPES, isFormatType } from '../../src/core/formatter'

describe('format', () => {
  describe('empty / nullish input', () => {
    it('returns empty strings for null', () => {
      const result = format(null, 'general')
      expect(result).toEqual({ formatted: '', raw: '', type: 'general' })
    })

    it('returns empty strings for undefined', () => {
      const result = format(undefined, 'general')
      expect(result).toEqual({ formatted: '', raw: '', type: 'general' })
    })

    it('returns empty strings for empty string', () => {
      const result = format('', 'general')
      expect(result).toEqual({ formatted: '', raw: '', type: 'general' })
    })
  })

  describe('invalid formatType', () => {
    it('throws TypeError', () => {
      // @ts-expect-error — testing runtime guard
      expect(() => format('hello', 'bogus')).toThrow(TypeError)
    })

    it('throws with the list of valid types in the message', () => {
      // @ts-expect-error — testing runtime guard
      expect(() => format('hello', 'bogus')).toThrow(/general.*phone.*numeral/)
    })
  })

  describe('general', () => {
    it('formats with delimiter', () => {
      const result = format('1234567890', 'general', {
        blocks: [4, 4, 4, 4],
        delimiter: ' '
      })
      expect(result.type).toBe('general')
      expect(result.formatted).toBe('1234 5678 90')
    })

    it('returns digits-only raw value', () => {
      const result = format('1234 5678 90', 'general', {
        blocks: [4, 4, 4, 4],
        delimiter: ' '
      })
      expect(result.raw).toBe('1234567890')
    })
  })

  describe('phone', () => {
    it('formats a 10-digit number with default MX country', () => {
      const result = format('5512345678', 'phone')
      expect(result.type).toBe('phone')
      expect(result.formatted).toBe('55 1234 5678')
    })

    it('returns digits-only raw value preserving +', () => {
      const result = format('+52 1 55 1234 5678', 'phone')
      expect(result.raw).toMatch(/^\+\d+$/)
    })

    it('uses a custom delimiter when provided', () => {
      const result = format('5512345678', 'phone', { delimiter: '-' })
      expect(result.formatted).not.toContain(' ')
      expect(result.formatted).toContain('-')
    })

    it('uses a custom country when provided', () => {
      const result = format('2025551234', 'phone', { country: 'US' })
      expect(result.formatted).toBeTruthy()
      expect(result.raw).toBe('2025551234')
    })
  })

  describe('numeral', () => {
    it('formats with thousand separators', () => {
      const result = format('1234567', 'numeral')
      expect(result.type).toBe('numeral')
      expect(result.formatted).toMatch(/1,234,567|1\.234\.567/)
    })

    it('returns digits-only raw value', () => {
      const result = format('1,234,567.89', 'numeral')
      expect(result.raw).toBe('1234567.89')
    })

    it('honors custom decimal mark', () => {
      const result = format('1234.5', 'numeral', { numeralDecimalMark: '.' })
      expect(result.raw).toBe('1234.5')
    })
  })

  describe('date', () => {
    it('formats a raw ISO date to display pattern (d/m/Y by default)', () => {
      const result = format('2026-05-12', 'date')
      expect(result.type).toBe('date')
      expect(result.formatted).toBe('12/05/2026')
    })

    it('returns raw value in Y-m-d order (round-trip from formatted display)', () => {
      const result = format('2026-05-12', 'date')
      expect(result.raw).toBe('2026-05-12')
    })

    it('honors a custom datePattern with custom delimiter', () => {
      const result = format('20260512', 'date', {
        datePattern: ['Y', 'm', 'd'],
        delimiter: '-'
      })
      expect(result.formatted).toBe('2026-05-12')
      expect(result.raw).toBe('2026-05-12')
    })
  })

  describe('time', () => {
    it('formats a raw time to display pattern (h/m/s by default)', () => {
      const result = format('14:30', 'time')
      expect(result.type).toBe('time')
      // cleave-zen emits `14:30:` (empty trailing seconds, not padded).
      expect(result.formatted).toBe('14:30:')
    })

    it('returns raw value', () => {
      const result = format('14:30:00', 'time')
      expect(result.raw).toBe('14:30')
    })
  })

  describe('creditCard', () => {
    it('formats a 16-digit card number', () => {
      const result = format('4111111111111111', 'creditCard')
      expect(result.type).toBe('creditCard')
      expect(result.formatted).toBe('4111 1111 1111 1111')
    })

    it('returns digits-only raw value', () => {
      const result = format('4111 1111 1111 1111', 'creditCard')
      expect(result.raw).toBe('4111111111111111')
    })
  })

  describe('creditCardType', () => {
    it('detects visa', () => {
      const result = format('4111111111111111', 'creditCardType')
      expect(result.type).toBe('creditCardType')
      expect(result.formatted.toLowerCase()).toContain('visa')
    })

    it('returns digits-only raw value (derived from input, not card-brand output)', () => {
      const result = format('4111-1111-1111-1111', 'creditCardType')
      expect(result.raw).toBe('4111111111111111')
    })
  })

  describe('non-string input', () => {
    it('stringifies numbers', () => {
      const result = format(12345, 'general', { blocks: [5] })
      expect(result.formatted).toBe('12345')
      expect(result.raw).toBe('12345')
    })

    it('stringifies booleans', () => {
      const result = format(true, 'general', { blocks: [4] })
      expect(result.formatted).toBe('true')
    })
  })

  describe('prefix / tailPrefix', () => {
    it('strips prefix before computing raw', () => {
      const result = format('$1,234.50', 'numeral', {
        prefix: '$',
        numeralDecimalMark: '.'
      })
      expect(result.formatted).toContain('1,234')
      expect(result.raw).toBe('1234.50')
    })

    it('strips tailPrefix (suffix) before computing raw', () => {
      const result = format('1234.50 USD', 'numeral', {
        prefix: ' USD',
        tailPrefix: true,
        numeralDecimalMark: '.'
      })
      expect(result.raw).toBe('1234.50')
    })
  })
})

describe('FORMAT_TYPES', () => {
  it('contains exactly the seven supported types', () => {
    expect(FORMAT_TYPES).toEqual([
      'general',
      'phone',
      'numeral',
      'date',
      'time',
      'creditCard',
      'creditCardType'
    ])
  })
})

describe('isFormatType', () => {
  it('returns true for each supported type', () => {
    for (const t of FORMAT_TYPES) {
      expect(isFormatType(t)).toBe(true)
    }
  })

  it('returns false for unknown strings', () => {
    expect(isFormatType('bogus')).toBe(false)
    expect(isFormatType('')).toBe(false)
  })

  it('returns false for non-strings', () => {
    expect(isFormatType(null)).toBe(false)
    expect(isFormatType(undefined)).toBe(false)
    expect(isFormatType(123)).toBe(false)
    expect(isFormatType({})).toBe(false)
  })
})