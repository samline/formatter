# Changelog

All notable changes to `@samline/formatter` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-16

### Changed

- **`format()` now defaults to `interpretInputAs: 'display'` for `'date'` and `'time'` inputs.** Up to 1.1.2, `format()` always pre-processed the input as raw-formatted: it segmented the digits by `dateRawPattern` / `timeRawPattern` and re-emitted them in `datePattern` / `timePattern` order. That works for round-trip callers (a `setValue` from a backend that holds the canonical form), but it scrambles the visible digits whenever a real user types into a field whose display order differs from the raw order — typing `15091989` into a `d/m/Y` display with a `Ymd` raw produced visible `19/09/0805` and hidden `08050919` (the underlying EasyTrip bug report). The default now matches the realistic case — `format()` is called from an `input` event listener with the visible value, which is in display order — and the legacy round-trip interpretation is preserved as a strict opt-in: `interpretInputAs: 'raw'`. The fix is applied symmetrically to the `date` and `time` branches of `getValueForFormatting`.

  ```ts
  // Default (v1.2.0+) — live keystrokes in display order
  format('15091989', 'date', {
    datePattern: ['d', 'm', 'Y'],
    delimiter: '/',
    dateRawPattern: ['Y', 'm', 'd'],
    dateRawPatternDelimiter: ''
  })
  // => { formatted: '15/09/1989', raw: '19890915', type: 'date' }

  // Opt-in to the legacy round-trip semantics
  format('19890915', 'date', {
    datePattern: ['d', 'm', 'Y'],
    delimiter: '/',
    dateRawPattern: ['Y', 'm', 'd'],
    dateRawPatternDelimiter: '',
    interpretInputAs: 'raw'
  })
  // => { formatted: '15/09/1989', raw: '19890915', type: 'date' }
  ```

- **`getTimeRawValue` now derives its delimiter from `options.delimiter`** when `timeRawPatternDelimiter` is not set, matching the 1.1.1 fix that was applied to `getDateRawValue` but never ported to the time branch. A single `{ timePattern, timeRawPattern, delimiter }` configuration now round-trips consistently without the consumer having to repeat the delimiter in the raw options. Explicit `timeRawPatternDelimiter` still wins over the display delimiter.

  ```ts
  // Before 1.2.0: raw delimiter ignored the display `delimiter: '-'`,
  // always used the default `:`. The display and the raw did not agree.
  format('143000', 'time', {
    timePattern: ['h', 'm', 's'],
    timeRawPattern: ['h', 'm'],
    delimiter: '-'
  })
  // => { formatted: '14-30-00', raw: '14-30', type: 'time' }
  ```

### Added

- **`interpretInputAs?: 'display' | 'raw'`** option on `FormatOptions`, applied to the `'date'` and `'time'` branches of `format()`. Default `'display'` (the realistic live-keystroke case). Set to `'raw'` to opt into the legacy pre-1.2.0 round-trip semantics where the input is segmented by `dateRawPattern` / `timeRawPattern` and re-emitted in `datePattern` / `timePattern` order. See the `### Changed` entry above for examples.

## [1.1.2] - 2026-07-14

### Fixed

- **`numericOnly` / `uppercase` / `lowercase` not applied to the `raw` mirror when `prefix` / `suffix` are configured and `rawPrefix` / `rawSuffix` are set.** Up to 1.1.1, the `formatted` value went through `cleave-zen.formatGeneral` (which honours `numericOnly` and the case transforms), but the body part of the `raw` mirror was built from the user's *typed* input verbatim. A user fat-fingering letters into a `numericOnly: true` field would see a clean display but ship a contaminated canonical identifier (e.g. `EASY1a2b3c4d5e6f7g8h9i`) to the backend. The fix derives the body part of the raw from `bodyFormatted` (with the display delimiter stripped) only when the caller has opted into a canonical raw via `rawPrefix: true` / `rawSuffix: true`; callers who keep the historical default (`rawPrefix: false` / `rawSuffix: false`) see no change. The defensive `numericOnly` strip is still applied so the canonical raw is digits-only when the caller asked for digits-only.

  ```ts
  // Repro from the upstream bug report — now fixed.
  format('1a2b3c4d5e6f7g8h9i', 'general', {
    blocks: [4, 5],
    delimiter: ' ',
    prefix: 'EASY',
    prefixMode: 'lock',
    rawPrefix: true,
    numericOnly: true
  })
  // => { formatted: 'EASY1234 56789', raw: 'EASY123456789', type: 'general' }
  ```

## [1.1.1] - 2026-07-14

### Added

- **`general` + `prefix` is now fully formatter-managed.** The formatter used
  to delegate `prefix` handling to `cleave-zen`'s `stripPrefix`, which
  discards any input that doesn't already start with the configured prefix
  and freezes the field at the literal prefix. We now manage the prefix on
  the formatter's side: `lock` mode (default) auto-prepends the configured
  prefix and lets the user type only the suffix; `passthrough` mode
  reflects whatever the user has typed of the prefix instead. Both modes
  let input flow through to the suffix on every keystroke instead of
  snapping the field to the prefix.
- **`rawPrefix: boolean`** option for `general` formats. When `true`, the
  `raw` mirror includes the configured prefix (so a `prefix: 'EASY'` field
  with `rawPrefix: true` mirrors `EASY123456789`, ready to ship to a
  backend that expects the canonical identifier). Defaults to `false` so
  the historical "digits only" raw mirror is preserved unless the caller
  opts in.
- **`suffix`, `suffixMode` and `rawSuffix` for `general` formats.**
  Symmetric with `prefix` / `prefixMode` / `rawPrefix`: the formatter now
  manages a dedicated tail decoration independent of the head. `suffix`
  strings can be wholly different from `prefix` (e.g.
  `prefix: 'PRE-'`, `suffix: '-END'` for a `PRE-12345-END` field).
  `suffixMode: 'lock'` auto-appends the configured suffix (default);
  `suffixMode: 'passthrough'` lets the user type it character-by-character.
  `rawSuffix: true` adds the suffix to the `raw` mirror, independent of
  `rawPrefix`. Backwards compatible: the historical
  `prefix + tailPrefix: true` shape continues to work; `suffix` takes
  precedence when both are provided.

### Fixed

- **`format('date')` round-trip self-consistency.** When callers customise
  `datePattern` (or its `delimiter`) without also setting `dateRawPattern`
  and `dateRawPatternDelimiter`, the formatted display and the raw mirror no
  longer diverge silently. Both now derive from the display pattern /
  delimiter when the raw options are absent, so a single configuration such
  as `{ datePattern: ['d', 'm', 'Y'], delimiter: '/' }` round-trips
  `15/09/1989` ↔ `15/09/1989` end-to-end. Callers who need the historical
  asymmetric `Y-m-d` raw output can still opt in by passing
  `dateRawPattern` and `dateRawPatternDelimiter` explicitly.

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