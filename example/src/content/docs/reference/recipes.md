---
title: Recipes
description: End-to-end patterns that pair @samline/formatter with real form widgets.
sidebar:
  order: 8
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

End-to-end patterns that pair `format()` with real form widgets, frameworks, and validators. The package is pure on purpose — there is no controller to mount and no lifecycle to worry about — the visible input, the hidden mirror, and the error message are always wired through the same `input` listener, and the caller decides which framework owns the state.

For framework-specific wiring (React / Vue / Svelte), see [Formatting with frameworks](../guides/formatting-with-frameworks/). This page focuses on concrete scenarios and option combinations.

<Tabs syncKey="runtime">
	<TabItem label="Bundler / TS">

		The standard entrypoint — `import { format } from '@samline/formatter'`. Works with Vite, Webpack, Rollup, esbuild, Bun, and any modern bundler.

		```ts
		import { format } from '@samline/formatter'

		const result = format('5512345678', 'phone')
		console.log(result.formatted) // '55 1234 5678'
		console.log(result.raw)       // '5512345678'
		```

	</TabItem>
	<TabItem label="Browser global">

		No bundler required. Drop the CDN script and use `window.Formatter.format(...)`.

		```html
		<script src="https://unpkg.com/@samline/formatter@2.0.2/dist/browser/global.global.js"></script>
		<script>
		  const result = window.Formatter.format('5512345678', 'phone')
		  console.log(result.formatted)
		</script>
		```

	</TabItem>
</Tabs>

## Recipe: Phone with country selector

Drive `format()` off a country picker so the same input formats MX vs US numbers correctly.

```ts title="src/phone.ts"
import { format } from '@samline/formatter'

const COUNTRY_CODES = ['MX', 'US', 'AR', 'ES'] as const
type Country = (typeof COUNTRY_CODES)[number]

export function attachPhoneInput(
  input: HTMLInputElement,
  hidden: HTMLInputElement,
  country: HTMLSelectElement
) {
  input.addEventListener('input', () => {
    const { formatted, raw } = format(input.value, 'phone', {
      country: country.value as Country
    })
    input.value = formatted
    hidden.value = raw
  })
}
```

```html title="index.html"
<select id="country">
  <option value="MX">Mexico (+52)</option>
  <option value="US">United States (+1)</option>
</select>

<input id="phone" type="text" inputmode="tel" autocomplete="tel">
<input id="phone_raw" type="hidden" name="phone">

<script type="module">
  import { attachPhoneInput } from './phone.ts'

  attachPhoneInput(
    document.getElementById('phone'),
    document.getElementById('phone_raw'),
    document.getElementById('country')
  )
</script>
```

The form submits `phone` (digits with a possible leading `+` for international numbers). The listener reads the current selector value on every input, so country changes do not accumulate duplicate handlers.

## Recipe: Credit card with brand detection

Use `creditCardType` to detect the brand and `creditCard` to format the number. The brand name goes into a hidden field so the server can pick the right processor without re-running detection.

```ts title="src/card.ts"
import { format } from '@samline/formatter'

export function attachCardInput(
  number: HTMLInputElement,
  brandHidden: HTMLInputElement,
  numberHidden: HTMLInputElement
) {
  number.addEventListener('input', () => {
    const typed = format(number.value, 'creditCardType')
    const full  = format(number.value, 'creditCard')
    number.value       = full.formatted
    numberHidden.value = full.raw
    brandHidden.value  = typed.formatted  // 'visa', 'mastercard', 'amex'
  })
}
```

`format()` is pure, so calling it twice on the same value is cheap. Detecting the brand and formatting the number in a single pass keeps both responsibilities out of your listener body.

## Recipe: Currency input with prefix

Drive an input that displays `$1,234.50` while the form submits the digits-only `1234.50`.

```ts title="src/currency.ts"
import { format } from '@samline/formatter'

export function attachCurrencyInput(
  input: HTMLInputElement,
  hidden: HTMLInputElement
) {
  input.addEventListener('input', () => {
    const { formatted, raw } = format(input.value, 'numeral', {
      prefix: '$',
      numeralDecimalScale: 2,
      numeralDecimalMark: '.'
    })
    input.value = formatted
    hidden.value = raw
  })
}
```

`numeral` strips the prefix from `raw` by default. Use `rawPrefix: true` if your backend expects the prefix in the canonical value (uncommon for currencies — canonical prices are usually digits-only).

## Recipe: Date input that accepts both raw and formatted

The `date` format accepts raw `Y-m-d` and emits the display pattern. Pair it with `<input type="date">` (which always emits raw) and render the human-friendly display via a sibling element.

```ts title="src/date.ts"
import { format } from '@samline/formatter'

export function attachDateInput(
  native: HTMLInputElement,
  display: HTMLElement,
  hidden: HTMLInputElement
) {
  const sync = () => {
    const { formatted, raw } = format(native.value, 'date', {
      datePattern: ['d', 'm', 'Y'],
      delimiter: '/'
    })
    display.textContent = formatted || '—'
    hidden.value        = raw
  }

  native.addEventListener('input', sync)
  sync()
}
```

The `'auto'` default for `interpretInputAs` detects the eight-digit server-prefilled case (`19901212` → `12/12/1990`) without you having to thread any preset values through your own code.

## Recipe: Serial number with auto-prepended prefix

A common pattern is an identifier with a fixed prefix the user shouldn't have to retype (e.g. `EASY123456789`). Drive the visible input with `prefix` + `blocks`, and ship the canonical value (with prefix) to the backend via `rawPrefix: true`.

```ts title="src/serial.ts"
import { format } from '@samline/formatter'

export function attachSerialInput(
  input: HTMLInputElement,
  hidden: HTMLInputElement
) {
  input.addEventListener('input', () => {
    const { formatted, raw } = format(input.value, 'general', {
      blocks: [13],     // 4-char prefix slot + 9-digit body slot
      prefix: 'EASY',
      rawPrefix: true   // ship the canonical identifier
    })
    input.value = formatted
    hidden.value = raw  // => 'EASY123456789' ready for the backend
  })
}
```

Because the user types only the body, paste collisions ("did the user paste the prefix or the body?") are absorbed: `format()` strips an already-typed prefix before processing and re-prepends it on output.

## Recipe: Prefix the user must type themselves

When the prefix lives in the data the user is transcribing (not in your database), let them drive the prefix character-by-character with `prefixMode: 'passthrough'`. Each matching character sticks; the field never snaps back to the literal prefix.

```ts title="src/serial-passthrough.ts"
import { format } from '@samline/formatter'

export function attachSerialInputPassthrough(
  input: HTMLInputElement,
  hidden: HTMLInputElement
) {
  input.addEventListener('input', () => {
    const { formatted, raw } = format(input.value, 'general', {
      blocks: [13],
      prefix: 'EASY',
      prefixMode: 'passthrough',
      rawPrefix: true
    })
    input.value = formatted
    hidden.value = raw
  })
}
```

`E` → `E` (visible) → `EA` → `EAS` → `EASY` → `EASY1`. Each intermediate state shows what the user actually typed and `raw` strips the prefix before sending it to the backend.

## Recipe: Independent head and tail decorations

`prefix` and `suffix` are independent. Combine them for codes like `PRE-12345-END` where both ends carry meaning.

```ts title="src/code.ts"
import { format } from '@samline/formatter'

export function attachCodeInput(
  input: HTMLInputElement,
  hidden: HTMLInputElement
) {
  input.addEventListener('input', () => {
    const { formatted, raw } = format(input.value, 'general', {
      blocks: [11],
      prefix: 'PRE-',
      suffix: '-END',
      rawPrefix: true,
      rawSuffix: true
    })
    input.value = formatted
    hidden.value = raw
  })
}
```

When `rawPrefix: true` or `rawSuffix: true`, the body part of `raw` is derived from the formatted body (with the display delimiter stripped) rather than the user's typed input verbatim. This means `numericOnly`, `uppercase`, and `lowercase` are honoured in the canonical raw too.

## Recipe: Currency-style suffix with `suffix`

For prices like `100 USD`, use the dedicated `suffix` option (instead of the legacy `prefix + tailPrefix` hack). `rawSuffix: true` ships the canonical `100 USD` to the backend when needed.

```ts title="src/price.ts"
import { format } from '@samline/formatter'

export function attachPriceInput(
  input: HTMLInputElement,
  hidden: HTMLInputElement
) {
  input.addEventListener('input', () => {
    const { formatted, raw } = format(input.value, 'general', {
      blocks: [12],
      suffix: 'USD',
      suffixMode: 'lock'
    })
    input.value = formatted
    hidden.value = raw
  })
}
```

When `rawSuffix` is omitted, `raw` is digits-only — pass `true` to ship the canonical identifier.

## Recipe: Validating with `regex`

Pair `format()` with the bundled `regex` object so the error message you show the user matches what the validator checks.

```ts title="src/validate.ts"
import { format, regex } from '@samline/formatter'

export function validateCardNumber(value: string): string | null {
  return regex.creditCard.pattern.test(value)
    ? null
    : regex.creditCard.errorMessage
}

export function validateEmail(value: string): string | null {
  return regex.email.pattern.test(value)
    ? null
    : regex.email.errorMessage
}

export function attachEmailField(
  input: HTMLInputElement,
  hidden: HTMLInputElement,
  error: HTMLElement
) {
  input.addEventListener('input', () => {
    const { formatted, raw } = format(input.value, 'general', {
      blocks: [64],
      delimiter: ''
    })
    input.value       = formatted
    hidden.value      = raw
    error.textContent = validateEmail(raw) ?? ''
  })
}
```

`regex` always returns `{ pattern, errorMessage }` so the same string flows into the native HTML5 validation (`input.setCustomValidity(regex.email.errorMessage)`) and your UI.

## Recipe: Vanilla `<form>` posted natively

When the form is rendered server-side (Blade, ERB, classic Rails) and you only need the formatting before submission, no JS framework is required.

```html title="checkout.html"
<form id="checkout" action="/checkout" method="post">
  @csrf
  <input id="phone"    type="text" inputmode="tel" autocomplete="tel">
  <input id="phone_raw" type="hidden" name="phone">
  <input id="amount"   type="text" inputmode="decimal">
  <input id="amount_raw" type="hidden" name="amount">
  <button type="submit">Checkout</button>
</form>

<script src="https://unpkg.com/@samline/formatter@2.0.2/dist/browser/global.global.js"></script>
<script>
  const F = window.Formatter

  const phone    = document.getElementById('phone')
  const phoneRaw = document.getElementById('phone_raw')
  phone.addEventListener('input', () => {
    const { formatted, raw } = F.format(phone.value, 'phone', { country: 'MX' })
    phone.value    = formatted
    phoneRaw.value = raw
  })

  const amount    = document.getElementById('amount')
  const amountRaw = document.getElementById('amount_raw')
  amount.addEventListener('input', () => {
    const { formatted, raw } = F.format(amount.value, 'numeral', { prefix: '$' })
    amount.value    = formatted
    amountRaw.value = raw
  })
</script>
```

The browser submits `phone` and `amount` as the canonical values; the visible fields stay formatted for the user.

## Recipe: Server-side formatting (queues, webhooks, email rendering)

`format()` is pure, so you can call it from a Node job, a webhook handler, or an email renderer without bundling for a browser.

```ts title="src/server-format.ts"
import { format } from '@samline/formatter'

// Normalize a phone number from a CRM webhook before storing it.
const stored = format('+525512345678', 'phone', { country: 'MX' })
// stored.formatted: '+52 55 1234 5678'
// stored.raw:       '+525512345678'

// Render an "amount due" string in a transactional email.
const invoice = format('123456', 'numeral', { prefix: '$', delimiter: ',' })
// invoice.formatted: '$123,456'
// invoice.raw:       '123456'
```

There is no client-side limit. Import it anywhere JavaScript runs.

## Recipe: Pairing with `@samline/forms`

When you use `@samline/forms` for validation and submit handling, drive `format()` from the controller's `watch` / `subscribe` so the visible always reflects the canonical value the backend will receive.

```ts title="src/forms-integration.ts"
import { form, regex } from '@samline/forms'
import { format } from '@samline/formatter'

const checkout = form('checkout-form', {
  validators: { phone: { required: true, pattern: regex.phone.pattern } }
})

const phone    = document.querySelector<HTMLInputElement>('input[name="phone"]')!
const phoneRaw = document.querySelector<HTMLInputElement>('input[name="phone_raw"]')!

// Populate the hidden mirror before the controller reads values.
phone.addEventListener('input', () => {
  const { formatted, raw } = format(phone.value, 'phone', { country: 'MX' })
  phone.value    = formatted
  phoneRaw.value = raw
})

checkout.onSubmit(async (_form, _data, formData) => {
  await fetch('/checkout', { method: 'POST', body: formData })
})
```

`@samline/forms` ships a `format()` / `formatAll()` method on its controller that wraps this plumbing (renames the visible to `<field>_displayed`, creates the hidden, and respects `auto` / `display` interpretation per source). See the [forms guide on formatting](https://samline.github.io/forms/guides/formatting/) for the full mirror lifecycle.

## Related

- [Formatting with frameworks](../guides/formatting-with-frameworks/) — recommended wiring for React, Vue, Svelte, and vanilla.
- [Configuration reference](./configuration/) — every `FormatOptions` field, with defaults and runtime impact.
- [TypeScript reference](./typescript/) — full type table for `FormatOptions`, `FormatterResult`, and the parametric `regex` overloads.
- [regex reference](./regex/) — bundled validation patterns paired with ready-to-use error messages.
