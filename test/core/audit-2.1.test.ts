import { describe, it, expect } from 'vitest'
import { format, formatPhone, regex } from '../../src'

// Regression guards for the 2.1.0 audit.
describe('2.1.0 audit regressions', () => {
  describe('general format configuration', () => {
    it('explains a missing blocks array instead of throwing from cleave-zen', () => {
      expect(() => format('abc', 'general')).toThrow(/requires a non-empty `blocks` array/)
      expect(() => format('abc', 'general', { blocks: [] })).toThrow(TypeError)
    })

    it('still returns an empty result for an empty value without blocks', () => {
      expect(format('', 'general')).toEqual({ formatted: '', raw: '', type: 'general' })
    })
  })

  describe('locked decorations after a single deletion', () => {
    it('restores a locked suffix when Backspace removes its last character', () => {
      const result = format('100 US', 'general', { blocks: [6], suffix: ' USD' })
      expect(result).toMatchObject({ formatted: '100 USD', raw: '100' })
    })

    it('restores a locked suffix when one inner character is deleted', () => {
      expect(format('100 UD', 'general', { blocks: [6], suffix: ' USD' }).formatted).toBe('100 USD')
    })

    it('restores a locked prefix when one of its characters is deleted', () => {
      const result = format('EAS1234', 'general', { blocks: [8], prefix: 'EASY' })
      expect(result).toMatchObject({ formatted: 'EASY1234', raw: '1234' })
      expect(format('ASY1234', 'general', { blocks: [8], prefix: 'EASY' }).formatted).toBe('EASY1234')
    })

    it('does not treat single-character decorations as damaged', () => {
      expect(format('12', 'general', { blocks: [4], suffix: '%' }).formatted).toBe('12%')
    })

    it('leaves passthrough partial typing unchanged', () => {
      expect(
        format('12345US', 'general', { blocks: [12], suffix: 'USD', suffixMode: 'passthrough' }).formatted
      ).toBe('12345US')
    })
  })

  it('strips every configured delimiter from a canonical raw value', () => {
    const result = format('12345678', 'general', {
      prefix: 'ID-',
      blocks: [4, 4],
      delimiters: ['.'],
      rawPrefix: true
    })
    expect(result).toMatchObject({ formatted: 'ID-1234.5678', raw: 'ID-12345678' })
  })

  it('accepts lower-case country codes for phones', () => {
    expect(formatPhone('2025550123', 'us')).toBe(formatPhone('2025550123', 'US'))
    expect(format('5512345678', 'phone', { country: 'mx' }).formatted).toBe('55 1234 5678')
  })

  describe('regex', () => {
    it('anchors the numeral pattern to the whole value', () => {
      expect(regex.numeral.pattern.test('abc1x')).toBe(false)
      expect(regex.numeral.pattern.test('1,234,567.89')).toBe(true)
      expect(regex.numeral.pattern.test('-42')).toBe(true)
      expect(regex.numeral.pattern.test('12,34')).toBe(false)
    })

    it('treats password rules as requirements, not an allow-list', () => {
      expect(regex.password().pattern.test('Passw0rd!')).toBe(true)
      expect(regex.password().pattern.test('Pass w0rd')).toBe(false)
      expect(regex.password({ min: 12, special: true }).pattern.test('MyP@ssw0rd!2')).toBe(true)
    })

    it('builds a usable password policy when every rule is disabled', () => {
      const entry = regex.password({ uppercase: false, lowercase: false, numbers: false, min: 4 })
      expect(entry.pattern.test('abcd')).toBe(true)
      expect(entry.errorMessage).toBe('Password must be 4-128 characters.')
    })

    it('rejects impossible ranges with a RangeError', () => {
      expect(() => regex.digits({ min: 5, max: 2 })).toThrow(RangeError)
      expect(() => regex.phone({ length: -1 })).toThrow(RangeError)
      expect(() => regex.creditCard({ min: 19, max: 13 })).toThrow(RangeError)
      expect(() => regex.password({ min: 1.5 })).toThrow(RangeError)
    })
  })
})

describe('2.1.0 audit: idempotent decorated raw values', () => {
  const options = { prefix: 'ORD-', blocks: [4, 4], delimiter: '-', numericOnly: true }

  it('returns the same raw when a displayed value is formatted again', () => {
    const first = format('12345678', 'general', options)
    const again = format(first.formatted, 'general', options)
    expect(first).toMatchObject({ formatted: 'ORD-1234-5678', raw: '12345678' })
    expect(again).toEqual(first)
  })

  it('keeps a partial displayed value free of delimiters', () => {
    expect(format('ORD-1234-567', 'general', options).raw).toBe('1234567')
  })

  it('removes the formatter delimiters from a suffix-decorated body', () => {
    const suffixed = { suffix: ' USD', blocks: [3, 3], delimiter: ',' }
    const first = format('100200', 'general', suffixed)
    expect(first.formatted).toBe('100,200 USD')
    expect(format(first.formatted, 'general', suffixed).raw).toBe('100200')
  })
})

describe('2.1.0 audit: case transforms and decorations', () => {
  const promo = { blocks: [8], prefix: 'SAVE', prefixMode: 'passthrough' as const, uppercase: true }

  it('recognizes a passthrough prefix typed in lower case', () => {
    expect(format('save20', 'general', promo)).toMatchObject({ formatted: 'SAVE20', raw: '20' })
    expect(format('s', 'general', promo).formatted).toBe('S')
  })

  it('recognizes a locked prefix pasted in another case', () => {
    expect(format('ord-12', 'general', { prefix: 'ORD-', blocks: [4], uppercase: true }).formatted).toBe(
      'ORD-12'
    )
  })
})
