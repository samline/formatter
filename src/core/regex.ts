/**
 * # Regex Module
 *
 * Validation patterns exposed as public API for form consumers that pair
 * formatting with validation. Each entry bundles the regex with a ready-to-use
 * error message so consumers do not have to keep them in sync.
 *
 * ## Usage
 *
 * **Static:**
 * ```ts
 * regex.phone.pattern.test('5512345678')  // true
 * regex.email.errorMessage                // 'Please enter a valid email address.'
 * ```
 *
 * **Parametric:**
 * ```ts
 * regex.digits(10).pattern.test('1234567890')               // true
 * regex.phone({ length: 7 }).pattern.test('123-4567')        // true
 * regex.date({ datePattern: ['d', 'm', 'Y'] }).pattern.test('29/02/2028') // true
 * regex.numeral({ delimiter: '.', numeralDecimalMark: ',' }).pattern.test('1.234,5') // true
 * ```
 *
 * `date()`, `time()` and `numeral()` accept the same options object as
 * `format()`, so a masked field and its validation stay in sync.
 *
 * **Custom regex:**
 * ```ts
 * regex.custom(/^[A-Z]{5}$/, 'Must be 5 uppercase letters').pattern.test('HELLO')
 * ```
 */

import { CURP, DNI_ES, RFC, ROUTING_NUMBER } from './id-patterns.js'
import type {
  DatePatternType,
  NumeralThousandsGroupStyle,
  TimeFormatType,
  TimePatternType,
} from './engine/types.js'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RegexEntry {
  pattern: RegExp
  errorMessage: string
}

interface PhoneParams {
  length?: number
}

interface DigitsParams {
  length?: number
  min?: number
  max?: number
}

interface CreditCardParams {
  min?: number
  max?: number
}

interface UrlParams {
  protocol?: 'http' | 'https' | 'ftp' | 'all'
}

interface PasswordParams {
  min?: number
  max?: number
  uppercase?: boolean
  lowercase?: boolean
  numbers?: boolean
  special?: boolean
}

interface CustomParams {
  pattern: RegExp
  errorMessage: string
}

interface UuidParams {
  /** Accept only this UUID version (1–8). Omit for any version. */
  version?: number
}

/** Same option names as `format(value, 'date', options)`. */
interface DateParams {
  datePattern?: DatePatternType
  delimiter?: string
}

/** Same option names as `format(value, 'time', options)`. */
interface TimeParams {
  timePattern?: TimePatternType
  timeFormat?: TimeFormatType
  delimiter?: string
}

/** Same option names as `format(value, 'numeral', options)`. */
/** ISO 3166-1 alpha-2 codes with a built-in postal code pattern. */
export type PostalCountry = keyof typeof POSTAL_CODES

interface PostalCodeParams {
  country?: PostalCountry
}

interface NumeralParams {
  delimiter?: string
  numeralDecimalMark?: string
  numeralThousandsGroupStyle?: NumeralThousandsGroupStyle
  numeralDecimalScale?: number
  numeralPositiveOnly?: boolean
  prefix?: string
  tailPrefix?: boolean
  signBeforePrefix?: boolean
}

// ─── Building blocks ─────────────────────────────────────────────────────────

const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&')

const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)'
const IPV4 = `${OCTET}(?:\\.${OCTET}){3}`
const HEX = '[0-9a-fA-F]{1,4}'

/**
 * Every valid IPv6 text form: full, `::`-compressed at any position, and the
 * IPv4-embedded tail (`::ffff:192.0.2.1`). Zone ids (`%eth0`) are not accepted.
 */
const ipv6Source = (): string => {
  const forms = [`(?:${HEX}:){7}${HEX}`, `(?:${HEX}:){6}${IPV4}`]
  for (const [groups, tail] of [
    [8, false],
    [6, true],
  ] as const) {
    for (let left = 0; left < groups; left++) {
      const room = groups - 1 - left
      const head = left === 0 ? '' : `(?:${HEX}:){${left - 1}}${HEX}`
      const rest = tail
        ? `(?:${HEX}:){0,${room}}${IPV4}`
        : room === 0
          ? ''
          : `(?:${HEX}(?::${HEX}){0,${room - 1}})?`
      forms.push(`${head}::${rest}`)
    }
  }
  return `(?:${forms.join('|')})`
}
const IPV6 = /* @__PURE__ */ ipv6Source()

const LABEL = '[\\p{L}\\p{N}](?:[\\p{L}\\p{N}-]{0,61}[\\p{L}\\p{N}])?'
const TLD = '(?:\\p{L}{2,63}|xn--[a-zA-Z0-9-]{1,59})'
const DOMAIN = `(?:${LABEL}\\.)+${TLD}`

const LEAP_YYYY = '(?:\\d\\d(?:0[48]|[2468][048]|[13579][26])|(?:[02468][048]|[13579][26])00)'
const LEAP_YY = '(?:0[048]|[2468][048]|[13579][26])'

const LETTER = '[\\p{L}\\p{M}]'

/** Postal code shapes (letters are case-insensitive). Other countries: `regex.custom()`. */
const POSTAL_CODES = {
  US: '\\d{5}(?:-\\d{4})?',
  MX: '(?!00)\\d{5}',
  CA: '[ABCEGHJ-NPRSTVXY]\\d[ABCEGHJ-NPRSTV-Z] ?\\d[ABCEGHJ-NPRSTV-Z]\\d',
  GB: '(?:GIR ?0AA|[A-PR-UWYZ](?:\\d[A-HJKPSTUW\\d]?|[A-HK-Y]\\d[ABEHMNPRV-Y\\d]?) ?\\d[ABD-HJLNP-UW-Z]{2})',
  IE: '(?:[AC-FHKNPRTV-Y]\\d{2}|D6W) ?[\\dAC-FHKNPRTV-Y]{4}',
  DE: '\\d{5}',
  FR: '\\d{5}',
  ES: '(?:0[1-9]|[1-4]\\d|5[0-2])\\d{3}',
  IT: '\\d{5}',
  PT: '\\d{4}-\\d{3}',
  NL: '[1-9]\\d{3} ?(?!SA|SD|SS)[A-Z]{2}',
  BE: '[1-9]\\d{3}',
  AT: '[1-9]\\d{3}',
  CH: '[1-9]\\d{3}',
  PL: '\\d{2}-\\d{3}',
  SE: '[1-9]\\d{2} ?\\d{2}',
  BR: '\\d{5}-?\\d{3}',
  AR: '(?:[A-HJ-NP-Z]\\d{4}[A-Z]{3}|\\d{4})',
  CO: '\\d{6}',
  CL: '\\d{7}',
  PE: '\\d{5}',
  JP: '\\d{3}-?\\d{4}',
  IN: '[1-9]\\d{5}',
  AU: '\\d{4}',
} as const

/** EU VAT number shapes by country prefix (Greece uses EL; XI is Northern Ireland). */
const EU_VAT = [
  'ATU\\d{8}',
  'BE[01]\\d{9}',
  'BG\\d{9,10}',
  'CY\\d{8}[A-Z]',
  'CZ\\d{8,10}',
  'DE\\d{9}',
  'DK\\d{8}',
  'EE\\d{9}',
  'EL\\d{9}',
  'ES[A-Z\\d]\\d{7}[A-Z\\d]',
  'FI\\d{8}',
  'FR[A-HJ-NP-Z\\d]{2}\\d{9}',
  'HR\\d{11}',
  'HU\\d{8}',
  'IE(?:\\d{7}[A-W][A-I]?|\\d[A-Z+*]\\d{5}[A-W])',
  'IT\\d{11}',
  'LT(?:\\d{9}|\\d{12})',
  'LU\\d{8}',
  'LV\\d{11}',
  'MT\\d{8}',
  'NL\\d{9}B\\d{2}',
  'PL\\d{10}',
  'PT\\d{9}',
  'RO[1-9]\\d{1,9}',
  'SE\\d{10}01',
  'SI\\d{8}',
  'SK\\d{10}',
  'XI(?:\\d{9}|\\d{12}|GD\\d{3}|HA\\d{3})',
]

// ─── Internal Factories ──────────────────────────────────────────────────────

const assertCount = (name: string, value: number): void => {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `regex: \`${name}\` must be a non-negative integer, received ${String(value)}.`
    )
  }
}

const assertRange = (min: number, max: number): void => {
  assertCount('min', min)
  assertCount('max', max)
  if (min > max) {
    throw new RangeError(`regex: \`min\` (${min}) cannot be greater than \`max\` (${max}).`)
  }
}

function createDigits(min: number, max: number, errorMsg: string): RegexEntry {
  assertRange(min, max)
  return {
    pattern: new RegExp(`^\\d{${min},${max}}$`),
    errorMessage: errorMsg,
  }
}

/** Digits with only the separators people type in phone numbers. */
function createPhone(length: number): RegexEntry {
  assertCount('length', length)
  return {
    pattern: new RegExp(`^[\\s().+-]*(?:\\d[\\s().+-]*){${length}}$`),
    errorMessage: `Please enter a valid ${length}-digit phone number.`,
  }
}

/** Digits with optional single spaces or hyphens between them. */
function createCreditCard(min: number, max: number): RegexEntry {
  assertRange(min, max)
  return {
    pattern: new RegExp(`^(?=(?:[\\s-]?\\d){${min},${max}}$)\\d(?:[\\s-]?\\d)*$`),
    errorMessage: `Please enter a valid card number (${min}-${max} digits).`,
  }
}

function createUrl(requireProtocol: 'http' | 'https' | 'ftp' | 'all'): RegexEntry {
  const protocol = requireProtocol === 'all' ? '(?:https?|ftp)' : requireProtocol
  const host = `(?:${DOMAIN}|localhost|${IPV4}|\\[${IPV6}\\])`
  return {
    pattern: new RegExp(
      `^${protocol}://(?:[^\\s/?#@]+@)?${host}(?::\\d{1,5})?(?:[/?#]\\S*)?$`,
      'iu'
    ),
    errorMessage: `Please enter a valid URL${requireProtocol !== 'all' ? ` (${requireProtocol}://...)` : ''}.`,
  }
}

function createPassword(params: PasswordParams): RegexEntry {
  const {
    min = 8,
    max = 128,
    uppercase = true,
    lowercase = true,
    numbers = true,
    special = false,
  } = params

  assertRange(min, max)

  const requirements = [
    uppercase ? '(?=.*\\p{Lu})' : '',
    lowercase ? '(?=.*\\p{Ll})' : '',
    numbers ? '(?=.*\\d)' : '',
    // Anything that is not a letter, number or whitespace counts as special.
    special ? '(?=.*[^\\p{L}\\p{N}\\s])' : '',
  ].join('')

  const ruleParts: string[] = []
  if (uppercase) ruleParts.push('uppercase letter')
  if (lowercase) ruleParts.push('lowercase letter')
  if (numbers) ruleParts.push('number')
  if (special) ruleParts.push('special character')

  const rulesText =
    ruleParts.length > 2
      ? ruleParts.slice(0, -1).join(', ') + ' and ' + ruleParts.slice(-1)
      : ruleParts.join(' and ')
  const rulesSentence = rulesText ? ` with at least one ${rulesText}` : ''

  return {
    // Rules are requirements, not an allow-list: any non-whitespace
    // character may appear, so `Passw0rd!` passes the default policy.
    pattern: new RegExp(`^${requirements}\\S{${min},${max}}$`, 'u'),
    errorMessage: `Password must be ${min}-${max} characters${rulesSentence}.`,
  }
}

function createUuid(version?: number): RegexEntry {
  if (version !== undefined && (!Number.isInteger(version) || version < 1 || version > 8)) {
    throw new RangeError(
      `regex: \`version\` must be an integer from 1 to 8, received ${String(version)}.`
    )
  }
  const digit = version === undefined ? '[1-8]' : String(version)
  return {
    pattern: new RegExp(
      `^[0-9a-f]{8}-[0-9a-f]{4}-${digit}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`,
      'i'
    ),
    errorMessage:
      version === undefined
        ? 'Please enter a valid UUID.'
        : `Please enter a valid UUID v${version}.`,
  }
}

const DATE_UNIT: Record<string, { width: number; source: string; label: string }> = {
  Y: { width: 4, source: '\\d{4}', label: 'YYYY' },
  y: { width: 2, source: '\\d{2}', label: 'YY' },
  m: { width: 2, source: '(?:0[1-9]|1[0-2])', label: 'MM' },
  d: { width: 2, source: '(?:0[1-9]|[12]\\d|3[01])', label: 'DD' },
}

/**
 * A real calendar date in the given segment order. Every segment has a fixed
 * width, so lookaheads anchored at each offset reject day 31 in 30-day
 * months, day 30–31 in February and 29 February outside leap years.
 */
function createDate(params: DateParams = {}): RegexEntry {
  const order = params.datePattern ?? ['d', 'm', 'Y']
  const delimiter = params.delimiter ?? '/'
  const offsets: Record<string, number> = {}
  let offset = 0
  const body = order
    .map(unit => {
      const spec = DATE_UNIT[unit]
      if (!spec) throw new RangeError(`regex: unknown date unit \`${String(unit)}\`.`)
      offsets[unit] = offset
      offset += spec.width + delimiter.length
      return spec.source
    })
    .join(escape(delimiter))

  const at = (unit: string, source: string): string => `(?=^.{${offsets[unit]}}${source})`
  const guards: string[] = []
  if (offsets.d !== undefined && offsets.m !== undefined) {
    guards.push(
      `(?!${at('d', '31')}${at('m', '(?:02|04|06|09|11)')})`,
      `(?!${at('d', '30')}${at('m', '02')})`
    )
    const year = offsets.Y !== undefined ? 'Y' : offsets.y !== undefined ? 'y' : undefined
    if (year) {
      const leap = year === 'Y' ? LEAP_YYYY : LEAP_YY
      guards.push(`(?!${at('d', '29')}${at('m', '02')}(?!^.{${offsets[year]}}${leap}))`)
    }
  }

  const shape = order.map(unit => DATE_UNIT[unit]?.label).join(delimiter)
  return {
    pattern: new RegExp(`^${guards.join('')}${body}$`),
    errorMessage: `Please enter a valid date (${shape}).`,
  }
}

/** Two-digit time segments in the given order, as the `'time'` mask writes them. */
function createTime(params: TimeParams = {}): RegexEntry {
  const order = params.timePattern ?? ['h', 'm', 's']
  const delimiter = params.delimiter ?? ':'
  const twelve = params.timeFormat === '12'
  const hour = twelve ? '(?:0[1-9]|1[0-2])' : '(?:[01]\\d|2[0-3])'
  const body = order
    .map(unit => {
      if (unit === 'h') return hour
      if (unit === 'm' || unit === 's') return '[0-5]\\d'
      throw new RangeError(`regex: unknown time unit \`${String(unit)}\`.`)
    })
    .join(escape(delimiter))
  const shape = order
    .map(unit => (unit === 'h' ? 'HH' : unit === 'm' ? 'MM' : 'SS'))
    .join(delimiter)
  return {
    pattern: new RegExp(`^${body}$`),
    errorMessage: `Please enter a valid ${twelve ? '12' : '24'}-hour time (${shape}).`,
  }
}

/** A whole number as the `'numeral'` mask writes it, grouped or plain. */
function createNumeral(params: NumeralParams = {}): RegexEntry {
  const {
    delimiter = ',',
    numeralDecimalMark = '.',
    numeralThousandsGroupStyle = 'thousand',
    numeralDecimalScale,
    numeralPositiveOnly = false,
    prefix = '',
    tailPrefix = false,
    signBeforePrefix = false,
  } = params
  if (numeralDecimalScale !== undefined) assertCount('numeralDecimalScale', numeralDecimalScale)

  const group = escape(delimiter)
  const grouped =
    delimiter === '' || numeralThousandsGroupStyle === 'none'
      ? ''
      : numeralThousandsGroupStyle === 'lakh'
        ? `\\d{1,2}(?:${group}\\d{2})*${group}\\d{3}`
        : numeralThousandsGroupStyle === 'wan'
          ? `\\d{1,4}(?:${group}\\d{4})+`
          : `\\d{1,3}(?:${group}\\d{3})+`
  const integer = grouped ? `(?:${grouped}|\\d+)` : '\\d+'
  const decimals =
    numeralDecimalScale === 0
      ? ''
      : `(?:${escape(numeralDecimalMark)}\\d${numeralDecimalScale === undefined ? '+' : `{1,${numeralDecimalScale}}`})?`
  const sign = numeralPositiveOnly ? '' : '-?'
  const mark = escape(prefix)
  const number = `${integer}${decimals}`
  const body = tailPrefix
    ? `${sign}${number}${mark}`
    : signBeforePrefix
      ? `${sign}${mark}${number}`
      : `${mark}${sign}${number}`
  return {
    pattern: new RegExp(`^${body}$`),
    errorMessage: 'Please enter a valid number.',
  }
}

// ─── Static Patterns ─────────────────────────────────────────────────────────

/*
 * The catalog is built inside functions and created with a PURE call below,
 * so bundlers drop it entirely from applications that never import `regex`.
 */
const buildStatic = () => {
  const ISO_DATE = createDate({ datePattern: ['Y', 'm', 'd'], delimiter: '-' })
  return {
    phone: {
      // 10 digits; spaces, hyphens, dots, parentheses and + may separate them
      pattern: createPhone(10).pattern,
      errorMessage: 'Please enter a valid 10-digit phone number.',
    },
    email: {
      // Dot-atom local part (no leading, trailing or doubled dots) and a domain
      // with a top-level label. Length limits: 64 for the local part, 254 total.
      pattern: new RegExp(
        `^(?=.{1,254}$)(?=[^@]{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_\`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_\`{|}~-]+)*@${DOMAIN}$`,
        'u'
      ),
      errorMessage: 'Please enter a valid email address.',
    },
    rfc: {
      // Mexican RFC: 3 letters (company) or 4 (person), a real YYMMDD date and
      // a 3-character homoclave whose last character is a digit or A.
      pattern: RFC,
      errorMessage: 'Please enter a valid RFC.',
    },
    curp: {
      // Mexican CURP: initials (second is a vowel or X), YYMMDD, sex (H, M or
      // X), state code (NE for born abroad), 3 inner consonants, the century
      // differentiator and the check digit.
      pattern: CURP,
      errorMessage: 'Please enter a valid CURP.',
    },
    cp: {
      // Mexican postal code: 5 digits, 01000–99999
      pattern: /^(?!00)\d{5}$/,
      errorMessage: 'Please enter a valid 5-digit postal code.',
    },
    clabe: {
      // Mexican interbank account number (CLABE): 18 digits
      pattern: /^\d{18}$/,
      errorMessage: 'Please enter a valid 18-digit CLABE.',
    },
    nss: {
      // Mexican social security number (NSS, IMSS): 11 digits
      pattern: /^\d{11}$/,
      errorMessage: 'Please enter a valid 11-digit NSS.',
    },
    numeral: {
      // Whole value: optional sign, plain or comma-grouped digits, optional decimals
      pattern: createNumeral().pattern,
      errorMessage: 'Please enter a valid number.',
    },
    onlyNumbers: {
      pattern: /^\d+$/,
      errorMessage: 'Please enter only numbers.',
    },
    creditCard: {
      // 12–19 digits (every ISO/IEC 7812 card length), optional spaces or hyphens
      pattern: createCreditCard(12, 19).pattern,
      errorMessage: 'Please enter a valid card number (12-19 digits).',
    },
    expirationDate: {
      // MM/YY or MM/YYYY format
      pattern: /^(0[1-9]|1[0-2]) ?\/ ?(\d{2}|\d{4})$/,
      errorMessage: 'Please enter a valid expiration date (MM/YY or MM/YYYY).',
    },
    cardCvc: {
      // 3 or 4 digit card security codes
      pattern: /^\d{3,4}$/,
      errorMessage: 'Please enter a valid CVC (3-4 digits).',
    },
    onlyLetters: {
      // Letters in any script (accents, ü, ç…) and spaces; at least one letter
      pattern: /^(?=.*\p{L})[\p{L}\p{M} ]+$/u,
      errorMessage: 'Please enter only letters.',
    },
    onlyAlphanumeric: {
      // Letters in any script, digits and spaces; at least one letter or digit
      pattern: /^(?=.*[\p{L}\d])[\p{L}\p{M}\d ]+$/u,
      errorMessage: 'Please enter only letters and numbers.',
    },
    personName: {
      // Words of letters joined by a space, apostrophe, hyphen or period:
      // "María José", "O'Connor", "Pérez-Gómez", "Ma. Fernanda"
      pattern: new RegExp(`^${LETTER}+(?:(?: |['’.-] ?)${LETTER}+)*\\.?$`, 'u'),
      errorMessage: 'Please enter a valid name.',
    },
    url: {
      // http, https or ftp with a real host (domain, localhost or IP)
      pattern: createUrl('all').pattern,
      errorMessage: 'Please enter a valid URL.',
    },
    domain: {
      // Host name without protocol: example.com, sub.dominio.mx
      pattern: new RegExp(`^${DOMAIN}$`, 'iu'),
      errorMessage: 'Please enter a valid domain (e.g., example.com).',
    },
    ipv4: {
      // IPv4 addresses (0-255 per octet, no leading zeros)
      pattern: new RegExp(`^${IPV4}$`),
      errorMessage: 'Please enter a valid IPv4 address.',
    },
    ipv6: {
      // IPv6 in full, compressed (::) or IPv4-embedded form
      pattern: new RegExp(`^${IPV6}$`),
      errorMessage: 'Please enter a valid IPv6 address.',
    },
    uuid: {
      // RFC 9562 UUID, versions 1–8
      pattern: createUuid().pattern,
      errorMessage: 'Please enter a valid UUID.',
    },
    hexColor: {
      // Hex color codes: #RGB, #RGBA, #RRGGBB or #RRGGBBAA
      pattern: /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
      errorMessage: 'Please enter a valid hex color code (e.g., #FFF or #FFFFFF).',
    },
    hashtag: {
      // Letters in any script, digits and _, not digits only
      pattern: /^#(?=[\p{L}\p{M}\p{N}_]*[\p{L}_])[\p{L}\p{M}\p{N}_]+$/u,
      errorMessage: 'Please enter a valid hashtag (e.g., #example).',
    },
    mention: {
      // Up to 30 letters, digits, _ and inner single dots
      pattern: /^@(?=[A-Za-z0-9_.]{1,30}$)[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/,
      errorMessage: 'Please enter a valid mention (e.g., @username).',
    },
    ssn: {
      // US Social Security number: no 000, 666 or 9xx area, 00 group or 0000 serial
      pattern: /^(?!000|666|9)\d{3}([- ]?)(?!00)\d{2}\1(?!0000)\d{4}$/,
      errorMessage: 'Please enter a valid SSN (e.g., 123-45-6789).',
    },
    ein: {
      // US Employer Identification Number with an IRS-assigned prefix
      pattern: /^(?!0[0789]|1[789]|2[89]|49|69|7[089]|89|9[67])\d{2}-?\d{7}$/,
      errorMessage: 'Please enter a valid EIN (e.g., 12-3456789).',
    },
    routingNumber: {
      // US ABA routing number (9 digits); isValidRoutingNumber() checks its checksum
      pattern: ROUTING_NUMBER,
      errorMessage: 'Please enter a valid 9-digit routing number.',
    },
    iban: {
      // IBAN: country, check digits and 11–30 characters, optionally in groups of 4;
      // isValidIban() checks the country length and the mod-97 checksum
      pattern: /^(?=(?: ?[A-Z\d]){15,34}$)[A-Z]{2}\d{2}(?: ?[A-Z\d]{4})*(?: ?[A-Z\d]{1,4})?$/i,
      errorMessage: 'Please enter a valid IBAN.',
    },
    bic: {
      // BIC / SWIFT code: bank, country, location and optional branch (8 or 11)
      pattern: /^[A-Z]{4}[A-Z]{2}[A-Z\d]{2}(?:[A-Z\d]{3})?$/i,
      errorMessage: 'Please enter a valid BIC/SWIFT code.',
    },
    vatEu: {
      // EU VAT number with its country prefix, no spaces (DE123456789)
      pattern: new RegExp(`^(?:${EU_VAT.join('|')})$`, 'i'),
      errorMessage: 'Please enter a valid EU VAT number (e.g., DE123456789).',
    },
    dniEs: {
      // Spanish DNI (8 digits + letter) or NIE (X, Y or Z + 7 digits + letter);
      // isValidDniEs() checks the letter
      pattern: DNI_ES,
      errorMessage: 'Please enter a valid DNI or NIE.',
    },
    postalCode: {
      // US ZIP or ZIP+4 (5 digits also fits a Mexican CP; use `cp` for Mexico)
      pattern: /^\d{5}(?:-\d{4})?$/,
      errorMessage: 'Please enter a valid postal code (e.g., 90210 or 90210-1234).',
    },
    time24: {
      // 24-hour time HH:MM with optional :SS
      pattern: /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/,
      errorMessage: 'Please enter a valid 24-hour time (HH:MM).',
    },
    time12: {
      // 12-hour time with AM/PM: 9:30 pm, 09:30:15 AM, 9:30 p. m.
      pattern: /^(?:0?[1-9]|1[0-2]):[0-5]\d(?::[0-5]\d)? ?[AaPp]\.? ?[Mm]\.?$/,
      errorMessage: 'Please enter a valid 12-hour time (e.g., 9:30 PM).',
    },
    date: {
      // Real calendar date YYYY-MM-DD (leap years included)
      pattern: ISO_DATE.pattern,
      errorMessage: 'Please enter a valid date (YYYY-MM-DD).',
    },
    isoDateTime: {
      // ISO 8601 / RFC 3339 date-time: 2026-11-13T09:30, …:15.250Z, …+06:00
      pattern: new RegExp(
        `${ISO_DATE.pattern.source.slice(0, -1)}` +
          `[T ](?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d{1,9})?)?(?:Z|[+-](?:[01]\\d|2[0-3]):?[0-5]\\d)?$`
      ),
      errorMessage: 'Please enter a valid date and time (YYYY-MM-DDTHH:MM).',
    },
    latitude: {
      // -90 to 90, optional decimals
      pattern: /^[-+]?(?:90(?:\.0+)?|[1-8]?\d(?:\.\d+)?)$/,
      errorMessage: 'Please enter a valid latitude (-90 to 90).',
    },
    longitude: {
      // -180 to 180, optional decimals
      pattern: /^[-+]?(?:180(?:\.0+)?|(?:1[0-7]\d|[1-9]?\d)(?:\.\d+)?)$/,
      errorMessage: 'Please enter a valid longitude (-180 to 180).',
    },
    slug: {
      // URL slug (lowercase, hyphens, no spaces)
      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      errorMessage: 'Please enter a valid slug (lowercase, hyphens, no spaces).',
    },
    username: {
      // Username: 3-20 chars, alphanumeric, underscore, hyphen
      pattern: /^[a-zA-Z0-9_-]{3,20}$/,
      errorMessage: 'Please enter a valid username (3-20 chars, letters, numbers, _ or -).',
    },
    macAddress: {
      // Six pairs with one separator (: or -) throughout, or Cisco dotted form
      pattern:
        /^(?:[0-9A-Fa-f]{2}([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}|[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4})$/,
      errorMessage: 'Please enter a valid MAC address (e.g., 00:1B:44:11:3A:B7).',
    },
    semver: {
      // Semantic Versioning 2.0.0: X.Y.Z, optional -prerelease and +build
      pattern:
        /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/,
      errorMessage: 'Please enter a valid semantic version (e.g., 1.2.3).',
    },
    base64: {
      // Padded Base64, not empty
      pattern: /^(?=.)(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
      errorMessage: 'Please enter a valid Base64 encoded string.',
    },
    base64url: {
      // URL-safe Base64 (JWT segments), padding optional, not empty
      pattern: /^(?=.)(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}(?:==)?|[A-Za-z0-9_-]{3}=?)?$/,
      errorMessage: 'Please enter a valid Base64URL encoded string.',
    },
  } as const
}

// ─── Parametric Extensions ───────────────────────────────────────────────────

/**
 * Digits with configurable length.
 * @example
 * regex.digits(10).pattern.test('1234567890')     // true
 * regex.digits({ length: 7 }).pattern.test('1234567') // true
 * regex.digits({ min: 3, max: 10 }).pattern.test('12345') // true
 */
function digits(params?: number | DigitsParams): RegexEntry {
  if (typeof params === 'number') {
    return createDigits(params, params, `Please enter exactly ${params} digits.`)
  }
  const { length, min = 1, max = 20 } = params ?? {}
  const actualMin = length ?? min
  const actualMax = length ?? max
  if (actualMin === actualMax) {
    return createDigits(actualMin, actualMax, `Please enter exactly ${actualMin} digits.`)
  }
  return createDigits(actualMin, actualMax, `Please enter ${actualMin}-${actualMax} digits.`)
}

/** Phone with configurable digit count (static entry: 10 digits). */
function _phoneFn(params?: PhoneParams): RegexEntry {
  return createPhone(params?.length ?? 10)
}

/** Card number with configurable digit range (static entry: 12–19). */
function _creditCardFn(params?: CreditCardParams): RegexEntry {
  return createCreditCard(params?.min ?? 12, params?.max ?? 19)
}

/** URL with configurable protocol (static entry: http, https or ftp). */
function _urlFn(params?: UrlParams): RegexEntry {
  return createUrl(params?.protocol ?? 'all')
}

/** Password with configurable strength rules. */
function _passwordFn(params?: PasswordParams): RegexEntry {
  return createPassword(params ?? {})
}

/** UUID of one version (static entry: any version 1–8). */
function _uuidFn(params?: UuidParams): RegexEntry {
  return createUuid(params?.version)
}

/**
 * Date in the order and delimiter of the `'date'` mask (static entry:
 * `YYYY-MM-DD`; called with no options: `DD/MM/YYYY`, the mask default).
 * @example
 * regex.date({ datePattern: ['d', 'm', 'Y'] }).pattern.test('31/04/2026') // false
 */
function _dateFn(params?: DateParams): RegexEntry {
  return createDate(params)
}

/**
 * Time in the order and delimiter of the `'time'` mask (default `HH:MM:SS`,
 * 24-hour). Pass the same options you give `format()`.
 */
function _timeFn(params?: TimeParams): RegexEntry {
  return createTime(params)
}

/** Postal code of one country (static entry: US ZIP or ZIP+4). */
function _postalCodeFn(params?: PostalCodeParams): RegexEntry {
  const country = params?.country ?? 'US'
  const source = (POSTAL_CODES as Record<string, string>)[String(country).toUpperCase()]
  if (!source) {
    throw new RangeError(
      `regex: no postal code pattern for \`${String(country)}\`; use regex.custom().`
    )
  }
  return {
    pattern: new RegExp(`^${source}$`, 'i'),
    errorMessage: `Please enter a valid postal code (${String(country).toUpperCase()}).`,
  }
}

/**
 * Number as the `'numeral'` mask writes it. Pass the same options you give
 * `format()`: delimiter, decimal mark, group style, decimal scale, sign and prefix.
 */
function _numeralFn(params?: NumeralParams): RegexEntry {
  return createNumeral(params)
}

/**
 * Custom regex provided by the user.
 * @example
 * regex.custom(/^[A-Z]{5}$/, 'Must be 5 uppercase letters').pattern.test('HELLO') // true
 * regex.custom({ pattern: /^\d+$/, errorMessage: 'Numbers only' }).pattern.test('123') // true
 */
function _customFn(pattern: RegExp, errorMessage?: string): RegexEntry
function _customFn(params: CustomParams): RegexEntry
function _customFn(arg1: RegExp | CustomParams, arg2?: string): RegexEntry {
  if (arg1 instanceof RegExp) {
    return { pattern: arg1, errorMessage: arg2 ?? 'Invalid value.' }
  }
  return { pattern: arg1.pattern, errorMessage: arg1.errorMessage }
}

// ─── Callable Objects with Attached Pattern ──────────────────────────────────

// Callable entries keep the static `.pattern` / `.errorMessage`, so both
// `regex.phone({ length: 7 })` and `regex.phone.pattern` work.
const attach = <F extends (params?: never) => RegexEntry>(
  fn: F,
  entry: RegexEntry
): F & RegexEntry => Object.assign(fn, { pattern: entry.pattern, errorMessage: entry.errorMessage })

const buildRegex = () => {
  const _regex = buildStatic()
  const phoneFn = attach(_phoneFn, _regex.phone)
  const creditCardFn = attach(_creditCardFn, _regex.creditCard)
  const urlFn = attach(_urlFn, _regex.url)
  const uuidFn = attach(_uuidFn, _regex.uuid)
  const dateFn = attach(_dateFn, _regex.date)
  const numeralFn = attach(_numeralFn, _regex.numeral)
  const postalCodeFn = attach(_postalCodeFn, _regex.postalCode)

  // Parametric-only functions need default error messages
  const digitsFn = digits as typeof digits & RegexEntry
  digitsFn.errorMessage = 'Please enter a valid number.'

  const timeFn = _timeFn as typeof _timeFn & { errorMessage: string }
  timeFn.errorMessage = 'Please enter a valid time.'

  const passwordFn = _passwordFn as typeof _passwordFn & RegexEntry
  passwordFn.errorMessage = 'Please enter a valid password.'

  const customFn = _customFn as typeof _customFn & RegexEntry
  customFn.errorMessage = 'Please enter a valid value.'

  return {
    ..._regex,

    // Callable entries (static `.pattern` attached)
    phone: phoneFn,
    creditCard: creditCardFn,
    url: urlFn,
    uuid: uuidFn,
    date: dateFn,
    numeral: numeralFn,
    postalCode: postalCodeFn,

    // Parametric-only
    digits: digitsFn,
    time: timeFn,
    password: passwordFn,
    custom: customFn,
  } as const
}

// ─── Final Export ─────────────────────────────────────────────────────────────

export const regex = /* @__PURE__ */ buildRegex()

/** Keys whose entries always expose a static `pattern` and `errorMessage`. */
export type RegexKey = keyof ReturnType<typeof buildStatic>
export type Regex = typeof regex
