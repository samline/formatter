---
locale: en
sidebar:
  group: reference
  order: 3
title: 'Validation patterns'
titleAccent: 'patterns'
description: 'The regex catalog of @samline/formatter: static and parametric validation patterns, each paired with a ready-to-use error message.'
---

The `regex` export is a readonly TypeScript object of validation patterns. Static entries pair a `RegExp` with an `errorMessage`; parametric-only helpers return that pair when called.

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

The entries whose usage **expanded** are `phone`, `creditCard`, `url`, `uuid`, `date` and `numeral`, which are also callable as functions (the static `.pattern` is still attached, so both forms coexist):

```ts
// ✅ Still works
regex.phone.pattern

// ✅ Also works (new)
regex.phone({ length: 7 })
```

## Usage modes

### 1. Static (object form)

Static entries expose `.pattern` and `.errorMessage`. The callable `phone`, `creditCard`, `url`, `uuid`, `date` and `numeral` entries retain those properties for backward compatibility:

```ts
regex.phone.pattern.test('5512345678') // true
regex.url.errorMessage // 'Please enter a valid URL.'
```

### 2. Parametric (callable form)

Several entries are also functions that accept options to tune the pattern. They return the same `{ pattern, errorMessage }` shape.

```ts
// Variable digit count
regex.digits(10).pattern.test('1234567890') // true
regex.digits(7).pattern.test('1234567') // true
regex.digits({ min: 3, max: 10 }).pattern.test('12345') // true

// Custom phone length
regex.phone({ length: 7 }).pattern.test('1234567') // true

// Credit card with custom range
regex.creditCard({ min: 13, max: 19 }).pattern.test('4111111111111') // true

// URL with protocol restriction
regex.url({ protocol: 'https' }).pattern.test('https://example.com') // true
regex.url({ protocol: 'https' }).pattern.test('ftp://example.com') // false

// Password with custom rules
regex.password({ min: 12, special: true }).pattern.test('MyP@ssw0rd!!') // true
```

### 3. Custom regex

When none of the built-in patterns fit your use case, define your own with `regex.custom()`. It accepts either positional or object form:

```ts
import { regex } from '@samline/formatter'

// Positional — pattern + error message
const code = regex.custom(/^[A-Z]{5}$/, 'Must be exactly 5 uppercase letters')
code.pattern.test('HELLO') // true
code.errorMessage // 'Must be exactly 5 uppercase letters'

// Object form
const zip = regex.custom({
  pattern: /^\d{4,6}$/,
  errorMessage: 'Must be 4–6 digits.',
})

// Default error message if omitted
const r = regex.custom(/^[a-z]+$/)
r.errorMessage // 'Invalid value.'
```

## Pattern reference

### Phone & Identity

| Key          | Signature                                         | Description                                                                                             | Error message                                                   |
| ------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `phone`      | `phone()` / `phone({ length })` / `phone.pattern` | Phone numbers (default: 10 digits). Spaces, hyphens, dots, parentheses and `+` may separate the digits. | `Please enter a valid 10-digit phone number.`                   |
| `rfc`        | `rfc.pattern`                                     | Mexican RFC: 3 or 4 letters, a real `YYMMDD` date and a 3-character homoclave                           | `Please enter a valid RFC.`                                     |
| `curp`       | `curp.pattern`                                    | Mexican CURP: date, sex (`H`, `M`, `X`), state code (`NE` abroad), inner consonants and check digit     | `Please enter a valid CURP.`                                    |
| `cp`         | `cp.pattern`                                      | Mexican postal code (`01000`–`99999`)                                                                   | `Please enter a valid 5-digit postal code.`                     |
| `clabe`      | `clabe.pattern`                                   | Mexican interbank account number (18 digits)                                                            | `Please enter a valid 18-digit CLABE.`                          |
| `nss`        | `nss.pattern`                                     | Mexican social security number (IMSS, 11 digits)                                                        | `Please enter a valid 11-digit NSS.`                            |
| `postalCode` | `postalCode.pattern`                              | US ZIP or ZIP+4 (`90210` or `90210-1234`)                                                               | `Please enter a valid postal code (e.g., 90210 or 90210-1234).` |

### Numbers & Cards

| Key              | Signature                                                          | Description                                                                                                                                                | Error message                                              |
| ---------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `numeral`        | `numeral.pattern` / `numeral(options)`                             | Static: optional `-`, plain or comma-grouped digits, optional decimals (`1,234.56`, `-42`). Called: what the `'numeral'` mask writes with the same options | `Please enter a valid number.`                             |
| `onlyNumbers`    | `onlyNumbers.pattern`                                              | Digits only                                                                                                                                                | `Please enter only numbers.`                               |
| `digits`         | `digits(n)` / `digits({ length })` / `digits({ min, max })`        | Variable digit count                                                                                                                                       | `Please enter N digits.`                                   |
| `creditCard`     | `creditCard()` / `creditCard({ min, max })` / `creditCard.pattern` | Card numbers (default: 12–19 digits, every ISO/IEC 7812 length), single spaces or hyphens allowed                                                          | `Please enter a valid card number (12-19 digits).`         |
| `expirationDate` | `expirationDate.pattern`                                           | `MM/YY` or `MM/YYYY`                                                                                                                                       | `Please enter a valid expiration date (MM/YY or MM/YYYY).` |
| `cardCvc`        | `cardCvc.pattern`                                                  | 3- or 4-digit CVC                                                                                                                                          | `Please enter a valid CVC (3-4 digits).`                   |
| `latitude`       | `latitude.pattern`                                                 | `-90` to `90`, optional decimals                                                                                                                           | `Please enter a valid latitude (-90 to 90).`               |
| `longitude`      | `longitude.pattern`                                                | `-180` to `180`, optional decimals                                                                                                                         | `Please enter a valid longitude (-180 to 180).`            |

`numeral(options)` reads `delimiter`, `numeralDecimalMark`, `numeralThousandsGroupStyle`, `numeralDecimalScale`, `numeralPositiveOnly`, `prefix`, `tailPrefix` and `signBeforePrefix`, so you can pass the options object of the field:

```ts
const options = { delimiter: '.', numeralDecimalMark: ',', prefix: '$ ' }
const { formatted } = format('1234,5', 'numeral', options) // '$ 1.234,5'
regex.numeral(options).pattern.test(formatted) // true
```

### Text

| Key                | Signature                  | Description                                                                                 | Error message                                                           |
| ------------------ | -------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `onlyLetters`      | `onlyLetters.pattern`      | Letters in any script (`Güemes`, `François`) and spaces; at least one letter                | `Please enter only letters.`                                            |
| `onlyAlphanumeric` | `onlyAlphanumeric.pattern` | Letters in any script, digits and spaces                                                    | `Please enter only letters and numbers.`                                |
| `personName`       | `personName.pattern`       | Words joined by single spaces, apostrophes, hyphens or periods (`O'Connor`, `Ma. Fernanda`) | `Please enter a valid name.`                                            |
| `slug`             | `slug.pattern`             | URL slug (lowercase, hyphens)                                                               | `Please enter a valid slug (lowercase, hyphens, no spaces).`            |
| `username`         | `username.pattern`         | 3–20 chars, letters, numbers, `_` or `-`                                                    | `Please enter a valid username (3-20 chars, letters, numbers, _ or -).` |

### Dates & Times

| Key           | Signature                        | Description                                                                                                                              | Error message                                            |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `date`        | `date.pattern` / `date(options)` | Static: real calendar date `YYYY-MM-DD` (no `2026-02-31`; 29 February only in leap years). Called: the `'date'` mask order and delimiter | `Please enter a valid date (YYYY-MM-DD).`                |
| `time`        | `time(options)`                  | The `'time'` mask: `timePattern`, `timeFormat` and `delimiter` (default `HH:MM:SS`, 24-hour)                                             | `Please enter a valid 24-hour time (HH:MM:SS).`          |
| `time24`      | `time24.pattern`                 | 24-hour time `HH:MM` with optional `:SS`                                                                                                 | `Please enter a valid 24-hour time (HH:MM).`             |
| `time12`      | `time12.pattern`                 | 12-hour time with AM/PM (`9:30 pm`, `09:30:15 AM`, `9:30 p. m.`)                                                                         | `Please enter a valid 12-hour time (e.g., 9:30 PM).`     |
| `isoDateTime` | `isoDateTime.pattern`            | ISO 8601 / RFC 3339 date-time (`2026-11-13T09:30`, `…:15.250Z`, `…-06:00`)                                                               | `Please enter a valid date and time (YYYY-MM-DDTHH:MM).` |

`regex.date` (static) tests the ISO `raw` value. To test the visible `formatted` value, call it with the field's options:

```ts
const options = { datePattern: ['d', 'm', 'Y'] }
regex.date(options).pattern.test('29/02/2028') // true
regex.date(options).pattern.test('31/04/2026') // false — April has 30 days
```

### Web & Network

| Key          | Signature                                     | Description                                                                            | Error message                                                  |
| ------------ | --------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `email`      | `email.pattern`                               | Email address: dot-atom local part, real domain labels, 64/254 length limits           | `Please enter a valid email address.`                          |
| `url`        | `url()` / `url({ protocol })` / `url.pattern` | `http`, `https` or `ftp` URL with a domain, `localhost` or IP host                     | `Please enter a valid URL.`                                    |
| `domain`     | `domain.pattern`                              | Host name without protocol (`example.com`, `sub.dominio.mx`)                           | `Please enter a valid domain (e.g., example.com).`             |
| `ipv4`       | `ipv4.pattern`                                | IPv4 addresses (no leading zeros)                                                      | `Please enter a valid IPv4 address.`                           |
| `ipv6`       | `ipv6.pattern`                                | IPv6 in full, compressed (`::1`, `2001:db8::1`) or IPv4-embedded form                  | `Please enter a valid IPv6 address.`                           |
| `macAddress` | `macAddress.pattern`                          | MAC address with one separator (`:` or `-`) throughout, or Cisco form `001b.4411.3ab7` | `Please enter a valid MAC address (e.g., 00:1B:44:11:3A:B7).`  |
| `hexColor`   | `hexColor.pattern`                            | Hex color codes (`#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`)                              | `Please enter a valid hex color code (e.g., #FFF or #FFFFFF).` |

### Social

| Key       | Signature         | Description                                                    | Error message                                     |
| --------- | ----------------- | -------------------------------------------------------------- | ------------------------------------------------- |
| `hashtag` | `hashtag.pattern` | Hashtags in any script (`#méxico`); not digits only            | `Please enter a valid hashtag (e.g., #example).`  |
| `mention` | `mention.pattern` | Mentions up to 30 characters: letters, digits, `_`, inner dots | `Please enter a valid mention (e.g., @username).` |

### Security

| Key        | Signature                                                                       | Description                                               | Error message                                         |
| ---------- | ------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------- |
| `password` | `password()` / `password({ min, max, uppercase, lowercase, numbers, special })` | Password strength (default: 8+ chars, mixed case, digits) | `Password must be N–M characters with at least one …` |
| `uuid`     | `uuid.pattern` / `uuid({ version })`                                            | RFC 9562 UUID, versions 1–8; `version` pins one           | `Please enter a valid UUID.`                          |

### Encoding & Versions

| Key         | Signature           | Description                                                        | Error message                                          |
| ----------- | ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| `base64`    | `base64.pattern`    | Padded Base64, not empty                                           | `Please enter a valid Base64 encoded string.`          |
| `base64url` | `base64url.pattern` | URL-safe Base64 (JWT segments), padding optional, not empty        | `Please enter a valid Base64URL encoded string.`       |
| `semver`    | `semver.pattern`    | Semantic Versioning 2.0.0 (`1.2.3`, `1.2.3-rc.1`, `1.2.3+build.5`) | `Please enter a valid semantic version (e.g., 1.2.3).` |

### Utilities

| Key      | Signature                                                              | Description                                              |
| -------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `custom` | `custom(pattern, errorMessage?)` / `custom({ pattern, errorMessage })` | User-defined regex. Returns `{ pattern, errorMessage }`. |

## Type-safe access

```ts
import { regex, type RegexKey } from '@samline/formatter'

function validate(key: RegexKey, value: string): string | null {
  return regex[key].pattern.test(value) ? null : regex[key].errorMessage
}

validate('email', 'foo@bar.com') // null  (valid)
validate('email', 'not-an-email') // 'Please enter a valid email address.'
```

`RegexKey` covers entries that always expose a static `.pattern` and `.errorMessage`, including the static sides of `phone`, `creditCard`, and `url`. It excludes the parametric-only helpers `digits`, `time`, `password`, and `custom`.

## Notes

- These patterns check shape, not existence: a CURP, RFC, CLABE or card number can match and still have a wrong check digit, and an email can match and still bounce. For check digits (Luhn, CLABE, CURP) add a `validate` function, and always validate again on the server.
- Patterns that need Unicode letters (`email`, `url`, `domain`, `onlyLetters`, `onlyAlphanumeric`, `personName`, `hashtag`, `password`) use the `u` flag.
- The `rfc` pattern targets the Mexican format (`XAXX000000XXX`). Replace it if you target a different jurisdiction, or use `regex.custom()` with your own pattern.
- Parametric functions return a fresh `{ pattern, errorMessage }` object on every call, so they are safe to use inline without sharing state.
- The `password` builder treats each flag as a **requirement**, not an allow-list: any non-whitespace character is accepted, so `Passw0rd!` passes the default policy. `uppercase` and `lowercase` count capitals and small letters in any script (`Ñ`, `É`), and `special: true` requires at least one character that is not a letter, number or space (`~`, `€`, `\`…). All flags default to `true` except `special`, which defaults to `false`. Disabling every flag leaves a length-only policy.
- Parametric builders (`digits`, `phone`, `creditCard`, `password`, `numeral`) throw a `RangeError` for negative or fractional counts and for `min > max`; `uuid` throws for a version outside 1–8, and `date` / `time` for an unknown pattern unit.
