# API Reference

This section documents every public symbol exported from `@samline/formatter`. The package is small on purpose — two main surfaces (`format()` and `regex`), plus a handful of advanced helpers. Start with `format` for the main entry point and `regex` for validation pairing.

## Pages

- [`format`](format.md) — the main entry point, plus the advanced helpers (`formatPhone`, `getRawValue`, `getDateValueFromRaw`, `getTimeValueFromRaw`, `looksLikeRawDateValue`, `looksLikeRawTimeValue`, `stripPrefixAndSuffix`).
- [`regex`](regex.md) — paired validation patterns with ready-to-use error messages, including the parametric variants (`digits`, `phone`, `creditCard`, `url`, `password`) and `custom`.

## Quick lookup

| Symbol | Page | Returns | Pure | Use when |
| --- | --- | --- | --- | --- |
| `format` | [format](./format.md) | [`FormatterResult`](./format.md#returns) | yes | You have a typed or canonical string and need both `formatted` and `raw`. |
| `isFormatType` | [format](./format.md) | `value is FormatType` | yes | You accept `formatType` from an untrusted source (URL, config, user input). |
| `FORMAT_TYPES` | [format](./format.md) | readonly tuple | yes | You iterate the supported types (settings UI, dynamic pickers). |
| `regex` | [regex](./regex.md) | `{ pattern, errorMessage }` map | yes | You pair `format()` with validation so the error message and the regex stay in sync. |
| `formatPhone` | [format](./format.md) | `string` | yes | Phone-only pipeline; bypasses the rest of the formatter. |
| `getRawValue` | [format](./format.md) | `string` | yes | You have a formatted value and need just the canonical raw. |
| `getDateValueFromRaw` | [format](./format.md) | `string` | yes | Legacy round-trip helper for dates. |
| `getTimeValueFromRaw` | [format](./format.md) | `string` | yes | Legacy round-trip helper for times. |
| `looksLikeRawDateValue` | [format](./format.md) | `boolean` | yes | Build a custom auto-detection pipeline. |
| `looksLikeRawTimeValue` | [format](./format.md) | `boolean` | yes | Build a custom auto-detection pipeline. |
| `stripPrefixAndSuffix` | [format](./format.md) | `string` | yes | Strip configured `prefix`, `suffix`, or legacy tail prefix from a `general` value. |
