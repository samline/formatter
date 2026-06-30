import { describe, it, expect } from 'vitest'
import { regex } from '../../src/core/regex'

describe('regex', () => {
  describe('phone', () => {
    it('matches a 10-digit string', () => {
      expect(regex.phone.pattern.test('5512345678')).toBe(true)
    })

    it('matches with delimiters', () => {
      expect(regex.phone.pattern.test('(55) 1234-5678')).toBe(true)
    })

    it('rejects 9 digits', () => {
      expect(regex.phone.pattern.test('551234567')).toBe(false)
    })

    it('rejects 11 digits', () => {
      expect(regex.phone.pattern.test('55123456789')).toBe(false)
    })
  })

  describe('email', () => {
    it('matches a simple email', () => {
      expect(regex.email.pattern.test('foo@bar.com')).toBe(true)
    })

    it('rejects missing @', () => {
      expect(regex.email.pattern.test('foobar.com')).toBe(false)
    })

    it('rejects missing TLD', () => {
      expect(regex.email.pattern.test('foo@bar')).toBe(false)
    })
  })

  describe('rfc', () => {
    it('matches a 13-char RFC', () => {
      expect(regex.rfc.pattern.test('GODE561231GR8')).toBe(true)
    })

    it('rejects invalid format', () => {
      expect(regex.rfc.pattern.test('1234567890123')).toBe(false)
    })
  })

  describe('numeral', () => {
    it('matches an integer', () => {
      expect(regex.numeral.pattern.test('1234')).toBe(true)
    })

    it('matches a thousand-separated number', () => {
      expect(regex.numeral.pattern.test('1,234,567')).toBe(true)
    })

    it('matches a decimal', () => {
      expect(regex.numeral.pattern.test('1234.56')).toBe(true)
    })
  })

  describe('onlyNumbers', () => {
    it('matches digits only', () => {
      expect(regex.onlyNumbers.pattern.test('12345')).toBe(true)
    })

    it('rejects letters', () => {
      expect(regex.onlyNumbers.pattern.test('123a45')).toBe(false)
    })
  })

  describe('creditCard', () => {
    it('matches 16-digit Visa-like', () => {
      expect(regex.creditCard.pattern.test('4111111111111111')).toBe(true)
    })

    it('matches 15-digit Amex-like', () => {
      expect(regex.creditCard.pattern.test('378282246310005')).toBe(true)
    })

    it('rejects 14-digit', () => {
      expect(regex.creditCard.pattern.test('41111111111111')).toBe(false)
    })
  })

  describe('expirationDate', () => {
    it('matches MM/YY', () => {
      expect(regex.expirationDate.pattern.test('12/29')).toBe(true)
    })

    it('rejects month 13', () => {
      expect(regex.expirationDate.pattern.test('13/29')).toBe(false)
    })

    it('rejects month 00', () => {
      expect(regex.expirationDate.pattern.test('00/29')).toBe(false)
    })
  })

  describe('cardCvc', () => {
    it('matches 3 digits', () => {
      expect(regex.cardCvc.pattern.test('123')).toBe(true)
    })

    it('matches 4 digits', () => {
      expect(regex.cardCvc.pattern.test('1234')).toBe(true)
    })

    it('rejects 2 digits', () => {
      expect(regex.cardCvc.pattern.test('12')).toBe(false)
    })

    it('rejects 5 digits', () => {
      expect(regex.cardCvc.pattern.test('12345')).toBe(false)
    })
  })

  describe('onlyLetters', () => {
    it('matches plain letters', () => {
      expect(regex.onlyLetters.pattern.test('Hello World')).toBe(true)
    })

    it('matches accented characters', () => {
      expect(regex.onlyLetters.pattern.test('Niño')).toBe(true)
    })

    it('rejects digits', () => {
      expect(regex.onlyLetters.pattern.test('Hello123')).toBe(false)
    })
  })

  describe('onlyAlphanumeric', () => {
    it('matches letters and digits', () => {
      expect(regex.onlyAlphanumeric.pattern.test('Hello123')).toBe(true)
    })

    it('rejects punctuation', () => {
      expect(regex.onlyAlphanumeric.pattern.test('Hello, World!')).toBe(false)
    })
  })

  describe('error messages', () => {
    it('every regex has an errorMessage', () => {
      for (const [, entry] of Object.entries(regex)) {
        expect(typeof entry.errorMessage).toBe('string')
        expect(entry.errorMessage.length).toBeGreaterThan(0)
      }
    })
  })

  // ─── New rich validations (common ones) ─────────────────────────────────

  describe('url', () => {
    it('matches a https URL', () => {
      expect(regex.url.pattern.test('https://example.com')).toBe(true)
    })
    it('matches with path and query', () => {
      expect(regex.url.pattern.test('https://example.com/path?x=1')).toBe(true)
    })
    it('rejects missing protocol', () => {
      expect(regex.url.pattern.test('example.com')).toBe(false)
    })
  })

  describe('ipv4', () => {
    it('matches a valid IPv4', () => {
      expect(regex.ipv4.pattern.test('192.168.1.1')).toBe(true)
    })
    it('rejects 999', () => {
      expect(regex.ipv4.pattern.test('192.168.1.999')).toBe(false)
    })
  })

  describe('uuid', () => {
    it('matches a UUID v4', () => {
      expect(regex.uuid.pattern.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    })
    it('rejects malformed UUID', () => {
      expect(regex.uuid.pattern.test('not-a-uuid')).toBe(false)
    })
  })

  describe('postalCode', () => {
    it('matches a 5-digit ZIP', () => {
      expect(regex.postalCode.pattern.test('90210')).toBe(true)
    })
    it('rejects 4 digits', () => {
      expect(regex.postalCode.pattern.test('1234')).toBe(false)
    })
  })

  describe('time24', () => {
    it('matches 14:30', () => {
      expect(regex.time24.pattern.test('14:30')).toBe(true)
    })
    it('rejects 25:00', () => {
      expect(regex.time24.pattern.test('25:00')).toBe(false)
    })
  })

  describe('slug', () => {
    it('matches a slug', () => {
      expect(regex.slug.pattern.test('hello-world-123')).toBe(true)
    })
    it('rejects spaces', () => {
      expect(regex.slug.pattern.test('hello world')).toBe(false)
    })
  })

  // ─── Parametric / callable API ──────────────────────────────────────────

  describe('parametric: digits()', () => {
    it('accepts a single number for exact length', () => {
      expect(regex.digits(7).pattern.test('1234567')).toBe(true)
      expect(regex.digits(7).pattern.test('123')).toBe(false)
      expect(regex.digits(7).errorMessage).toContain('7')
    })
    it('accepts { length }', () => {
      expect(regex.digits({ length: 16 }).pattern.test('1234567890123456')).toBe(true)
    })
    it('accepts { min, max }', () => {
      expect(regex.digits({ min: 5, max: 10 }).pattern.test('12345')).toBe(true)
      expect(regex.digits({ min: 5, max: 10 }).pattern.test('1234')).toBe(false)
    })
  })

  describe('parametric: phone()', () => {
    it('still exposes static .pattern (backward compatible)', () => {
      expect(regex.phone.pattern.test('5512345678')).toBe(true)
    })
    it('accepts { length }', () => {
      expect(regex.phone({ length: 7 }).pattern.test('1234567')).toBe(true)
      expect(regex.phone({ length: 7 }).pattern.test('5512345678')).toBe(false)
    })
  })

  describe('parametric: creditCard()', () => {
    it('still exposes static .pattern', () => {
      expect(regex.creditCard.pattern.test('4111111111111111')).toBe(true)
    })
    it('accepts { min, max }', () => {
      expect(regex.creditCard({ min: 13, max: 19 }).pattern.test('4111111111111')).toBe(true)
    })
  })

  describe('parametric: url()', () => {
    it('accepts { protocol: "https" }', () => {
      expect(regex.url({ protocol: 'https' }).pattern.test('https://x.com')).toBe(true)
      expect(regex.url({ protocol: 'https' }).pattern.test('ftp://x.com')).toBe(false)
    })
  })

  describe('parametric: password()', () => {
    it('matches with default rules', () => {
      expect(regex.password().pattern.test('Passw0rd')).toBe(true)
    })
    it('accepts custom rules', () => {
      const r = regex.password({ min: 12, special: true })
      expect(r.pattern.test('MyP@ssw0rd!!')).toBe(true)
      expect(r.pattern.test('short')).toBe(false)
    })
  })

  // ─── Custom regex support ──────────────────────────────────────────────

  describe('custom regex', () => {
    it('accepts positional (pattern, message)', () => {
      const r = regex.custom(/^[A-Z]{3}\d{3}$/, 'Invalid code')
      expect(r.pattern.test('ABC123')).toBe(true)
      expect(r.pattern.test('abc123')).toBe(false)
      expect(r.errorMessage).toBe('Invalid code')
    })
    it('accepts object form', () => {
      const r = regex.custom({ pattern: /^\d+$/, errorMessage: 'Numbers only' })
      expect(r.pattern.test('123')).toBe(true)
      expect(r.errorMessage).toBe('Numbers only')
    })
    it('has default message when not provided', () => {
      const r = regex.custom(/^\d+$/)
      expect(typeof r.errorMessage).toBe('string')
    })
  })
})