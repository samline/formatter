---
title: Regex
description: Validation patterns bundled with @samline/formatter, each paired with a ready-to-use error message.
sidebar:
  order: 4
---

The `regex` export is a frozen object of validation patterns. Each entry pairs a `RegExp` with an `errorMessage` string so you can show the user the same wording the validator uses.

```ts
import { regex } from '@samline/formatter'

if (!regex.email.pattern.test(input.value)) {
  input.setCustomValidity(regex.email.errorMessage)
}
```

## Backward compatibility

Every existing pattern keeps its static `.pattern` / `.errorMessage` API. Nothing that worked before stops working — only new keys and new call signatures have been added.

```ts
// ✅ Still works (unchanged)
regex.phone.pattern.test('5512345678')
regex.email.errorMessage
```

The only entries whose usage **expanded** are `phone`, `creditCard`, and `url`, which are now also callable as functions (the static `.pattern` is still attached, so both forms coexist):

```ts
// ✅ Still works
regex.phone.pattern

// ✅ Also works (new)
regex.phone({ length: 7 })
```

## Usage modes

### 1. Static (object form)

The default form — every entry exposes a `.pattern` and a `.errorMessage`:

```ts
regex.phone.pattern.test('5512345678')  // true
regex.url.errorMessage                  // 'Please enter a valid URL.'
```

### 2. Parametric (callable form)

Several entries are also functions that accept options to tune the pattern. They return the same `{ pattern, errorMessage }` shape.

```ts
// Variable digit count
regex.digits(10).pattern.test('1234567890')           // true
regex.digits(7).pattern.test('1234567')               // true
regex.digits({ min: 3, max: 10 }).pattern.test('12345')  // true

// Custom phone length
regex.phone({ length: 7 }).pattern.test('1234567')    // true

// Credit card with custom range
regex.creditCard({ min: 13, max: 19 }).pattern.test('4111111111111')  // true

// URL with protocol restriction
regex.url({ protocol: 'https' }).pattern.test('https://example.com')  // true
regex.url({ protocol: 'https' }).pattern.test('ftp://example.com')    // false

// Password with custom rules
regex.password({ min: 12, special: true }).pattern.test('MyP@ssw0rd!!')  // true
```

### 3. Custom regex

When none of the built-in patterns fit your use case, define your own with `regex.custom()`. It accepts either positional or object form:

```ts
import { regex } from '@samline/formatter'

// Positional — pattern + error message
const code = regex.custom(/^[A-Z]{5}$/, 'Must be exactly 5 uppercase letters')
code.pattern.test('HELLO')   // true
code.errorMessage            // 'Must be exactly 5 uppercase letters'

// Object form
const zip = regex.custom({
  pattern: /^\d{4,6}$/,
  errorMessage: 'Must be 4–6 digits.'
})

// Default error message if omitted
const r = regex.custom(/^[a-z]+$/)
r.errorMessage  // 'Invalid value.'
```

## Pattern reference

### Phone & Identity

| Key | Signature | Description | Error message |
| --- | --- | --- | --- |
| `phone` | `phone()` / `phone({ length })` / `phone.pattern` | Phone numbers (default: 10 digits) | `Please enter a valid phone number.` |
| `rfc` | `rfc.pattern` | Mexican RFC (tax ID) | `Please enter a valid RFC.` |
| `curp` | `curp.pattern` | Mexican CURP (unique population registry) | `Please enter a valid CURP.` |
| `cp` | `cp.pattern` | Mexican postal code (5 digits) | `Please enter a valid 5-digit postal code.` |
| `postalCode` | `postalCode.pattern` | Generic postal code (`90210` or `90210-1234`) | `Please enter a valid postal code (e.g., 90210 or 90210-1234).` |

### Numbers & Cards

| Key | Signature | Description | Error message |
| --- | --- | --- | --- |
| `numeral` | `numeral.pattern` | Numbers with thousand separators and decimals (`1,234.56`) | `Please enter a valid number.` |
| `onlyNumbers` | `onlyNumbers.pattern` | Digits only | `Please enter only numbers.` |
| `digits` | `digits(n)` / `digits({ length })` / `digits({ min, max })` | Variable digit count | `Please enter N digits.` |
| `creditCard` | `creditCard()` / `creditCard({ min, max })` / `creditCard.pattern` | Card numbers (default: 15–16) | `Please enter a valid card number (15-16 digits).` |
| `expirationDate` | `expirationDate.pattern` | `MM/YY` or `MM/YYYY` | `Please enter a valid expiration date (MM/YY or MM/YYYY).` |
| `cardCvc` | `cardCvc.pattern` | 3- or 4-digit CVC | `Please enter a valid CVC (3-4 digits).` |

### Text

| Key | Signature | Description | Error message |
| --- | --- | --- | --- |
| `onlyLetters` | `onlyLetters.pattern` | Letters and spaces only (with accents) | `Please enter only letters.` |
| `onlyAlphanumeric` | `onlyAlphanumeric.pattern` | Letters, digits and spaces | `Please enter only letters and numbers.` |
| `slug` | `slug.pattern` | URL slug (lowercase, hyphens) | `Please enter a valid slug (lowercase, hyphens, no spaces).` |
| `username` | `username.pattern` | 3–20 chars, letters, numbers, `_` or `-` | `Please enter a valid username (3-20 chars, letters, numbers, _ or -).` |

### Dates & Times

| Key | Signature | Description | Error message |
| --- | --- | --- | --- |
| `date` | `date.pattern` | Date in `YYYY-MM-DD` format | `Please enter a valid date (YYYY-MM-DD).` |
| `time24` | `time24.pattern` | 24-hour time in `HH:MM` format | `Please enter a valid 24-hour time (HH:MM).` |

### Web & Network

| Key | Signature | Description | Error message |
| --- | --- | --- | --- |
| `email` | `email.pattern` | Email addresses (RFC 5322 simplified) | `Please enter a valid email address.` |
| `url` | `url()` / `url({ protocol })` / `url.pattern` | URLs (`http`, `https`, `ftp`) | `Please enter a valid URL.` |
| `ipv4` | `ipv4.pattern` | IPv4 addresses | `Please enter a valid IPv4 address.` |
| `ipv6` | `ipv6.pattern` | IPv6 addresses | `Please enter a valid IPv6 address.` |
| `macAddress` | `macAddress.pattern` | MAC address (colon or hyphen separated) | `Please enter a valid MAC address (e.g., 00:1B:44:11:3A:B7).` |
| `hexColor` | `hexColor.pattern` | Hex color codes (`#RGB` or `#RRGGBB`) | `Please enter a valid hex color code (e.g., #FFF or #FFFFFF).` |

### Social

| Key | Signature | Description | Error message |
| --- | --- | --- | --- |
| `hashtag` | `hashtag.pattern` | Social media hashtags (`#example`) | `Please enter a valid hashtag (e.g., #example).` |
| `mention` | `mention.pattern` | Social media mentions (`@username`) | `Please enter a valid mention (e.g., @username).` |

### Security

| Key | Signature | Description | Error message |
| --- | --- | --- | --- |
| `password` | `password()` / `password({ min, max, uppercase, lowercase, numbers, special })` | Password strength (default: 8+ chars, mixed case, digits) | `Password must be N–M characters with at least one …` |
| `uuid` | `uuid.pattern` | UUID v4 format | `Please enter a valid UUID.` |

### Encoding & Versions

| Key | Signature | Description | Error message |
| --- | --- | --- | --- |
| `base64` | `base64.pattern` | Base64 encoded string | `Please enter a valid Base64 encoded string.` |
| `semver` | `semver.pattern` | Semantic version (`1.2.3` or `1.2.3-rc.1`) | `Please enter a valid semantic version (e.g., 1.2.3).` |

### Utilities

| Key | Signature | Description |
| --- | --- | --- |
| `custom` | `custom(pattern, errorMessage?)` / `custom({ pattern, errorMessage })` | User-defined regex. Returns `{ pattern, errorMessage }`. |

## Type-safe access

```ts
import { regex, type RegexKey } from '@samline/formatter'

function validate(key: RegexKey, value: string): string | null {
  return regex[key].pattern.test(value) ? null : regex[key].errorMessage
}

validate('email', 'foo@bar.com')   // null  (valid)
validate('email', 'not-an-email')  // 'Please enter a valid email address.'
```

`RegexKey` is exported as `keyof typeof regex` so you can iterate the entries or build a type-safe settings UI. Note that `RegexKey` covers the static entries; the parametric functions (`digits`, `phone`, `creditCard`, `url`, `password`, `custom`) are invoked through their function form rather than through the indexed lookup.

## Notes

- These patterns are intentionally permissive — they catch the common typo cases, not every edge case. For stricter validation (e.g. full RFC 5322 email parsing, Luhn-checked card numbers), wrap them with your own logic.
- The `rfc` pattern targets the Mexican format (`XAXX000000XXX`). Replace it if you target a different jurisdiction, or use `regex.custom()` with your own pattern.
- Parametric functions return a fresh `{ pattern, errorMessage }` object on every call, so they are safe to use inline without sharing state.
- The `password` builder constructs the character class from the options you pass. With `special: true` it accepts `!@#$%^&*()_+\-=[]{}|;:'",.<>?/`. All flags default to `true` except `special`, which defaults to `false`.
