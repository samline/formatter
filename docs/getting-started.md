# Getting Started

## What `@samline/formatter` solves

It turns a string the user just typed into **two strings at once**:

- `formatted` — presentable, with delimiters, prefix, etc. What goes in the visible `<input>`.
- `raw` — canonical, backend-ready. Digits only, no separators, predictable order. What goes in a hidden input or in your request body.

This split removes a whole class of bugs that come from re-parsing formatted input server-side, and keeps the visible field in sync with the value that the API will actually receive.

## Observable contract

`format(value, formatType, options?)` is a **pure** function:

- Same inputs → same outputs (deterministic).
- No DOM reads, no DOM writes, no globals, no network, no `Date.now()`.
- No state — every call is independent.

It returns:

```ts
interface FormatterResult {
  formatted: string  // display value
  raw: string        // backend value
  type: FormatType   // echo of the requested format type
}
```

## Lifecycle

There is no lifecycle. `format` is stateless. Call it whenever your input's value changes (on every `input` event, on every keystroke after debouncing, on form submit, etc.) and bind the result to your UI however your framework prefers:

- React: use the `onChange` handler to call `format`, then `setState`.
- Vue: bind an event handler that calls `format` and assigns to a ref.
- Vanilla: add an `input` listener that calls `format` and writes `result.formatted` back into the input.
- Server-side: call `format` directly on strings you receive from a webhook, queue, etc.

## Side effects

None. `format` does not:

- Mutate `value` or any argument.
- Read or write the DOM.
- Read or write any global.
- Touch `Date.now()` or `Math.random()`.

If you need the visible value to be re-rendered, you (the caller) do that with the framework of your choice. The package only computes the strings.

## A minimal end-to-end example

```ts
import { format } from '@samline/formatter'

// 1. Wire an input
const input = document.querySelector<HTMLInputElement>('#phone')!
const hidden = document.querySelector<HTMLInputElement>('#phone_raw')!

// 2. On every keystroke, format and mirror to the hidden field
input.addEventListener('input', () => {
  const { formatted, raw } = format(input.value, 'phone')
  input.value = formatted  // visible
  hidden.value = raw       // submitted with the form
})
```

That's it. The visible field shows `'55 1234 5678'`; the hidden field sends `'5512345678'`. Same pattern works for every other `formatType`.