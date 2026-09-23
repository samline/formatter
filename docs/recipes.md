# Recipes

End-to-end patterns that pair `format()` with real form widgets, frameworks, and validators. Each recipe is a self-contained snippet you can drop into a project and adapt.

The package is pure on purpose. There is no controller to mount and no lifecycle to worry about — the visible input, the hidden mirror, and the error message are always wired through the same `input` listener, and the caller decides which framework owns the state.

---

## 1. Phone with country selector

Drive `format()` off a country picker so the same input formats MX vs US numbers correctly.

```ts
import { format } from '@samline/formatter'

const COUNTRY_CODES = ['MX', 'US', 'AR', 'ES'] as const
type Country = (typeof COUNTRY_CODES)[number]

export function attachPhoneInput(
  input: HTMLInputElement,
  hidden: HTMLInputElement,
  getCountry: () => Country
) {
  input.addEventListener('input', () => {
    const { formatted, raw } = format(input.value, 'phone', {
      country: getCountry()
    })
    input.value = formatted
    hidden.value = raw
  })
}
```

```html
<select id="country">
  <option value="MX">Mexico (+52)</option>
  <option value="US">United States (+1)</option>
  <option value="AR">Argentina (+54)</option>
  <option value="ES">Spain (+34)</option>
</select>

<input id="phone" type="text" inputmode="tel" autocomplete="tel">
<input id="phone_raw" type="hidden" name="phone">

<script type="module">
  import { attachPhoneInput } from './phone.ts'

  const select = document.getElementById('country')
  const input  = document.getElementById('phone')
  const hidden = document.getElementById('phone_raw')

  select.addEventListener('change', () => {
    input.value = ''
    hidden.value = ''
  })
  attachPhoneInput(input, hidden, () => select.value)
</script>
```

The form submits `phone` (digits with a possible leading `+` for international numbers). The listener reads the current country on each input, so changing the selector does not accumulate duplicate event handlers.

---

## 2. Credit card with brand detection

Use `creditCardType` to detect the brand and `creditCard` to format the number. The brand name goes into a hidden field so the server can pick the right processor without re-running detection.

```ts
import { format } from '@samline/formatter'

export function attachCardInput(
  number: HTMLInputElement,
  brandHidden: HTMLInputElement,
  numberHidden: HTMLInputElement
) {
  number.addEventListener('input', () => {
    const typed = format(number.value, 'creditCardType')
    const full = format(number.value, 'creditCard')
    number.value       = full.formatted
    numberHidden.value = full.raw
    brandHidden.value  = typed.formatted // 'visa', 'mastercard', 'amex', ...
  })
}
```

```html
<input id="card_number" type="text" inputmode="numeric" autocomplete="cc-number">
<input id="card_brand" type="hidden" name="card_brand">
<input id="card_number_raw" type="hidden" name="card_number">
<p id="card_brand_label">Brand: —</p>

<script type="module">
  import { attachCardInput } from './card.ts'

  const number      = document.getElementById('card_number')
  const brandHidden = document.getElementById('card_brand')
  const numHidden   = document.getElementById('card_number_raw')

  attachCardInput(number, brandHidden, numHidden)
  number.addEventListener('input', () => {
    document.getElementById('card_brand_label').textContent =
      `Brand: ${brandHidden.value || '—'}`
  })
</script>
```

`format()` is pure, so calling it twice on the same value is cheap. Detecting the brand and formatting the number in a single pass keeps both responsibilities out of your listener body.

---

## 3. Currency input with prefix

Drive an input that displays `$1,234.50` while the form submits the digits-only `1234.50`.

```ts
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

---

## 4. Date input that accepts both raw and formatted

The `date` format accepts raw `Y-m-d` and emits the display pattern. Pair it with `<input type="date">` (which always emits raw) and render the human-friendly display via a sibling element — useful when the form should send `2026-05-12` but show `12/05/2026` in the UI.

```ts
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

```html
<input id="birthday" type="date" name="birthday">
<span id="birthday_display">—</span>

<script type="module">
  import { attachDateInput } from './date.ts'

  const native  = document.getElementById('birthday')
  const display = document.getElementById('birthday_display')
  // Native <input type="date"> is itself the hidden mirror — no extra input needed.
  attachDateInput(native, display, native)
</script>
```

The `'auto'` default for `interpretInputAs` detects the eight-digit server-prefilled case (`19901212` → `12/12/1990`) without you having to thread any preset values through your own code.

---

## 5. Serial number with auto-prepended prefix

A common pattern is an identifier with a fixed prefix the user shouldn't have to retype (e.g. `EASY123456789`). Drive the visible input with `prefix` + `blocks`, and ship the canonical value (with prefix) to the backend via `rawPrefix: true`.

```ts
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

---

## 6. Prefix the user must type themselves

When the prefix lives in the data the user is transcribing (not in your database), let them drive the prefix character-by-character with `prefixMode: 'passthrough'`. Each matching character sticks; the field never snaps back to the literal prefix.

```ts
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

---

## 7. Independent head and tail decorations

`prefix` and `suffix` are independent. Combine them for codes like `PRE-12345-END` where both ends carry meaning.

```ts
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

---

## 8. Currency-style suffix with `suffix`

For prices like `100 USD`, use the dedicated `suffix` option (instead of the legacy `prefix + tailPrefix` hack). `rawSuffix: true` ships the canonical `100 USD` to the backend when needed.

```ts
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

---

## 9. Validating with `regex`

Pair `format()` with the bundled `regex` object so the error message you show the user matches what the validator checks.

```ts
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

---

## 10. React — single controlled `<input>`

Wire `format()` to React's `onChange` and treat the visible value as the only source of truth. The hidden mirror goes into the same form via a `<input type="hidden">` you render alongside.

```tsx
import { useState } from 'react'
import { format } from '@samline/formatter'

export function PhoneField({
  name,
  country = 'MX'
}: { name: string; country?: string }) {
  const [display, setDisplay] = useState('')
  const [raw, setRaw] = useState('')

  return (
    <>
      <input
        type="text"
        inputMode="tel"
        autoComplete="tel"
        value={display}
        onChange={(e) => {
          const { formatted, raw } = format(e.target.value, 'phone', { country })
          setDisplay(formatted)
          setRaw(raw)
        }}
      />
      <input type="hidden" name={name} value={raw} readOnly />
    </>
  )
}
```

This pattern keeps the visible input controlled and the hidden mirror updated in lockstep — the form submission always carries the canonical value.

---

## 11. Vue 3 — v-model adapter

Wrap `format()` so each typed character updates the visible value while a computed exposes the raw to the parent.

```ts
import { computed, ref } from 'vue'
import { format } from '@samline/formatter'

export function useFormatted(initial = '', formatType = 'general', options = {}) {
  const display = ref(initial)
  const raw = computed(() => format(display.value, formatType as any, options).raw)

  function onInput(event: Event) {
    const target = event.target as HTMLInputElement
    display.value = format(target.value, formatType as any, options).formatted
  }

  return { display, raw, onInput }
}
```

```vue
<template>
  <input :value="display" @input="onInput" inputmode="numeric" />
  <input type="hidden" name="phone" :value="raw" />
</template>

<script setup>
import { useFormatted } from './use-formatted'

const { display, raw, onInput } = useFormatted('', 'phone', { country: 'MX' })
</script>
```

The `raw` ref is reactive, so anywhere downstream you read it (a watcher, another computed, a template binding) sees the latest value.

---

## 12. Svelte — `bind:value` adapter

```svelte
<script>
  import { format } from '@samline/formatter'

  let display = ''

  $: raw = format(display, 'phone', { country: 'MX' }).raw

  function onInput(event) {
    display = format(event.target.value, 'phone', { country: 'MX' }).formatted
  }
</script>

<input
  type="text"
  inputmode="tel"
  autocomplete="tel"
  value={display}
  on:input={onInput}
/>
<input type="hidden" name="phone" value={raw} />
```

`raw` is a reactive `$:` block, so the hidden mirror always carries the canonical value whenever `display` changes.

---

## 13. Vanilla `<form>` posted natively

When the form is rendered server-side (Blade, ERB, classic Rails) and you only need the formatting before submission, no JS framework is required.

```html
<form id="checkout" action="/checkout" method="post">
  @csrf
  <input id="phone"    type="text" inputmode="tel" autocomplete="tel">
  <input id="phone_raw" type="hidden" name="phone">
  <input id="amount"   type="text" inputmode="decimal">
  <input id="amount_raw" type="hidden" name="amount">
  <button type="submit">Checkout</button>
</form>

<script src="https://unpkg.com/@samline/formatter@2.0.3/dist/browser/global.global.js"></script>
<script>
  const F = window.Formatter

  const phone  = document.getElementById('phone')
  const phoneRaw  = document.getElementById('phone_raw')
  phone.addEventListener('input', () => {
    const { formatted, raw } = F.format(phone.value, 'phone', { country: 'MX' })
    phone.value     = formatted
    phoneRaw.value  = raw
  })

  const amount = document.getElementById('amount')
  const amountRaw = document.getElementById('amount_raw')
  amount.addEventListener('input', () => {
    const { formatted, raw } = F.format(amount.value, 'numeral', { prefix: '$' })
    amount.value    = formatted
    amountRaw.value = raw
  })
</script>
```

The browser submits `phone` and `amount` as the canonical values; the visible fields stay formatted for the user.

---

## 14. Server-side formatting (queues, webhooks, email rendering)

`format()` is pure, so you can call it from a Node job, a webhook handler, or an email renderer without bundling for a browser.

```ts
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

---

## 15. Pairing with `@samline/forms`

When you use `@samline/forms` for validation and submit handling, drive `format()` from the controller's `watch`/`subscribe` so the visible always reflects the canonical value the backend will receive.

```ts
import { form, browser, regex } from '@samline/forms'
import { format } from '@samline/formatter'

const checkout = form('checkout-form', {
  validators: { phone: { required: true, pattern: regex.phone.pattern } }
})

const phone = document.querySelector<HTMLInputElement>('input[name="phone"]')!
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

`@samline/forms` ships a `format()` / `formatAll()` method on its controller that wraps this plumbing (renames the visible to `<field>_displayed`, creates the hidden, and respects `auto`/`display` interpretation per source). See the [forms guide on formatting](https://github.com/samline/forms/blob/main/docs/api/format.md) for the full mirror lifecycle.

---

## 16. Form submission payload

Every formatted field follows the same convention: the visible `<input>` is what the user sees, the hidden `<input>` is what the form submits. When you want both names in the payload (rare — usually only the raw matters), use the controller's `getData()` or build the FormData from the live form:

```ts
const formData = new FormData(formElement)
// 'phone' = '5512345678'
// 'phone_displayed' = '55 1234 5678'
```

The backend should read `phone`; `phone_displayed` is only there for cases where the consuming service needs to echo the formatted value back to the user (transactional emails, receipts, summaries).

---

## Next steps

- Need a deep dive on options? See [docs/options.md](options.md).
- Looking up the exact signature of a function? See [docs/api/format.md](api/format.md) or [docs/api/regex.md](api/regex.md).
- Working with the type system? See [docs/typescript.md](typescript.md).
- Styling and accessibility? See [docs/styling-and-ux.md](styling-and-ux.md).
- Setting up the browser global? See [docs/browser.md](browser.md).
