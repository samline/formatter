# Styling and UX

`@samline/formatter` does not ship CSS, inject classes, or mutate attributes. It returns strings; your application owns the input markup, styling, validation state, and accessibility. This separation keeps the package usable in native forms and every UI framework.

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

Only the hidden input has the submitted `name`. This prevents the display value and canonical value from competing in `FormData`.

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

Formatter does not choose class names. Derive presentation from native attributes your application controls:

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

Prefer `aria-invalid`, `:focus-visible`, `:disabled`, and native validity states over formatter-specific classes. They keep styling interoperable with `@samline/forms` and other validation layers.

## Input attributes by format

| Format | Recommended `type` | `inputmode` | `autocomplete` | Notes |
| --- | --- | --- | --- | --- |
| `phone` | `tel` | `tel` | `tel` | Let the country option control grouping, not the HTML type. |
| `numeral` | `text` | `decimal` | contextual | `type="number"` rejects formatted separators and prefixes. |
| `date` | `text` or `date` | `numeric` | `bday` when appropriate | Native `date` inputs expose raw ISO values; render a separate display label if needed. |
| `time` | `text` or `time` | `numeric` | contextual | Native `time` inputs already use canonical values. |
| `creditCard` | `text` | `numeric` | `cc-number` | Keep the raw card value out of logs and analytics. |
| `general` | `text` | contextual | contextual | Choose semantic attributes for the underlying value. |

## Caret behavior

Assigning `input.value = formatted` can move the caret to the end, especially when a delimiter is inserted or text is edited in the middle. Formatter deliberately does not manage selection because caret APIs belong to the DOM and framework layer.

For append-only fields this is usually acceptable. For mid-string editing, capture `selectionStart` before formatting and restore an adjusted position with `setSelectionRange()` after the value update, or use your framework's input-mask adapter.

## Accessibility checklist

- Keep a visible `<label>` associated with the visible input.
- Put validation text in an element referenced by `aria-describedby`.
- Set `aria-invalid="true"` only when validation has actually failed.
- Do not focus or expose the hidden raw mirror.
- Do not use placeholder text as the only label or format instruction.
- Announce errors with an existing live region instead of recreating it on every keystroke.
- Preserve the user's typed value when validation fails; formatting and validation are separate concerns.

## Common pitfalls

- **Using `type="number"` for formatted numerals.** It does not accept commas, spaces, or currency decorations. Use `type="text"` with `inputmode="decimal"`.
- **Submitting both inputs under the same name.** Name only the canonical hidden input unless your backend explicitly expects both values.
- **Styling the hidden mirror.** Error, focus, and filled states belong on the visible input.
- **Treating formatting as validation.** A well-formatted value can still be invalid. Pair the result with `regex` or your validation library.
- **Rebinding listeners when options change.** Keep one listener and read current options from state, a ref, or a getter.

## Related

- [Getting started](getting-started.md) — the formatted/raw contract.
- [Recipes](recipes.md) — framework and form integrations.
- [Regex reference](api/regex.md) — validation patterns and messages.
- [Options](options.md) — delimiters, prefixes, suffixes, and format-specific configuration.
