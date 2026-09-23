# Getting Started

This page explains what `@samline/formatter` solves, the contract each public function honours, and the recommended wiring patterns. Use it as a mental model before diving into the per-feature reference under [`docs/api/`](api/index.md) and the end-to-end patterns in [`docs/recipes.md`](recipes.md).

> Latest version is `2.0.2` — see [Releases](https://github.com/samline/formatter/releases) for the changelog.

---

## What `@samline/formatter` solves

It turns a string the user just typed into **two strings at once**:

- `formatted` — presentable, with delimiters, prefix, etc. What goes in the visible `<input>`.
- `raw` — canonical, backend-ready. Digits only, no separators, predictable order. What goes in a hidden input or in your request body.

This split removes a whole class of bugs that come from re-parsing formatted input server-side, and keeps the visible field in sync with the value that the API will actually receive.

---

## When to use this variant

Use the main `@samline/formatter` entrypoint for bundlers and Node code. The package also provides `@samline/formatter/vanilla` as an alias entrypoint with the same surface, and `@samline/formatter/browser` as a pre-bundled IIFE that registers `window.Formatter`. See [docs/entrypoints.md](entrypoints.md) for the full distribution matrix.

If you want a `<script>`-only setup without a bundler, see [docs/browser.md](browser.md).

---

## Observable contract

`format(value, formatType, options?)` is a **pure** function:

- Same inputs → same outputs (deterministic).
- No DOM reads, no DOM writes, no globals, no network, no `Date.now()`.
- No state — every call is independent.
- Accepts `unknown`; throws `TypeError` for an unsupported `formatType`; returns an empty `{ formatted: '', raw: '', type: formatType }` for `null`, `undefined`, and `''` inputs.

It returns:

```ts
interface FormatterResult {
  readonly formatted: string  // display value
  readonly raw: string        // backend value
  readonly type: FormatType   // echo of the requested format type
}
```

The `regex` export complements the formatter with paired `{ pattern, errorMessage }` entries for validation. It is also pure — calling it never produces side effects. See [docs/api/regex.md](api/regex.md).

---

## Lifecycle

There is no lifecycle. `format` is stateless. Call it whenever your input's value changes (on every `input` event, on every keystroke after debouncing, on form submit, etc.) and bind the result to your UI however your framework prefers:

- React: bind an `onChange` handler that calls `format` and `setState`s the visible string.
- Vue: bind an event handler that calls `format` and writes back to a ref.
- Svelte: bind an `on:input` handler that assigns back to a `let` binding.
- Vanilla: add an `input` listener that calls `format` and writes `result.formatted` back into the input.
- Server-side: call `format` directly on strings you receive from a webhook, queue, or email renderer.

The hidden mirror is your framework's job — render a sibling `<input type="hidden">` (or set a ref) and assign `result.raw` to it inside the same handler.

---

## Side effects per function

Use this as a quick lookup when you need to know what a function will touch.

| Function | DOM mutation | Network | Reads globals | Reads time | Notes |
| --- | --- | --- | --- | --- | --- |
| [`format`](api/format.md) | no | no | no | no | Pure string transformer. Safe to call on every keystroke. |
| [`isFormatType`](api/format.md#isformattype) | no | no | no | no | Type-guard. No allocation beyond the comparison. |
| [`FORMAT_TYPES`](api/format.md#format_types) | n/a | n/a | n/a | n/a | A `readonly` tuple; iteration is the only legitimate use. |
| [`regex.<key>.pattern`](api/regex.md) | no | no | no | no | A compiled `RegExp`. `regex.<key>` is also callable for parametric variants. |
| [`regex.<key>.errorMessage`](api/regex.md) | n/a | n/a | n/a | n/a | A short human-readable message paired with the pattern. |
| [`formatPhone`](api/format.md#formatphone) | no | no | no | no | Lower-level phone helper called by `format(..., 'phone')`. |
| [`getRawValue`](api/format.md#getrawvalue) | no | no | no | no | Lower-level raw value extractor. |
| [`getDateValueFromRaw`](api/format.md#getdatevaluefromraw) | no | no | no | no | Legacy round-trip helper for dates. |
| [`getTimeValueFromRaw`](api/format.md#gettimevaluefromraw) | no | no | no | no | Legacy round-trip helper for times. |
| [`looksLikeRawDateValue`](api/format.md#lookslikerawdatevalue) | no | no | no | no | Heuristic test for the v2.0.0 `auto` mode. |
| [`looksLikeRawTimeValue`](api/format.md#lookslikerawtimevalue) | no | no | no | no | Heuristic test for the v2.0.0 `auto` mode. |
| [`stripPrefixAndSuffix`](api/format.md#stripprefixandsuffix) | no | no | no | no | Strips the configured `prefix` and `suffix` from a string. |

> `format` and every helper it delegates to are referentially transparent — the same `(value, formatType, options)` triple always returns the same `FormatterResult`. This is what enables SSR re-rendering and testing without mocks.

---

## A minimal end-to-end example

```ts
import { format } from '@samline/formatter'

// 1. Wire an input
const input = document.querySelector<HTMLInputElement>('#phone')!
const hidden = document.querySelector<HTMLInputElement>('#phone_raw')!

// 2. On every keystroke, format and mirror to the hidden field
input.addEventListener('input', () => {
  const { formatted, raw } = format(input.value, 'phone')
  input.value = formatted   // visible
  hidden.value = raw         // submitted with the form
})
```

That's it. The visible field shows `'55 1234 5678'`; the hidden field sends `'5512345678'`. Same pattern works for every other `formatType`.

---

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
  // Receiving `19890915` (raw)   → visible `15/09/1989`, raw `19890915`
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

If this handler exclusively receives text from the visible field, prefer
`interpretInputAs: 'display'`. It removes the unavoidable ambiguity of pasting
exactly eight delimiter-less digits such as `12121990`, which could be either a
display-order date or a canonical raw date. Use the default `'auto'` for mixed
pipelines that also receive server-prefilled or programmatically assigned raw
values. `@samline/forms` makes this distinction automatically: visible input
events use `'display'`, while initial and canonical mirror values use `'auto'`.

> **Migration from v1.2.0 to v2.0.0:** the default behaviour changes for `'date'` / `'time'` inputs that reach `format()` with no delimiter and a digit count equal to the raw pattern length. Pre-2.0 this was treated as display; from 2.0 onwards it is treated as raw (the easytrip / Blade `old()` case). If you were relying on the v1.2.0 strict display interpretation at a call site that now collides with the auto heuristic, pass `interpretInputAs: 'display'` explicitly. Conversely, the pre-1.2.0 scramble on live keystrokes is no longer a concern (the auto heuristic routes partial-typed values through display, so the digits are never re-segmented before `cleave-zen` formats them).
>
> **Pre-1.2.0 behaviour:** the default was equivalent to `interpretInputAs: 'raw'`. If you upgrade through the entire 1.x → 2.0 series and find that `'date'` / `'time'` fields look scrambled, the most likely cause is a consumer passing a raw-formatted string to `format()` from somewhere other than the input event listener (e.g. a `setValue` from a backend that doesn't ship the canonical raw). Add `interpretInputAs: 'raw'` to those call sites, or use a dedicated `setValue` / `prefill` helper that handles the round-trip correctly.

---

## Recommended usage patterns

- Pair every visible `<input>` with a sibling `<input type="hidden">` whose value mirrors `result.raw`. The visible carries `result.formatted`; the form submission always carries the raw.
- Debounce only when profiling shows that your surrounding render or validation pipeline needs it; `format()` itself is synchronous and side-effect free.
- Pair `format()` with [`regex`](api/regex.md) so the validator and the user-visible error message always agree. `regex.<key>.errorMessage` is the same string your UI should show.
- Use `interpretInputAs: 'display'` if the formatter only sees user-typed input — removes the ambiguity of pasting exactly eight delimiter-less digits.
- Use the default `interpretInputAs: 'auto'` for mixed pipelines that also receive server-prefilled or programmatically assigned raw values (e.g. `@samline/forms` server re-renders).
- For phone numbers that change per country, read the current `<select>` value inside one stable input listener.
- For currency, combine `prefix` + `numeral` and keep `rawPrefix` off (canonical values are usually digits-only for prices).
- For serial numbers with a fixed prefix that the user shouldn't retype, use `prefix: 'EASY'` + `rawPrefix: true`. For serials where the prefix is part of the data the user is transcribing, use `prefixMode: 'passthrough'` instead.
- For dates, prefer `<input type="date">` (which always emits raw Y-m-d) and render the display pattern as a sibling element. The `'auto'` default handles the pre-filled case without extra ceremony.
- For credit cards, call `format(..., 'creditCardType')` and `format(..., 'creditCard')` on the same keystroke and use `creditCardType.formatted` as the hidden brand field.

---

## Next steps

- Need a full options reference? See [docs/options.md](options.md).
- Looking up the exact signature of a function? See [docs/api/format.md](api/format.md) or [docs/api/regex.md](api/regex.md).
- Working with the type system? See [docs/typescript.md](typescript.md).
- Browsing end-to-end patterns? See [docs/recipes.md](recipes.md).
- Want a `<script>`-only setup without a bundler? See [docs/browser.md](browser.md).
- Curious about entrypoints and module shapes? See [docs/entrypoints.md](entrypoints.md).
