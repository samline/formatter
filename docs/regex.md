# Regex Validation Patterns

Validation patterns exposed as public API for form consumers that pair formatting with validation. Each entry bundles the regex with a ready-to-use error message so consumers do not have to keep them in sync.

---

## Backward Compatibility

Every existing pattern keeps its static `.pattern` / `.errorMessage` API. Nothing that worked before stops working — only new keys and new call signatures have been added.

```ts
// ✅ Still works (unchanged)
regex.phone.pattern.test('5512345678')
regex.email.errorMessage
```

The only patterns whose usage **expanded** are `phone`, `creditCard`, and `url`, which are now also callable as functions:

```ts
// ✅ Still works
regex.phone.pattern
// ✅ Also works (new)
regex.phone({ length: 7 })
```

Because the static `.pattern` is still attached to the function, both forms coexist without conflict.

---

## Usage

### Static (Backward Compatible)

```ts
import { regex } from '@samline/formatter'

// Access pattern and errorMessage directly
regex.phone.pattern.test('5512345678')  // true
regex.email.errorMessage                // 'Please enter a valid email address.'
```

### Parametric (Dynamic)

Some patterns accept parameters for flexible validation:

```ts
// Variable digit count
regex.digits(10).pattern.test('1234567890')      // true
regex.digits(7).pattern.test('1234567')          // true
regex.digits({ min: 3, max: 10 }).pattern.test('12345')  // true

// Custom phone length
regex.phone({ length: 7 }).pattern.test('1234567')  // true
regex.phone({ length: 10 }).pattern.test('1234567890') // true

// Credit card with custom range
regex.creditCard({ min: 13, max: 19 }).pattern.test('4111111111111') // true

// URL with protocol restriction
regex.url({ protocol: 'https' }).pattern.test('https://example.com') // true
regex.url({ protocol: 'https' }).pattern.test('http://example.com')  // false

// Password with custom rules
regex.password({ min: 12, special: true }).pattern.test('MyP@ssw0rd!') // true
```

### Custom Regex

When none of the built-in patterns fit your use case, use `regex.custom()` to define your own:

```ts
import { regex } from '@samline/formatter'

// Positional arguments — pattern + error message
const code = regex.custom(/^[A-Z]{5}$/, 'Must be exactly 5 uppercase letters')
code.pattern.test('HELLO')  // true
code.errorMessage           // 'Must be exactly 5 uppercase letters'

// Object form
const digits = regex.custom({
  pattern: /^\d{4,6}$/,
  errorMessage: 'Must be 4-6 digits.'
})
digits.pattern.test('12345')  // true

// Default error message if you omit one
const r = regex.custom(/^[a-z]+$/)
r.errorMessage  // 'Invalid value.'
```

---

## Pattern Reference

### Phone & Identity

| Pattern | Parameters | Description |
| --- | --- | --- |
| `phone` | `length?: number` | Phone numbers (default: 10 digits) |
| `rfc` | — | Mexican RFC (tax ID) |
| `curp` | — | Mexican CURP (unique population registry) |
| `cp` | — | Mexican postal code (5 digits) |
| `postalCode` | — | Generic postal code (5 digits, optional `+4`) |

### Numbers & Cards

| Pattern | Parameters | Description |
| --- | --- | --- |
| `numeral` | — | Numbers with thousand separators |
| `onlyNumbers` | `length?: number` | Digits only |
| `digits` | `length?: number \| { min, max }` | Variable digit count |
| `creditCard` | `min?: number, max?: number` | Card numbers (default: 15-16) |
| `expirationDate` | — | MM/YY or MM/YYYY format |
| `cardCvc` | — | 3-4 digit CVC |

### Text

| Pattern | Parameters | Description |
| --- | --- | --- |
| `onlyLetters` | — | Letters and spaces only |
| `onlyAlphanumeric` | — | Letters, numbers and spaces |
| `slug` | — | URL slug (lowercase, hyphens) |
| `username` | — | Username (3-20 chars, `_`/`-` allowed) |

### Dates & Times

| Pattern | Parameters | Description |
| --- | --- | --- |
| `date` | — | Date in `YYYY-MM-DD` format |
| `time24` | — | 24-hour time in `HH:MM` format |

### Web & Network

| Pattern | Parameters | Description |
| --- | --- | --- |
| `email` | — | Email addresses (RFC 5322 simplified) |
| `url` | `protocol?: 'http' \| 'https' \| 'ftp' \| 'all'` | URLs |
| `ipv4` | — | IPv4 addresses |
| `ipv6` | — | IPv6 addresses |
| `macAddress` | — | MAC address (`:` or `-` separated) |
| `hexColor` | — | Hex color codes (#RGB or #RRGGBB) |

### Social

| Pattern | Parameters | Description |
| --- | --- | --- |
| `hashtag` | — | Social media hashtags (#example) |
| `mention` | — | Social media mentions (@username) |

### Security

| Pattern | Parameters | Description |
| --- | --- | --- |
| `password` | `min?, max?, uppercase?, lowercase?, numbers?, special?` | Password strength |
| `uuid` | — | UUID v4 format |

### Encoding & Versions

| Pattern | Parameters | Description |
| --- | --- | --- |
| `base64` | — | Base64 encoded string |
| `semver` | — | Semantic version (`X.Y.Z`) |

### Utilities

| Pattern | Parameters | Description |
| --- | --- | --- |
| `custom` | `(pattern: RegExp, errorMessage?: string)` | User-defined regex |

---

## Examples

### Form Validation

```ts
import { regex } from '@samline/formatter'

function validateField(value: string, type: keyof typeof regex) {
  const { pattern, errorMessage } = regex[type]
  if (!pattern.test(value)) {
    return { valid: false, error: errorMessage }
  }
  return { valid: true }
}

validateField('hello@example.com', 'email')
// { valid: true }

validateField('not-an-email', 'email')
// { valid: false, error: 'Please enter a valid email address.' }
```

### Conditional Validation

```ts
function validatePhone(value: string, digitCount: number) {
  const { pattern, errorMessage } = regex.digits(digitCount)
  return pattern.test(value) ? { valid: true } : { valid: false, error: errorMessage }
}

validatePhone('1234567890', 10)
// { valid: true }

validatePhone('1234567', 7)
// { valid: true }

validatePhone('12345', 10)
// { valid: false, error: 'Please enter exactly 10 digits.' }
```

### Custom Password Policy

```ts
function createPasswordValidator(policy: {
  minLength: number
  requireUppercase: boolean
  requireNumber: boolean
  requireSpecial: boolean
}) {
  return regex.password({
    min: policy.minLength,
    uppercase: policy.requireUppercase,
    numbers: policy.requireNumber,
    special: policy.requireSpecial
  })
}

const validator = createPasswordValidator({
  minLength: 12,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true
})

validator.pattern.test('MyP@ssw0rd!')  // true
validator.pattern.test('weakpass')      // false
```
