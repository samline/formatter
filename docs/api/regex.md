# `regex`

A pre-built object of validation patterns. Each entry pairs a `RegExp` with a ready-to-use `errorMessage` so consumers do not have to keep them in sync.

```ts
import { regex } from '@samline/formatter'

if (!regex.email.pattern.test(input.value)) {
  input.setCustomValidity(regex.email.errorMessage)
}
```

## Surface

`regex` is a readonly TypeScript object. Most entries are `{ pattern: RegExp, errorMessage: string }` records; some are callable functions that accept options and return a fresh `{ pattern, errorMessage }`. The backward-compatible callable variants (`phone`, `creditCard`, and `url`) also expose a static `.pattern`; parametric-only helpers (`digits`, `password`, and `custom`) must be called first.

```ts
// ✅ Static (always available)
regex.phone.pattern.test('5512345678')   // true
regex.email.errorMessage                  // 'Please enter a valid email address.'

// ✅ Callable (parametric variants)
regex.phone({ length: 7 }).pattern.test('1234567')   // true
regex.digits(10).pattern.test('1234567890')           // true
regex.url({ protocol: 'https' }).pattern.test('https://example.com') // true

// ✅ Both styles coexist
regex.phone.pattern                        // RegExp
regex.phone({ length: 10 }).pattern        // RegExp (different one)

// ✅ Custom regex
regex.custom(/^[A-Z]{5}$/, 'Must be 5 uppercase letters').pattern.test('HELLO')
```

## Types

```ts
interface RegexEntry {
  pattern: RegExp
  errorMessage: string
}

type RegexKey = /* union of static-entry keys */
type Regex = typeof regex
```

`RegexKey` contains only entries that always expose `.pattern` and `.errorMessage`, so indexed validation stays type-safe:

```ts
import { regex, type RegexKey } from '@samline/formatter'

function validate(key: RegexKey, value: string): string | null {
  return regex[key].pattern.test(value) ? null : regex[key].errorMessage
}

validate('email', 'foo@bar.com')   // null  (valid)
validate('email', 'not-an-email')  // 'Please enter a valid email address.'
```

`RegexKey` includes the static entries, including the static sides of `phone`, `creditCard`, and `url`. It excludes the parametric-only helpers `digits`, `password`, and `custom`.

## Static reference

The full pattern table lives at [docs/regex.md](../regex.md), which has the same shape as the Starlight page at [reference/regex.md](https://github.com/samline/formatter/blob/main/example/src/content/docs/reference/regex.md).

## Parametric reference

### `regex.digits(params?)`

Digits with a configurable count.

```ts
regex.digits(10).pattern.test('1234567890')           // true
regex.digits({ length: 7 }).pattern.test('1234567')   // true
regex.digits({ min: 3, max: 10 }).pattern.test('12345')  // true
```

| Param | Type | Description |
| --- | --- | --- |
| `length` (positional) | `number` | Exact digit count. |
| `length` (object) | `number` | Exact digit count (alias of `min` and `max`). |
| `min`, `max` | `number` | Inclusive lower / upper bound. Defaults: `min = 1`, `max = 20`. |

Default error messages: `Please enter exactly N digits.` for fixed-length, `Please enter M-N digits.` for ranges.

### `regex.phone(params?)`

Phone with a configurable digit count.

```ts
regex.phone().pattern.test('5512345678')         // true (10 digits)
regex.phone({ length: 7 }).pattern.test('1234567')  // true
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `number` | `10` | Exact digit count. |

Default error message: `Please enter a valid N-digit phone number.`

### `regex.creditCard(params?)`

Credit card with a configurable digit range.

```ts
regex.creditCard().pattern.test('4111111111111111')        // true (15-16 digits)
regex.creditCard({ min: 13, max: 19 }).pattern.test('1234567890123')  // true
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `min`, `max` | `number` | `min = 15`, `max = 16` | Inclusive digit range. |

Default error message: `Please enter a valid card number (min-max digits).`

### `regex.url(params?)`

URL with a configurable protocol.

```ts
regex.url().pattern.test('https://example.com')    // true
regex.url({ protocol: 'https' }).pattern.test('https://example.com')  // true
regex.url({ protocol: 'https' }).pattern.test('ftp://example.com')    // false
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `protocol` | `'http' \| 'https' \| 'ftp' \| 'all'` | `'all'` | Required URL scheme. `all` accepts both `http` and `https`. |

Default error message: `Please enter a valid URL` (or `Please enter a valid URL (https://...)` when `protocol` is restricted).

### `regex.password(params?)`

Password with configurable strength rules.

```ts
regex.password().pattern.test('Passw0rd!')              // true (8+ chars, upper, lower, number)
regex.password({ min: 12, special: true }).pattern.test('MyP@ssw0rd!')  // true
```

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `min` | `number` | `8` | Minimum length. |
| `max` | `number` | `128` | Maximum length. |
| `uppercase` | `boolean` | `true` | Require at least one uppercase letter. |
| `lowercase` | `boolean` | `true` | Require at least one lowercase letter. |
| `numbers` | `boolean` | `true` | Require at least one digit. |
| `special` | `boolean` | `false` | Require at least one special character (`!@#$%^&*()_+\-=[]{}|;:'",.<>?/`). |

Default error message is built from the configured rule set, e.g. `Password must be 8-128 characters with at least one uppercase letter, lowercase letter and number.`

### `regex.custom(patternOrParams, errorMessage?)`

Define your own regex when none of the built-in patterns fit. Accepts positional or object form:

```ts
// Positional — pattern + error message
const code = regex.custom(/^[A-Z]{5}$/, 'Must be exactly 5 uppercase letters')
code.pattern.test('HELLO')   // true
code.errorMessage            // 'Must be exactly 5 uppercase letters'

// Object form
const zip = regex.custom({
  pattern: /^\d{4,6}$/,
  errorMessage: 'Must be 4-6 digits.'
})
zip.pattern.test('12345')    // true

// Default error message if omitted
const r = regex.custom(/^[a-z]+$/)
r.errorMessage  // 'Invalid value.'
```

| Param | Type | Description |
| --- | --- | --- |
| `pattern` (positional) | `RegExp` | The pattern to test. |
| `errorMessage` (positional) | `string` (optional) | Wording shown to the user. Defaults to `'Invalid value.'`. |
| `patternOrParams` (object) | `{ pattern: RegExp; errorMessage: string }` | Bundle form. |

## Examples

### Pairing with a form validator

```ts
import { regex, type RegexKey } from '@samline/formatter'

function validateField(value: string, type: RegexKey) {
  const { pattern, errorMessage } = regex[type]
  return pattern.test(value) ? { valid: true } : { valid: false, error: errorMessage }
}

validateField('hello@example.com', 'email')
// { valid: true }

validateField('not-an-email', 'email')
// { valid: false, error: 'Please enter a valid email address.' }
```

### Conditional validation

```ts
function validatePhone(value: string, digitCount: number) {
  const { pattern, errorMessage } = regex.digits(digitCount)
  return pattern.test(value) ? { valid: true } : { valid: false, error: errorMessage }
}

validatePhone('1234567890', 10)  // { valid: true }
validatePhone('12345', 10)       // { valid: false, error: 'Please enter exactly 10 digits.' }
```

### Custom password policy

```ts
const validator = regex.password({
  min: 12,
  uppercase: true,
  numbers: true,
  special: true
})

validator.pattern.test('MyP@ssw0rd!')  // true
validator.pattern.test('weakpass')      // false
```

## Notes

- These patterns are intentionally permissive — they catch the common typo cases, not every edge case. For stricter validation (full RFC 5322 email parsing, Luhn-checked card numbers), wrap them with your own logic.
- The `rfc` pattern targets the Mexican format (`XAXX000000XXX`). Replace it if you target a different jurisdiction.
- Parametric functions return a fresh `{ pattern, errorMessage }` on every call, so they are safe to use inline without sharing state.
- The `password` builder constructs the character class from the options you pass. With `special: true` it accepts `!@#$%^&*()_+\-=[]{}|;:'",.<>?/`. All flags default to `true` except `special`, which defaults to `false`.

## Related

- [`format`](./format.md) — the formatter's main entry point.
- [recipes](../recipes.md#9-validating-with-regex) — pairing `regex` with `format` for end-to-end form validation.
