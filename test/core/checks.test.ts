import { describe, expect, it } from 'vitest'
import {
  isLuhn,
  isValidCard,
  isValidClabe,
  isValidCurp,
  isValidDniEs,
  isValidIban,
  isValidNss,
  isValidRfc,
  isValidRoutingNumber,
} from '../../src/core/checks'
import { regex } from '../../src/core/regex'

type Check = (value: unknown) => boolean
const expectAll = (check: Check, cases: [unknown, boolean][]): void => {
  for (const [value, expected] of cases) expect([value, check(value)]).toEqual([value, expected])
}

/** Every single-digit change must break a mod-10/mod-11/mod-97 checksum. */
const expectCatchesTypos = (check: Check, valid: string): void => {
  for (let index = 0; index < valid.length; index++) {
    const char = valid[index]!
    if (!/\d/.test(char)) continue
    for (let digit = 0; digit <= 9; digit++) {
      if (String(digit) === char) continue
      const typo = valid.slice(0, index) + digit + valid.slice(index + 1)
      expect([typo, check(typo)]).toEqual([typo, false])
    }
  }
}

describe('check-digit validators', () => {
  it('isLuhn and isValidCard', () => {
    expectAll(isValidCard, [
      ['4111 1111 1111 1111', true],
      ['4111-1111-1111-1111', true],
      ['378282246310005', true],
      ['30569309025904', true],
      ['6011000990139424', true],
      ['4111111111111112', false],
      ['79927398713', false],
      [4111111111111111, false],
      [null, false],
    ])
    expect(isLuhn('79927398713')).toBe(true)
    expect(isLuhn('0')).toBe(false)
    expectCatchesTypos(isValidCard, '4111111111111111')
  })

  it('isValidClabe', () => {
    expectAll(isValidClabe, [
      ['002010077777777771', true],
      ['032180000118359719', true],
      ['002 010 07777777777 1', true],
      ['002010077777777772', false],
      ['00201007777777777', false],
    ])
    expectCatchesTypos(isValidClabe, '002010077777777771')
  })

  it('isValidNss', () => {
    expectAll(isValidNss, [
      ['12345678903', true],
      ['12345678901', false],
      ['1234567890', false],
    ])
  })

  it('isValidCurp', () => {
    expectAll(isValidCurp, [
      ['HEGG560427MVZRRL04', true],
      ['hegg560427mvzrrl04', true],
      ['HEGG560427MVZRRL05', false],
      ['HEGG561327MVZRRL04', false],
      ['GODE561231HDFRRN00', true],
    ])
    // RENAPO's mod-10 digit cannot see the 9th character (weight 10) and
    // misses a change of exactly 5 where the weight is even; every other
    // single-digit typo is caught.
    const valid = 'HEGG560427MVZRRL04'
    for (let index = 0; index < 17; index++) {
      if (!/\d/.test(valid[index]!)) continue
      for (let digit = 0; digit <= 9; digit++) {
        const delta = Math.abs(digit - Number(valid[index]))
        if (delta === 0 || index === 8 || (delta === 5 && (18 - index) % 2 === 0)) continue
        const typo = valid.slice(0, index) + digit + valid.slice(index + 1)
        expect([typo, isValidCurp(typo)]).toEqual([typo, false])
      }
    }
  })

  it('isValidRfc', () => {
    expectAll(isValidRfc, [
      ['GODE561231GR8', true],
      ['SAT970701NN3', true],
      ['MAG041126GT8', true],
      [' sat970701nn3 ', true],
      ['XAXX010101000', true],
      ['XEXX010101000', true],
      ['GODE561231GR9', false],
      ['SAT970701NN4', false],
      ['GODE561331GR8', false],
    ])
  })

  it('isValidIban', () => {
    expectAll(isValidIban, [
      ['GB82 WEST 1234 5698 7654 32', true],
      ['DE89370400440532013000', true],
      ['ES9121000418450200051332', true],
      ['FR1420041010050500013M02606', true],
      ['gb82west12345698765432', true],
      ['GB82WEST12345698765433', false],
      ['DE8937040044053201300', false],
      ['MX12345678901234567890', false],
    ])
    expectCatchesTypos(isValidIban, 'DE89370400440532013000')
  })

  it('isValidRoutingNumber', () => {
    expectAll(isValidRoutingNumber, [
      ['021000021', true],
      ['011000015', true],
      ['021000022', false],
      ['991000021', false],
    ])
    expectCatchesTypos(isValidRoutingNumber, '021000021')
  })

  it('isValidDniEs', () => {
    expectAll(isValidDniEs, [
      ['12345678Z', true],
      ['12345678-z', true],
      ['X1234567L', true],
      ['Y0000000Z', true],
      ['12345678A', false],
      ['1234567Z', false],
    ])
  })
})

describe('US and European patterns', () => {
  it('ssn, ein and routingNumber', () => {
    const cases: [keyof typeof regex, string, boolean][] = [
      ['ssn', '123-45-6789', true],
      ['ssn', '123 45 6789', true],
      ['ssn', '123456789', true],
      ['ssn', '123-456789', false],
      ['ssn', '000-12-3456', false],
      ['ssn', '666-12-3456', false],
      ['ssn', '912-12-3456', false],
      ['ssn', '123-00-4567', false],
      ['ssn', '123-45-0000', false],
      ['ein', '12-3456789', true],
      ['ein', '987654321', true],
      ['ein', '07-1234567', false],
      ['routingNumber', '021000021', true],
      ['routingNumber', '131000000', false],
    ]
    for (const [key, value, expected] of cases) {
      const entry = regex[key] as { pattern: RegExp }
      expect([key, value, entry.pattern.test(value)]).toEqual([key, value, expected])
    }
  })

  it('iban, bic, vatEu and dniEs', () => {
    const cases: [keyof typeof regex, string, boolean][] = [
      ['iban', 'GB82 WEST 1234 5698 7654 32', true],
      ['iban', 'GB82WEST12345698765432', true],
      ['iban', 'GB82', false],
      ['bic', 'DEUTDEFF', true],
      ['bic', 'DEUTDEFF500', true],
      ['bic', 'DEUTDEF', false],
      ['vatEu', 'DE123456789', true],
      ['vatEu', 'ATU12345678', true],
      ['vatEu', 'NL123456789B01', true],
      ['vatEu', 'FR12345678901', true],
      ['vatEu', 'US123456789', false],
      ['vatEu', 'DE12345678', false],
      ['dniEs', 'X1234567L', true],
      ['dniEs', '1234567Z', false],
    ]
    for (const [key, value, expected] of cases) {
      const entry = regex[key] as { pattern: RegExp }
      expect([key, value, entry.pattern.test(value)]).toEqual([key, value, expected])
    }
  })

  it('postalCode by country', () => {
    const cases: [string, string, boolean][] = [
      ['US', '90210-1234', true],
      ['MX', '06600', true],
      ['MX', '00600', false],
      ['CA', 'K1A 0B1', true],
      ['CA', 'D1A 0B1', false],
      ['GB', 'SW1A 1AA', true],
      ['GB', 'EC1A1BB', true],
      ['GB', 'M1 1AE', true],
      ['IE', 'D02 X285', true],
      ['DE', '10115', true],
      ['FR', '75008', true],
      ['ES', '28013', true],
      ['ES', '53001', false],
      ['IT', '00118', true],
      ['PT', '1000-001', true],
      ['NL', '1012 AB', true],
      ['NL', '1012 SA', false],
      ['PL', '00-950', true],
      ['SE', '114 55', true],
      ['BR', '01310-100', true],
      ['AR', 'C1043AAZ', true],
      ['CO', '110111', true],
      ['CL', '8320000', true],
      ['JP', '100-0001', true],
      ['IN', '010001', false],
      ['AU', '2000', true],
    ]
    for (const [country, value, expected] of cases) {
      const entry = regex.postalCode({ country: country as 'US' })
      expect([country, value, entry.pattern.test(value)]).toEqual([country, value, expected])
    }
    expect(regex.postalCode.pattern.test('90210')).toBe(true)
    expect(regex.postalCode({ country: 'GB' }).errorMessage).toBe(
      'Please enter a valid postal code (GB).'
    )
    expect(() => regex.postalCode({ country: 'ZZ' as 'US' })).toThrow(RangeError)
  })
})
