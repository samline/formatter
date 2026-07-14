---
title: TypeScript
description: TypeScript support in @samline/formatter.
sidebar:
  order: 4
---

@samline/formatter ships with first-class TypeScript support. All public APIs are fully typed and exported from the package entry point.

## Imports

```ts
import { format, regex } from '@samline/formatter'
import type { FormatType, FormatOptions, FormatterResult } from '@samline/formatter'
```

## Core types

### `FormatterResult`

Returned by every `format()` call.

```ts
interface FormatterResult {
  readonly formatted: string  // display value
  readonly raw: string        // backend value
  readonly type: FormatType   // format type echoed back
}
```

### `FormatType`

Union of the seven supported format types.

```ts
type FormatType =
  | 'general'
  | 'phone'
  | 'numeral'
  | 'date'
  | 'time'
  | 'creditCard'
  | 'creditCardType'
```

### `FormatOptions`

Per-type configuration bag. Pass a partial options object to `format()`.

```ts
type FormatOptions = Partial<
  FormatGeneralOptions &
  FormatNumeralOptions &
  FormatDateOptions &
  FormatTimeOptions &
  FormatCreditCardOptions
> & {
  country?: string
  dateRawPattern?: DatePatternType
  dateRawPatternDelimiter?: string
  timeRawPattern?: TimePatternType
  timeRawPatternDelimiter?: string
  /** @deprecated Prefer the dedicated `suffix` option. */
  tailPrefix?: boolean
  prefixMode?: 'lock' | 'passthrough'
  rawPrefix?: boolean
  suffix?: string
  suffixMode?: 'lock' | 'passthrough'
  rawSuffix?: boolean
}
```

## Type guards

Use `isFormatType` to validate input at runtime before calling `format`.

```ts
import { isFormatType } from '@samline/formatter'

if (isFormatType(value, 'phone')) {
  const result = format(value, 'phone')
  // result is FormatterResult, TypeScript knows the type
}
```

## Generic input handling

`format` accepts `unknown` as its value type. Cast or guard inputs as needed.

```ts
function handleInput(rawEvent: Event): FormatterResult | null {
  const target = rawEvent.target as HTMLInputElement
  if (!target.value) return null
  return format(target.value, 'phone', { country: 'MX' })
}
```
