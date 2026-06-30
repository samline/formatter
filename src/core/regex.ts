/**
 * # Regex Module
 *
 * Validation patterns exposed as public API for form consumers that pair
 * formatting with validation. Each entry bundles the regex with a ready-to-use
 * error message so consumers do not have to keep them in sync.
 *
 * ## Usage
 *
 * **Static (backward compatible):**
 * ```ts
 * regex.phone.pattern.test('5512345678')  // true
 * regex.email.errorMessage                // 'Please enter a valid email address.'
 * ```
 *
 * **Parametric (dynamic):**
 * ```ts
 * regex.digits(10).pattern.test('1234567890')  // true
 * regex.digits(7).pattern.test('1234567')      // true
 * regex.phone({ length: 10 }).pattern.test('1234567890')
 * regex.phone({ length: 7 }).pattern.test('1234567')
 * ```
 *
 * **Custom regex:**
 * ```ts
 * regex.custom(/^[A-Z]{5}$/, 'Must be 5 uppercase letters').pattern.test('HELLO')
 * ```
 *
 * ## Available Patterns
 *
 * | Key | Static | Parametric | Description |
 * | --- | --- | --- | --- |
 * | `phone` | ✅ | ✅ `({ length })` | Phone numbers |
 * | `email` | ✅ | — | Email addresses |
 * | `rfc` | ✅ | — | Mexican RFC |
 * | `curp` | ✅ | — | Mexican CURP |
 * | `cp` | ✅ | — | Mexican postal code (5 digits) |
 * | `numeral` | ✅ | — | Numbers with separators |
 * | `onlyNumbers` | ✅ | ✅ `({ length })` | Digits only |
 * | `digits` | — | ✅ `({ length, min, max })` | Variable digit count |
 * | `creditCard` | ✅ | ✅ `({ min, max })` | Card numbers |
 * | `expirationDate` | ✅ | — | MM/YY format |
 * | `cardCvc` | ✅ | — | 3-4 digit CVC |
 * | `onlyLetters` | ✅ | — | Letters only |
 * | `onlyAlphanumeric` | ✅ | — | Letters and numbers |
 * | `url` | ✅ | ✅ `({ protocol })` | URLs |
 * | `ipv4` | ✅ | — | IPv4 addresses |
 * | `ipv6` | ✅ | — | IPv6 addresses |
 * | `uuid` | ✅ | — | UUID v4 |
 * | `hexColor` | ✅ | — | Hex color codes |
 * | `hashtag` | ✅ | — | Social media hashtags |
 * | `mention` | ✅ | — | Social media mentions |
 * | `password` | — | ✅ `({ min, max, rules })` | Password strength |
 * | `custom` | — | ✅ `({ pattern, errorMessage })` | User-defined regex |
 */

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


// ─── Internal Factories ──────────────────────────────────────────────────────

function createDigits(min: number, max: number, errorMsg: string): RegexEntry {
  return {
    pattern: new RegExp(`^\\d{${min},${max}}$`),
    errorMessage: errorMsg
  }
}

function createPhone(length: number): RegexEntry {
  return {
    pattern: new RegExp(`^(?:\\D*\\d){${length}}\\D*$`),
    errorMessage: `Please enter a valid ${length}-digit phone number.`
  }
}

function createCreditCard(min: number, max: number): RegexEntry {
  return {
    pattern: new RegExp(`^(?:\\D*\\d){${min},${max}}\\D*$`),
    errorMessage: `Please enter a valid card number (${min}-${max} digits).`
  }
}

function createUrl(requireProtocol: 'http' | 'https' | 'ftp' | 'all'): RegexEntry {
  const protocol = requireProtocol === 'all' ? 'https?' : requireProtocol
  return {
    pattern: new RegExp(`^${protocol}://[^\\s]+$`),
    errorMessage: `Please enter a valid URL${requireProtocol !== 'all' ? ` (${requireProtocol}://...)` : ''}.`
  }
}

function createPassword(params: PasswordParams): RegexEntry {
  const {
    min = 8,
    max = 128,
    uppercase = true,
    lowercase = true,
    numbers = true,
    special = false
  } = params

  // Build the character class with proper escaping (put - last to avoid range issues)
  let chars = ''
  if (uppercase) chars += 'A-Z'
  if (lowercase) chars += 'a-z'
  if (numbers) chars += '0-9'
  if (special) chars += '!@#$%^&*()_+\\-=\\[\\]{}|;:\'",.<>?/'

  const ruleParts: string[] = []
  if (uppercase) ruleParts.push('uppercase letter')
  if (lowercase) ruleParts.push('lowercase letter')
  if (numbers) ruleParts.push('number')
  if (special) ruleParts.push('special character')

  const rulesText = ruleParts.length > 2
    ? ruleParts.slice(0, -1).join(', ') + ' and ' + ruleParts.slice(-1)
    : ruleParts.join(' and ')

  return {
    pattern: new RegExp(`^[${chars}]{${min},${max}}$`),
    errorMessage: `Password must be ${min}-${max} characters with at least one ${rulesText}.`
  }
}

// ─── Static Patterns ─────────────────────────────────────────────────────────

const _regex = {
  phone: {
    pattern: /^(?:\D*\d){10}\D*$/,
    errorMessage: 'Please enter a valid 10-digit phone number.'
  },
  email: {
    // Simple but effective email validation
    pattern: /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
    errorMessage: 'Please enter a valid email address.'
  },
  rfc: {
    // Mexican RFC ( Personas Morales y Físicas )
    pattern: /^([A-ZÑ&]{3,4})\d{6}([A-Z0-9]{0,3})$/i,
    errorMessage: 'Please enter a valid RFC.'
  },
  curp: {
    // Mexican CURP (18 characters)
    pattern: /^[A-Z]{4}\d{6}[A-Z]{6}[0-9A-Z]\d$/i,
    errorMessage: 'Please enter a valid CURP.'
  },
  cp: {
    // Mexican postal code (5 digits)
    pattern: /^\d{5}$/,
    errorMessage: 'Please enter a valid 5-digit postal code.'
  },
  numeral: {
    // Numbers with optional thousand separators and decimal points
    pattern: /\d{1,3}(,\d{3})*(\.\d+)?/,
    errorMessage: 'Please enter a valid number.'
  },
  onlyNumbers: {
    pattern: /^\d+$/,
    errorMessage: 'Please enter only numbers.'
  },
  creditCard: {
    // 15 or 16 digits, allowing spaces or delimiters
    pattern: /^(?:\D*\d){15,16}\D*$/,
    errorMessage: 'Please enter a valid card number (15-16 digits).'
  },
  expirationDate: {
    // MM/YY or MM/YYYY format
    pattern: /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/,
    errorMessage: 'Please enter a valid expiration date (MM/YY or MM/YYYY).'
  },
  cardCvc: {
    // 3 or 4 digit card security codes
    pattern: /^\d{3,4}$/,
    errorMessage: 'Please enter a valid CVC (3-4 digits).'
  },
  onlyLetters: {
    // Letters only (including accented characters and spaces)
    pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
    errorMessage: 'Please enter only letters.'
  },
  onlyAlphanumeric: {
    // Letters and numbers (including accented characters and spaces)
    pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/,
    errorMessage: 'Please enter only letters and numbers.'
  },
  url: {
    // Accepts http, https, ftp
    pattern: /^(?:https?|ftp):\/\/[^\s]+$/,
    errorMessage: 'Please enter a valid URL.'
  },
  ipv4: {
    // IPv4 addresses (0-255 per octet)
    pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    errorMessage: 'Please enter a valid IPv4 address.'
  },
  ipv6: {
    // IPv6 addresses (simplified)
    pattern: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
    errorMessage: 'Please enter a valid IPv6 address.'
  },
  uuid: {
    // UUID v4
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    errorMessage: 'Please enter a valid UUID.'
  },
  hexColor: {
    // Hex color codes (#RGB or #RRGGBB)
    pattern: /^#(?:[0-9a-fA-F]{3}){1,2}$/,
    errorMessage: 'Please enter a valid hex color code (e.g., #FFF or #FFFFFF).'
  },
  hashtag: {
    // Social media hashtags
    pattern: /^#[a-zA-Z_][a-zA-Z0-9_]*$/,
    errorMessage: 'Please enter a valid hashtag (e.g., #example).'
  },
  mention: {
    // Social media mentions
    pattern: /^@[a-zA-Z_][a-zA-Z0-9_]*$/,
    errorMessage: 'Please enter a valid mention (e.g., @username).'
  },
  postalCode: {
    // Generic 5-digit postal code (US-style ZIP / MX CP)
    pattern: /^\d{5}(?:-\d{4})?$/,
    errorMessage: 'Please enter a valid postal code (e.g., 90210 or 90210-1234).'
  },
  time24: {
    // 24-hour time HH:MM
    pattern: /^([01]\d|2[0-3]):([0-5]\d)$/,
    errorMessage: 'Please enter a valid 24-hour time (HH:MM).'
  },
  date: {
    // ISO-like date YYYY-MM-DD (loose)
    pattern: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    errorMessage: 'Please enter a valid date (YYYY-MM-DD).'
  },
  slug: {
    // URL slug (lowercase, hyphens, no spaces)
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    errorMessage: 'Please enter a valid slug (lowercase, hyphens, no spaces).'
  },
  username: {
    // Username: 3-20 chars, alphanumeric, underscore, hyphen
    pattern: /^[a-zA-Z0-9_-]{3,20}$/,
    errorMessage: 'Please enter a valid username (3-20 chars, letters, numbers, _ or -).'
  },
  macAddress: {
    // MAC address (colon or hyphen separated)
    pattern: /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/,
    errorMessage: 'Please enter a valid MAC address (e.g., 00:1B:44:11:3A:B7).'
  },
  semver: {
    // Semantic version (X.Y.Z with optional -prerelease)
    pattern: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[a-zA-Z0-9.-]+)?$/,
    errorMessage: 'Please enter a valid semantic version (e.g., 1.2.3).'
  },
  base64: {
    // Base64 encoded string
    pattern: /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/,
    errorMessage: 'Please enter a valid Base64 encoded string.'
  }
} as const

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

/**
 * Phone with configurable digit count.
 *
 * Also available as static entry: regex.phone.pattern (10 digits)
 * @example
 * regex.phone().pattern.test('5512345678')         // true (10 digits)
 * regex.phone({ length: 7 }).pattern.test('1234567') // true (7 digits)
 */
function _phoneFn(params?: PhoneParams): RegexEntry {
  const length = params?.length ?? 10
  return createPhone(length)
}

/**
 * Credit card with configurable digit range.
 *
 * Also available as static entry: regex.creditCard.pattern (15-16 digits)
 * @example
 * regex.creditCard().pattern.test('4111111111111111')      // true (15-16)
 * regex.creditCard({ min: 13, max: 19 }).pattern.test('1234567890123') // true
 */
function _creditCardFn(params?: CreditCardParams): RegexEntry {
  const min = params?.min ?? 15
  const max = params?.max ?? 16
  return createCreditCard(min, max)
}

/**
 * URL with configurable protocol.
 *
 * Also available as static entry: regex.url.pattern (any protocol)
 * @example
 * regex.url().pattern.test('https://example.com')   // true
 * regex.url({ protocol: 'https' }).pattern.test('https://example.com') // true
 * regex.url({ protocol: 'https' }).pattern.test('ftp://example.com')  // false
 */
function _urlFn(params?: UrlParams): RegexEntry {
  const protocol = params?.protocol ?? 'all'
  return createUrl(protocol)
}

/**
 * Password with configurable strength rules.
 * @example
 * regex.password().pattern.test('Passw0rd!')  // true (default: 8+ chars, upper, lower, number)
 * regex.password({ min: 12, special: true }).pattern.test('MyP@ssw0rd!') // true
 */
function _passwordFn(params?: PasswordParams): RegexEntry {
  return createPassword(params ?? {})
}

/**
 * Custom regex provided by the user.
 * @example
 * regex.custom(/^[A-Z]{5}$/, 'Must be 5 uppercase letters').pattern.test('HELLO') // true
 * regex.custom({ pattern: /^\d+$/, errorMessage: 'Numbers only' }).pattern.test('123') // true
 */
function _customFn(pattern: RegExp, errorMessage?: string): RegexEntry
function _customFn(params: CustomParams): RegexEntry
function _customFn(
  arg1: RegExp | CustomParams,
  arg2?: string
): RegexEntry {
  if (arg1 instanceof RegExp) {
    return { pattern: arg1, errorMessage: arg2 ?? 'Invalid value.' }
  }
  return { pattern: arg1.pattern, errorMessage: arg1.errorMessage }
}

// ─── Callable Objects with Attached Pattern ──────────────────────────────────

// These are callable functions that also have .pattern and .errorMessage attached
// This allows both: regex.phone({ length: 7 }) AND regex.phone.pattern

const phoneFn = _phoneFn as typeof _phoneFn & RegexEntry
phoneFn.pattern = _regex.phone.pattern
phoneFn.errorMessage = _regex.phone.errorMessage

const creditCardFn = _creditCardFn as typeof _creditCardFn & RegexEntry
creditCardFn.pattern = _regex.creditCard.pattern
creditCardFn.errorMessage = _regex.creditCard.errorMessage

const urlFn = _urlFn as typeof _urlFn & RegexEntry
urlFn.pattern = _regex.url.pattern
urlFn.errorMessage = _regex.url.errorMessage

// Parametric-only functions need default error messages
const digitsFn = digits as typeof digits & RegexEntry
digitsFn.errorMessage = 'Please enter a valid number.'

const passwordFn = _passwordFn as typeof _passwordFn & RegexEntry
passwordFn.errorMessage = 'Please enter a valid password.'

const customFn = _customFn as typeof _customFn & RegexEntry
customFn.errorMessage = 'Please enter a valid value.'

// ─── Final Export ─────────────────────────────────────────────────────────────

export const regex = {
  // Static entries (backward compatible - spread first)
  ..._regex,

  // Parametric functions
  digits: digitsFn,
  phone: phoneFn,
  creditCard: creditCardFn,
  url: urlFn,
  password: passwordFn,
  custom: customFn
} as const

export type RegexKey = keyof typeof _regex
export type Regex = typeof regex