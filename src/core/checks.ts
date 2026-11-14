/**
 * # Check-digit validators
 *
 * `regex` checks the shape of a value; these functions also verify its check
 * digit, which catches typos a pattern cannot (one wrong or two swapped
 * digits). Each takes the value as typed (spaces and hyphens are ignored,
 * letters are upper-cased) and returns a boolean. Non-strings return `false`.
 *
 * ```ts
 * isValidCurp('GODE561231HDFRRN00') // check digit verified
 * isValidCard('4111 1111 1111 1111') // 12–19 digits and Luhn
 * ```
 */

import { CURP, DNI_ES, RFC, ROUTING_NUMBER } from './id-patterns.js'

const clean = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '').toUpperCase() : ''

const luhn = (digits: string): boolean => {
  let sum = 0
  for (let index = 0; index < digits.length; index++) {
    let digit = digits.charCodeAt(digits.length - 1 - index) - 48
    if (index % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

/** Luhn (mod 10) checksum, used by card numbers, IMEI and the Mexican NSS. Needs 2+ digits. */
export const isLuhn = (value: unknown): boolean => {
  const digits = clean(value)
  return /^\d{2,}$/.test(digits) && luhn(digits)
}

/** Card number: 12–19 digits and a valid Luhn checksum. */
export const isValidCard = (value: unknown): boolean => {
  const digits = clean(value)
  return /^\d{12,19}$/.test(digits) && luhn(digits)
}

/**
 * Mexican CLABE: 18 digits whose last one is the check digit, weights 3, 7, 1
 * over the first 17 (Banco de México).
 */
export const isValidClabe = (value: unknown): boolean => {
  const digits = clean(value)
  if (!/^\d{18}$/.test(digits)) return false
  let sum = 0
  for (let index = 0; index < 17; index++) {
    sum += ((digits.charCodeAt(index) - 48) * [3, 7, 1][index % 3]!) % 10
  }
  return (10 - (sum % 10)) % 10 === digits.charCodeAt(17) - 48
}

/** Mexican NSS (IMSS): 11 digits, the last one a Luhn check digit of the first 10. */
export const isValidNss = (value: unknown): boolean => {
  const digits = clean(value)
  return /^\d{11}$/.test(digits) && luhn(digits)
}

const CURP_VALUES = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'

/**
 * Mexican CURP: the `regex.curp` structure plus its check digit (RENAPO).
 * Each of the first 17 characters is weighted 18 down to 2. The algorithm
 * itself cannot detect a typo in the 9th character (weight 10, the tens of
 * the birth day) or a change of exactly 5 in a digit with an even weight.
 */
export const isValidCurp = (value: unknown): boolean => {
  const curp = clean(value)
  if (!CURP.test(curp)) return false
  let sum = 0
  for (let index = 0; index < 17; index++) sum += CURP_VALUES.indexOf(curp[index]!) * (18 - index)
  return (10 - (sum % 10)) % 10 === curp.charCodeAt(17) - 48
}

const RFC_VALUES = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ'
/** SAT generic RFCs (general public and foreign residents) carry no real check digit. */
const RFC_GENERIC = new Set(['XAXX010101000', 'XEXX010101000'])

/**
 * Mexican RFC: the `regex.rfc` structure plus its check digit (SAT, mod 11).
 * Company RFCs (12 characters) are padded with a leading space to 13. The
 * generic `XAXX010101000` and `XEXX010101000` are accepted.
 */
export const isValidRfc = (value: unknown): boolean => {
  const rfc = typeof value === 'string' ? value.trim().toUpperCase() : ''
  if (!RFC.test(rfc)) return false
  if (RFC_GENERIC.has(rfc)) return true
  const padded = rfc.length === 12 ? ` ${rfc}` : rfc
  let sum = 0
  for (let index = 0; index < 12; index++) sum += RFC_VALUES.indexOf(padded[index]!) * (13 - index)
  const remainder = sum % 11
  const expected = remainder === 0 ? '0' : remainder === 1 ? 'A' : String(11 - remainder)
  return padded[12] === expected
}

/** IBAN length per country (SWIFT IBAN registry). */
const IBAN_LENGTHS =
  'AD24AE23AL28AT20AZ28BA20BE16BG22BH22BI27BR29BY28CH21CR22CY28CZ24DE22DJ27DK18DO28EE20EG29ES24FI18FK18FO18FR27GB22GE22GI23GL18GR27GT28HN28HR21HU28IE22IL23IQ23IS26IT27JO30KW30KZ20LB28LC32LI21LT20LU20LV21LY25MC27MD24ME22MK19MN20MR27MT31MU30NI28NL18NO15OM23PK24PL28PS29PT25QA29RO24RS22RU33SA24SC31SD18SE24SI19SK24SM27SO23ST25SV28TL23TN24TR26UA29VA22VG24XK20YE30'

/**
 * IBAN in any registered country: the length for that country and the
 * ISO 13616 mod-97 checksum. Spaces are ignored.
 */
export const isValidIban = (value: unknown): boolean => {
  const iban = clean(value)
  if (!/^[A-Z]{2}\d{2}[A-Z\d]{11,30}$/.test(iban)) return false
  const at = IBAN_LENGTHS.indexOf(iban.slice(0, 2))
  if (at < 0 || at % 4 !== 0 || Number(IBAN_LENGTHS.slice(at + 2, at + 4)) !== iban.length)
    return false
  let remainder = 0
  for (const char of iban.slice(4) + iban.slice(0, 4)) {
    const code = char.charCodeAt(0)
    const digits = code >= 65 ? String(code - 55) : char
    for (const digit of digits) remainder = (remainder * 10 + digit.charCodeAt(0) - 48) % 97
  }
  return remainder === 1
}

/** US ABA routing number: a valid Federal Reserve prefix and the 3-7-1 checksum. */
export const isValidRoutingNumber = (value: unknown): boolean => {
  const digits = clean(value)
  if (!ROUTING_NUMBER.test(digits)) return false
  let sum = 0
  for (let index = 0; index < 9; index++)
    sum += (digits.charCodeAt(index) - 48) * [3, 7, 1][index % 3]!
  return sum % 10 === 0
}

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

/** Spanish DNI or NIE with its control letter (NIE: X, Y, Z count as 0, 1, 2). */
export const isValidDniEs = (value: unknown): boolean => {
  const id = clean(value)
  if (!DNI_ES.test(id)) return false
  const number = Number(id.slice(0, -1).replace(/^[XYZ]/, letter => String('XYZ'.indexOf(letter))))
  return DNI_LETTERS[number % 23] === id.slice(-1)
}
