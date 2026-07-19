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

## Common gotcha — `'date'` / `'time'` input interpretation

The `format()` function is called on every keystroke, and the value it receives is whatever the user just typed into the visible field — i.e. **the value is in display order**, not in raw order. This matches how every realistic input listener works (you bind `format()` to an `input` event and the event's `target.value` is the visible string).

As of **v2.0.0**, the default `interpretInputAs` is `'auto'` for `'date'` and `'time'` types. The formatter inspects the input: if it has no delimiter and its digit length matches the raw pattern (e.g. 8 digits for a `['Y','m','d']` raw), it is treated as raw — so a server-pre-filled value like `"19901212"` is correctly converted to the display form `"12/12/1990"`. Otherwise (a value with a delimiter, or a partial value) it is treated as display — so user keystrokes pass through and `cleave-zen` inserts the missing separators as it always did. The strict v1.2.0 display interpretation is still available via `interpretInputAs: 'display'`, and the legacy pre-1.2.0 round-trip rearrangement is still available via `interpretInputAs: 'raw'`. See [`FormatOptions.interpretInputAs`](./options.md#date) for the full contract.

```ts
// ✅ Default (v2.0.0+): auto-detect raw vs display by the input shape
input.addEventListener('input', () => {
  const { formatted, raw } = format(input.value, 'date', {
    datePattern: ['d', 'm', 'Y'],
    delimiter: '/',
    dateRawPattern: ['Y', 'm', 'd'],
    dateRawPatternDelimiter: ''
  })
  // Typing `15/09/1989` (display) → visible `15/09/1989`, raw `19890915`
  // Pasting `19890915` (raw)     → visible `15/09/1989`, raw `19890915`
})

// ✅ Strict v1.2.0 display interpretation (opt-in)
const result = format('15091989', 'date', {
  datePattern: ['d', 'm', 'Y'],
  delimiter: '/',
  dateRawPattern: ['Y', 'm', 'd'],
  dateRawPatternDelimiter: '',
  interpretInputAs: 'display'
})
// => { formatted: '15/09/1989', raw: '19890915', type: 'date' }
```

> **Migration from v1.2.0 to v2.0.0:** the default behaviour changes for `'date'` / `'time'` inputs that reach `format()` with no delimiter and a digit count equal to the raw pattern length. Pre-2.0 this was treated as display; from 2.0 onwards it is treated as raw (the easytrip / Blade `old()` case). If you were relying on the v1.2.0 strict display interpretation at a call site that now collides with the auto heuristic, pass `interpretInputAs: 'display'` explicitly. Conversely, the pre-1.2.0 scramble on live keystrokes is no longer a concern (the auto heuristic routes partial-typed values through display, so the digits are never re-segmented before `cleave-zen` formats them).
>
> **Pre-1.2.0 behaviour:** the default was equivalent to `interpretInputAs: 'raw'`. If you upgrade through the entire 1.x → 2.0 series and find that `'date'` / `'time'` fields look scrambled, the most likely cause is a consumer passing a raw-formatted string to `format()` from somewhere other than the input event listener (e.g. a `setValue` from a backend that doesn't ship the canonical raw). Add `interpretInputAs: 'raw'` to those call sites, or use a dedicated `setValue` / `prefill` helper that handles the round-trip correctly.