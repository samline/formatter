---
title: Formatting with frameworks
description: Wire @samline/formatter into React, Vue, Svelte, vanilla, and server-side pipelines.
sidebar:
  order: 1
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

`@samline/formatter` is framework-agnostic by design. The visible input, the hidden mirror, and the error message are always wired through the same `input` listener; the framework owns the state.

This guide shows the recommended wiring for every common runtime. Each snippet is self-contained — drop it into a project and adapt it to your conventions.

## The pattern

The shape is always the same:

1. Two inputs in the DOM: the visible one the user types in, and a hidden mirror that carries the canonical raw value.
2. One `input` listener that calls `format()` and writes the result to both inputs.
3. Framework-owned state when you need it (controlled inputs, refs, etc.).

```ts
import { format } from '@samline/formatter'

input.addEventListener('input', () => {
  const { formatted, raw } = format(input.value, 'phone')
  input.value = formatted   // visible
  hidden.value = raw         // submitted with the form
})
```

That listener is the entire pattern. The rest of this page shows how each framework wraps it without losing the contract.

<Tabs syncKey="framework">
	<TabItem label="React">

		```tsx title="PhoneField.tsx"
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

		Both values live in React state, so the visible input and hidden mirror update in the same render without direct DOM mutation.

	</TabItem>
	<TabItem label="Vue 3">

		```ts title="use-formatted.ts"
		import { computed, ref } from 'vue'
		import { format } from '@samline/formatter'
		import type { FormatOptions, FormatType } from '@samline/formatter'

		export function useFormatted(
		  initial = '',
		  formatType: FormatType = 'general',
		  options: FormatOptions = {}
		) {
		  const display = ref(initial)
		  const raw = computed(() => format(display.value, formatType, options).raw)

		  function onInput(event: Event) {
		    const target = event.target as HTMLInputElement
		    display.value = format(target.value, formatType, options).formatted
		  }

		  return { display, raw, onInput }
		}
		```

		```vue title="PhoneField.vue"
		<template>
		  <input
		    :value="display"
		    @input="onInput"
		    inputmode="tel"
		    autocomplete="tel"
		  />
		  <input type="hidden" name="phone" :value="raw" />
		</template>

		<script setup>
		import { useFormatted } from './use-formatted'

		const { display, raw, onInput } = useFormatted('', 'phone', { country: 'MX' })
		</script>
		```

		`raw` is reactive — wherever you read it downstream (a watcher, a computed, a template binding) you always see the latest canonical value.

	</TabItem>
	<TabItem label="Svelte">

		```svelte title="PhoneField.svelte"
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

		Svelte's reactive `$:` block keeps the hidden mirror in lockstep with the visible field. Update `display` → `raw` recomputes → the `<input type="hidden">` re-renders.

	</TabItem>
	<TabItem label="Vanilla">

		```html title="index.html"
		<form id="checkout" action="/checkout" method="post">
		  <input id="phone"    type="text" inputmode="tel" autocomplete="tel">
		  <input id="phone_raw" type="hidden" name="phone">
		  <button type="submit">Checkout</button>
		</form>

		<script type="module">
		  import { format } from '@samline/formatter'

		  const phone    = document.getElementById('phone')
		  const phoneRaw = document.getElementById('phone_raw')

		  phone.addEventListener('input', () => {
		    const { formatted, raw } = format(phone.value, 'phone', { country: 'MX' })
		    phone.value    = formatted
		    phoneRaw.value = raw
		  })
		</script>
		```

		When the form posts natively (no `onSubmit` handler), the browser submits `phone` as the canonical raw while the visible field carries the formatted value.

	</TabItem>
	<TabItem label="Server-side">

		```ts title="format-server.ts"
		import { format } from '@samline/formatter'

		// Normalize a phone number coming from a CRM webhook
		const stored = format('+525512345678', 'phone', { country: 'MX' })
		// stored.formatted: '+52 55 1234 5678'
		// stored.raw:       '+525512345678'

		// Render an "amount due" string in a transactional email
		const invoice = format('123456', 'numeral', { prefix: '$', delimiter: ',' })
		// invoice.formatted: '$123,456'
		// invoice.raw:       '123456'
		```

		`format()` is pure — call it from a queue, a webhook handler, an email renderer, anywhere JavaScript runs. There is no client-side limit.

	</TabItem>
</Tabs>

## Pairing with `@samline/forms`

When you use `@samline/forms` for validation and submit handling, prefer the controller's own `format()` / `formatAll()` method. It wraps the same plumbing, renames the visible to `<field>_displayed`, creates the hidden mirror, and respects the `'auto'` / `'display'` interpretation per source.

See [the forms formatting guide](https://samline.github.io/forms/guides/formatting/) for the full mirror lifecycle and the `FieldFormatConfig` options.

## Pitfalls

- **Reading `e.target.value` twice.** Some frameworks expose the input event with a value already mutated by your handler. Capture `target.value` into a variable before the second read.
- **Re-running `format()` on the same raw.** The formatter is pure and cheap, but if you reach for it from a heavy render path, debounce the listener instead. The bottleneck is your framework's re-render, not the formatter.
- **Swapping `formatted` and `raw` in the hidden mirror.** The visible is `formatted`; the hidden is `raw`. Mixing them up ships the formatted value (`55 1234 5678`) to the backend, which then has to re-parse it.
- **Forgetting `country` on `phone`.** The default is `'MX'`. If your users are international, drive `country` off a `<select>`'s change event.
- **Pasting an eight-digit string into a date field.** The auto-detection heuristic routes that as raw by default. Force `interpretInputAs: 'display'` if your pipeline only sees user-typed input — see [`format(…, 'date')`](../reference/configuration/#date).

## Related

- [Configuration → Date](../reference/configuration/#date) — full `interpretInputAs` contract.
- [Configuration → Phone](../reference/configuration/#phone) — country and delimiter defaults.
- [Recipes → Phone with country selector](../recipes/#phone-with-country-selector)
- [Recipes → Pairing with `@samline/forms`](../recipes/#pairing-with-samlineforms)
