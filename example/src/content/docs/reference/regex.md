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

## Pattern reference

| Key | Pattern | Matches | Error message |
| --- | --- | --- | --- |
| `phone` | `^(?:\D*\d){10}\D*$` | 10 digits, optionally with delimiters | `Please enter a valid 10-digit phone number.` |
| `email` | `^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$` | `foo@bar.com` | `Please enter a valid email address.` |
| `rfc` | `^([A-ZÑ&]{3,4})\d{6}([A-Z0-9]{0,3})$` | Mexican RFC (simplified, case-insensitive) | `Please enter a valid RFC.` |
| `numeral` | `\d{1,3}(,\d{3})*(\.\d+)?` | `1,234.56` | `Please enter a valid number.` |
| `onlyNumbers` | `^\d+$` | `12345` | `Please enter only numbers.` |
| `creditCard` | `^(?:\D*\d){15,16}\D*$` | 15- or 16-digit card numbers | `Please enter a valid card number.` |
| `expirationDate` | `^(0[1-9]|1[0-2])\/\d{2}$` | `12/29` (MM/YY) | `Please enter a valid expiration date.` |
| `cardCvc` | `^\d{3,4}$` | `123`, `1234` | `Please enter a valid CVC.` |
| `onlyLetters` | `^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$` | Letters with accents and spaces | `Please enter only letters.` |
| `onlyAlphanumeric` | `^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$` | Letters, digits, spaces | `Please enter only letters and numbers.` |

## Type-safe access

```ts
import { regex, type RegexKey } from '@samline/formatter'

function validate(key: RegexKey, value: string): string | null {
  return regex[key].pattern.test(value) ? null : regex[key].errorMessage
}

validate('email', 'foo@bar.com')   // null  (valid)
validate('email', 'not-an-email')  // 'Please enter a valid email address.'
```

## Notes

- These patterns are intentionally permissive — they catch the common typo cases, not every edge case. For stricter validation (e.g. full RFC 5322 email parsing, Luhn-checked card numbers), wrap them with your own logic.
- The RFC pattern targets the Mexican format (`XAXX000000XXX`). Replace it if you target a different jurisdiction.
- `RegexKey` is exported as `keyof typeof regex` so you can iterate the entries or build a type-safe settings UI.