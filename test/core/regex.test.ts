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
})