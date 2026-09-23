---
title: Styling and UX
description: Style formatted inputs and handle accessibility, native attributes, validation states, and caret behavior.
sidebar:
  order: 3
---

`@samline/formatter` does not ship CSS, inject classes, or mutate attributes. It returns strings; your application owns the markup, styling, validation state, and accessibility.

## Recommended field structure

Use one visible input for `formatted` and one hidden input for `raw`:

```html
<label class="field" for="phone_display">
  <span>Phone</span>
  <input
    id="phone_display"
    type="tel"
    inputmode="tel"
    autocomplete="tel"
    aria-describedby="phone_help phone_error"
  >
  <small id="phone_help">Include your area code.</small>
  <small id="phone_error" role="alert" hidden></small>
</label>
<input id="phone" type="hidden" name="phone">
```

Only the hidden input has the submitted `name`. This prevents the display and canonical values from competing in `FormData`.

```ts
import { format, regex } from '@samline/formatter'

const display = document.querySelector<HTMLInputElement>('#phone_display')!
const raw = document.querySelector<HTMLInputElement>('#phone')!
const error = document.querySelector<HTMLElement>('#phone_error')!

display.addEventListener('input', () => {
  const result = format(display.value, 'phone', { country: 'MX' })
  display.value = result.formatted
  raw.value = result.raw

  const valid = result.raw === '' || regex.phone.pattern.test(result.raw)
  display.setAttribute('aria-invalid', String(!valid))
  error.hidden = valid
  error.textContent = valid ? '' : regex.phone.errorMessage
})
```

## CSS states

Derive presentation from native attributes your application controls:

```css
.field {
  display: grid;
  gap: 0.375rem;
}

.field input {
  border: 1px solid var(--field-border, #8b8b8b);
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
}

.field input:focus-visible {
  outline: 3px solid var(--field-focus, #7556d4);
  outline-offset: 2px;
}

.field input[aria-invalid="true"] {
  border-color: var(--field-error, #b42318);
}

.field:has(input[aria-invalid="true"]) [role="alert"] {
  color: var(--field-error, #b42318);
}
```

Prefer `aria-invalid`, `:focus-visible`, `:disabled`, and native validity states over formatter-specific classes. They interoperate with `@samline/forms` and other validation layers.

## Input attributes by format

| Format | Recommended `type` | `inputmode` | `autocomplete` | Notes |
| --- | --- | --- | --- | --- |
| `phone` | `tel` | `tel` | `tel` | Let the country option control grouping. |
| `numeral` | `text` | `decimal` | contextual | `type="number"` rejects formatted separators and prefixes. |
| `date` | `text` or `date` | `numeric` | `bday` when appropriate | Native date inputs expose raw ISO values. |
| `time` | `text` or `time` | `numeric` | contextual | Native time inputs already use canonical values. |
| `creditCard` | `text` | `numeric` | `cc-number` | Keep raw card data out of logs and analytics. |
| `general` | `text` | contextual | contextual | Match attributes to the underlying value. |

## Caret behavior

Assigning `input.value = formatted` can move the caret to the end when a delimiter is inserted or the user edits in the middle. Formatter deliberately does not manage selection because caret APIs belong to the DOM or framework layer.

For mid-string editing, capture `selectionStart` before formatting and restore an adjusted position with `setSelectionRange()` after updating the value, or use a framework input-mask adapter.

## Accessibility checklist

- Associate a visible `<label>` with the visible input.
- Reference validation text with `aria-describedby`.
- Set `aria-invalid="true"` only after validation fails.
- Do not focus or expose the hidden raw mirror.
- Do not use placeholder text as the only label or instruction.
- Keep a stable live region for errors instead of recreating it per keystroke.
- Preserve the typed value when validation fails; formatting and validation are separate concerns.

## Common pitfalls

- **Using `type="number"` for formatted numerals.** Use `type="text"` with `inputmode="decimal"`.
- **Submitting both inputs under the same name.** Name only the canonical hidden input unless the backend requires both.
- **Styling the hidden mirror.** Error, focus, and filled states belong on the visible input.
- **Treating formatting as validation.** Pair the result with [`regex`](/formatter/reference/regex/) or your validation library.
- **Rebinding listeners when options change.** Keep one listener and read current options from state, a ref, or a getter.

## Related

- [Getting started](/formatter/getting-started/) — the formatted/raw contract.
- [Framework guide](/formatter/guides/formatting-with-frameworks/) — React, Vue, Svelte, and vanilla ownership patterns.
- [Recipes](/formatter/reference/recipes/) — end-to-end integrations.
- [Configuration](/formatter/reference/configuration/) — delimiters, affixes, and format-specific options.
