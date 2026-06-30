# Changelog

All notable changes to `@samline/formatter` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-29

### Added

- **Expanded regex catalog** with parametric and callable entries:
  - `regex.digits(n)` / `regex.digits({ length })` / `regex.digits({ min, max })` — variable-digit count.
  - `regex.phone({ length })` — custom phone length (default 10 digits).
  - `regex.creditCard({ min, max })` — custom card-number range (default 15–16).
  - `regex.url({ protocol })` — restrict URL schemes (`http`, `https`, `ftp`).
  - `regex.password({ min, max, uppercase, lowercase, numbers, special })` — composable password rules.
- **New `regex.custom()`** helper for user-defined patterns. Accepts either positional (`pattern, errorMessage?`) or object (`{ pattern, errorMessage }`) form.
- **New built-in patterns**: `slug`, `username`, `date`, `time24`, `ipv4`, `ipv6`, `macAddress`, `hexColor`, `hashtag`, `mention`, `uuid`, `base64`, `semver`, `postalCode`.
- **Improved error messages** across the catalog (e.g. card numbers now specify the expected digit range, expiration dates accept both `MM/YY` and `MM/YYYY`, etc.).

### Changed

- `regex.phone`, `regex.creditCard`, and `regex.url` are now also **callable functions**. The static `.pattern` is still attached, so both forms coexist and nothing that worked before stops working.
- `RegexKey` is exported as `keyof typeof regex` to drive type-safe UIs and iteration.

### Documentation

- New "Backward compatibility", "Usage modes", and "Pattern reference" sections in `docs/regex.md`.
- Reference table reorganized into thematic groups (Phone & Identity, Numbers & Cards, Text, Dates & Times, Web & Network, Social, Security, Encoding & Versions, Utilities).

## [1.0.1] - 2026-06-29

### Changed

- Documentation refresh: added TypeScript support notes and aligned the docs site with the README.
- Homepage URL updated in `package.json`.

## [1.0.0] - 2026-06-29

### Added

- Initial public release of `@samline/formatter`.
- `format(value, formatType, options?)` core function returning `{ formatted, raw, type }`.
- Supported format types: `general`, `phone`, `numeral`, `date`, `time`, `creditCard`, `creditCardType`.
- Three entrypoints: `@samline/formatter`, `@samline/formatter/vanilla`, `@samline/formatter/browser` (IIFE).
- Pre-built validation regex catalog with paired error messages.
- Advanced helpers: `formatPhone`, `getRawValue`, `getDateValueFromRaw`, `getTimeValueFromRaw`, `stripPrefixAndSuffix`.