# TypeScript

The package exposes a small, fully-typed public surface. Everything you need
to write strictly-typed form pipelines is re-exported from the package root.

## `FormatType`

Union of the seven supported format types.

```ts
import type { FormatType } from '@samline/formatter'

const type: FormatType = 'phone'  // ✓
// const wrong: FormatType = 'foo'  // ✗ TS error
```

## `FormatOptions`

Per-format options. See [options.md](./options.md) for the full field reference.
Internally it's the intersection of cleave-zen's per-type option interfaces,
so you can pass any field that applies to the format type you choose.

```ts
import type { FormatOptions } from '@samline/formatter'

const opts: FormatOptions = {
  blocks: [4, 4, 4, 4],
  delimiter: ' '
}
```

## `FormatterResult`

The shape returned by `format`.

```ts
import type { FormatterResult } from '@samline/formatter'

const result: FormatterResult = format('5512345678', 'phone')
result.formatted // string
result.raw       // string
result.type      // FormatType
```

## `FORMAT_TYPES`

A `readonly` tuple of every supported type. Useful for iterating, building
pickers, or type-driven UIs.

```ts
import { FORMAT_TYPES } from '@samline/formatter'

FORMAT_TYPES
// => ['general', 'phone', 'numeral', 'date', 'time', 'creditCard', 'creditCardType']
```

## `isFormatType`

A type-guard for narrowing untrusted strings to `FormatType`.

```ts
import { isFormatType } from '@samline/formatter'

function safeFormat(value: string, formatType: string) {
  if (!isFormatType(formatType)) {
    throw new Error(`Unsupported format type: ${formatType}`)
  }
  return format(value, formatType)
}
```

## `format`

The main entry point.

```ts
import { format } from '@samline/formatter'

const result = format(value, formatType, options?)
```

Throws `TypeError` when `formatType` is not one of the supported types. Returns
an empty `{ formatted: '', raw: '', type: formatType }` for `null`, `undefined`,
and `''` inputs.

## `regex`

A pre-built object of validation patterns. Each entry pairs a `RegExp` with a
ready-to-use `errorMessage`.

```ts
import { regex } from '@samline/formatter'

regex.email.pattern.test('foo@bar.com') // true
regex.email.errorMessage               // 'Please enter a valid email address.'
```

## Advanced: helpers

`getRawValue`, `getDateValueFromRaw`, `getTimeValueFromRaw`, `formatPhone`, and
`stripPrefixAndSuffix` are also exported for advanced consumers that need the
building blocks. Treat them as an internal API — they are exported because they
are useful, but the public contract is `format`.

```ts
import {
  formatPhone,
  getRawValue,
  stripPrefixAndSuffix
} from '@samline/formatter'

formatPhone('5512345678', 'MX', '-')  // '55-1234-5678'
getRawValue('1,234.50', 'numeral')    // '1234.50'
stripPrefixAndSuffix('$100', { prefix: '$' })  // '100'
```