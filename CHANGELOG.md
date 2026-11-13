# Changelog

All notable changes to `@samline/formatter` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.0] - 2026-11-13

Two new format types and a `case` option, built on
[`@samline/string`](https://github.com/samline/utils/tree/main/packages/string), which is bundled
into the build, so formatter still has `libphonenumber-js` as its only
runtime dependency (and only through the opt-in phone subpath).

### Added

- **`'text'` format type.** Free text with a casing mode and no mask: `case: 'upper' | 'lower' | 'title' | 'sentence' | 'capitalize'`, `smallWords` for title case (`['de', 'la']`) and `locale` for locale-aware casing (Turkish İ / ı). `raw` equals `formatted`.
- **`'slug'` format type.** A URL slug while the user types: accents removed, ß, æ, œ, ø, ł transliterated, separators collapsed. `formatted` keeps a trailing separator so the space key works; `raw` is the final, trimmed slug. Options: `delimiter` (default `'-'`), `replacements` (for example `{ '&': 'y' }`), `maxLength` and `locale`.
- **`case` on `'general'`.** The same casing modes as `'text'`, applied after the mask. It takes precedence over `uppercase` / `lowercase`, which keep working unchanged.
- `FORMAT_TYPES` lists nine types.

### Changed

- `uppercase` and `lowercase` accept `locale` for locale-aware casing. Without `locale` the output is unchanged.
- The browser scripts inline only the package `version` instead of the whole `package.json`, about 1.2 KB gzip less each. `window.Formatter.version` is unchanged.

## [3.0.0] - 2026-11-12

Phones become opt-in so the core no longer bundles libphonenumber-js, the
cleave-zen engine moves into the package, numerals can pad decimals and a new
`@samline/formatter/intl` subpath formats stored values for display.
Resolves [#1](https://github.com/samline/formatter/issues/1),
[#2](https://github.com/samline/formatter/issues/2),
[#3](https://github.com/samline/formatter/issues/3) and
[#4](https://github.com/samline/formatter/issues/4).

### Breaking

- **Phone support is opt-in.** `format(value, 'phone')` throws a `TypeError` until `registerPhone()` from the new `@samline/formatter/phone` subpath has run once; the error names the fix. Registration applies to every entrypoint (`.`, `/vanilla`, ESM and CommonJS share one registry). `formatPhone` moved from the root to `@samline/formatter/phone`.
- **Browser scripts renamed.** `dist/browser/global.global.js` is replaced by `dist/browser/formatter.global.js` (no phones) and `dist/browser/formatter.phone.global.js` (phones registered on load). The `./browser` export points at the core build; `./browser/phone` is new.
- **`cleave-zen` removed from `dependencies`.** `numeralThousandsGroupStyle` is now the exported string union `NumeralThousandsGroupStyle` (`'thousand' | 'lakh' | 'wan' | 'none'`) instead of cleave-zen's `NumeralThousandGroupStyles` enum. `DatePatternType` and `TimePatternType` keep their shape.

#### Migration

```diff
  import { format } from '@samline/formatter'
+ import { registerPhone } from '@samline/formatter/phone'
+ registerPhone()

- import { formatPhone } from '@samline/formatter'
+ import { formatPhone } from '@samline/formatter/phone'

- <script src="https://unpkg.com/@samline/formatter@2.1.0/dist/browser/global.global.js"></script>
+ <script src="https://unpkg.com/@samline/formatter@3.0.0/dist/browser/formatter.phone.global.js"></script>
```

Pages that format no phones can load `formatter.global.js` instead.

### Added

- `@samline/formatter/intl`: `formatNumber`, `formatCurrency`, `formatPercent`, `formatDate` and `formatRelativeTime` on the native `Intl` APIs, with no dependencies. `null`, `undefined` and `''` return `''`; values that cannot be read return a configurable `fallback` instead of `NaN` or `Invalid Date`; `Intl.*Format` instances are cached by locale and options. `formatDate` reads formatter's raw dates (`'2026-11-12'`, `'20261112'`, or any `pattern`) as local calendar dates. The browser builds expose the same functions as `window.Formatter.intl`. Replaces `@samline/date` for display; the Intl reference page has migration notes.
- `numeralDecimalPadding` pads the decimal part of a numeral's `formatted` value up to `numeralDecimalScale` (`1,234,567.5` → `1,234,567.50`). It defaults to `false`; apply it on blur or for display. `raw` stays unpadded and dot-decimal, and is stable when the padded value is formatted again.
- `rawDecimalPadding` pads a numeral's `raw` to `numeralDecimalScale` (`'1234.5'` → `'1234.50'`, `'1234'` → `'1234.00'`) for backends that expect a fixed scale. It is independent of `numeralDecimalPadding`, defaults to `false`, and `raw` stays stable when formatted again.
- `registerPhone()` and `isPhoneRegistered()` (the latter also exported from the root).
- The `NumeralThousandsGroupStyle` type.
- A size budget in `test:package`: the root entry stays under 25 KB minified (10 KB gzip) and the core IIFE under 30 KB. Measured for this release: root about 19 KB (7 KB gzip, from about 164 KB), core IIFE about 25 KB with `intl`, phone IIFE about 165 KB.
- Engine unit tests (`test/core/engine.test.ts`) whose expected values were recorded from cleave-zen 0.0.17; before the switch a 100,000-case randomized comparison matched the port exactly.
- Built-output tests for both IIFEs, the shared phone registry in ESM and CommonJS, the `intl` subpath and the absence of a cleave-zen import.

### Changed

- The numeral, date, time, credit-card and general engine is now `src/core/engine/`, a strict TypeScript port of the cleave-zen 0.0.17 modules formatter used (MIT notice kept in LICENSE.md). Unused code (the cursor tracker) was not ported, delimiter stripping no longer builds a `RegExp` per character, and steps that stripped delimiters from digit-only strings were removed.
- Casing for `general` masks and for matching typed affixes goes through one `applyCase()` step, so new modes can be added in a single place.

### Fixed

These come from auditing the ported engine and change a few outputs:

- A `','` `numeralDecimalMark` now groups with `'.'` when no `delimiter` is given. Before, both used `','`, so `1234,5` displayed `1,234,5` with raw `1.2345`.
- Numeral `raw` no longer uses an `M` placeholder: a prefix containing `M` left in the value (`-MXN 5` with `signBeforePrefix`) produced raw `-.5` instead of `-5`. Only a minus before the first digit counts as the sign, so `getRawValue('12-3', 'numeral')` returns `123`.
- An empty `numeralDecimalMark` falls back to `'.'` instead of producing raw values such as `.5`.
- Mastercard detection is limited to 51–55 and 2221–2720; `2220` and `2721`–`2799` are `general`. Partial prefixes (`222`, `27`, `272`) still resolve while typing.
- A 12-hour `time` turns a typed hour `00` into `12`.
- `formatGeneral` no longer appends `delimiter` to the caller's `delimiters` array on every call.
- With both `uppercase` and `lowercase`, affix matching now uses the same casing as the displayed mask (lowercase wins), instead of uppercase.

### Documentation

- Corrected examples that never matched the code: the US phone example returns `(202)-555-1234`, the `tailPrefix` examples need `blocks`, the card option is `strictMode` (not `creditCardStrictMode`), `stripLeadingZeroes` defaults to `true`, and the detected brands are listed as implemented (Elo, Hiper and Hipercard are not detected).
- New Intl display reference, phone opt-in sections, decimal padding guide, two-build CDN tables and an updated entrypoint size matrix.

## [2.1.0] - 2026-11-05

### Fixed

- Fixed the browser IIFE (`@samline/formatter/browser`, the CDN file): a classic `<script>` previously left `window.Formatter` as `{ default }`, so `window.Formatter.format` was `undefined` in real browsers. The global now exposes `format`, `regex` and `version` directly.
- Made the default `raw` of a prefixed or suffixed `general` value stable when the displayed value is formatted again: the formatter's own `delimiter`/`delimiters` are removed from the typed body, so `format('ORD-1234-5678', …).raw` matches `format('12345678', …).raw`. Characters that `numericOnly` hides are still preserved, as documented.
- Made canonical `raw` values (`rawPrefix`/`rawSuffix`) strip every configured `delimiters` entry, not only `delimiter`.
- Restored a locked `prefix`/`suffix` (default `'lock'` mode) when a single character of the decoration is deleted, instead of duplicating it (`100 US` → `100 USD`, not `100 US USD`).
- `format(value, 'general')` without a non-empty `blocks` array now throws a descriptive `TypeError` instead of an internal `cleave-zen` error.
- Phone country codes are now case-insensitive (`'mx'` behaves like `'MX'`).
- With `uppercase` or `lowercase`, a `prefix`/`suffix` typed or pasted in another case is now recognized instead of duplicated (`prefixMode: 'passthrough'`: `save20` → `SAVE20`, not `SAVESAVE20`). In lock mode, a pasted prefix in another case is now excluded from `raw`, as documented for `rawPrefix: false`; the typed body keeps its original case.
- Anchored `regex.numeral` to the whole value; it previously matched any string containing a digit. It accepts plain or comma-grouped digits with an optional sign and decimals.
- `regex.password()` rules are now requirements rather than an allow-list: characters outside the enabled rule groups (such as `!` with `special: false`) no longer fail validation, and disabling every rule produces a working length-only policy.
- Parametric regex builders (`digits`, `phone`, `creditCard`, `password`) throw a descriptive `RangeError` for negative, fractional or inverted (`min > max`) ranges instead of an invalid-regex `SyntaxError`.

### Changed

- The browser IIFE is now minified (about 165 KB instead of 272 KB before compression) and ships a source map.
- Replaced the Starlight documentation app with a combined Home, Examples and Docs website built from the shared package website theme. Website commands use the `site:` prefix; the npm package remains runtime-only (`dist` and `CHANGELOG.md`).
- Switched repository tooling to Bun workspaces, matching the other `@samline` packages.
- Renamed `LICENSE` to `LICENSE.md` and restructured the README to match the other `@samline` packages.

### Added

- Added a built-output smoke suite (`npm run test:package`) that runs the IIFE as a classic script, compares ESM/CommonJS exports and checks the npm archive contents. It runs in CI and `prepublishOnly`.
- Added the downloadable Formatter integration skill (`skills/formatter/SKILL.md`), published at `/skills/formatter/SKILL.md`.
- Added regression tests for every fix above.

## [2.0.3] - 2026-09-23

### Added

- Added internal and Starlight guides for styling and UX, covering visible/raw field structure, native input attributes, accessibility states, caret behavior, and common integration pitfalls.
- Added a documentation synchronization checklist and durable project lessons based on the formatter/forms documentation audit.

### Changed

- Reorganized the Starlight guide navigation so framework integration, styling, and recipes form one task-oriented learning path before the reference section.
- Added styling and UX links throughout the README, getting-started pages, recipes, and reference overview.
- Clarified changelog coverage for the prefix/suffix and password-validator regression tests shipped in `2.0.2`.
- Corrected the reference overview to explain that new pages must be added to the explicit sidebar configuration.

## [2.0.2] - 2026-09-23

### Added

- Exported `DatePatternType` and `TimePatternType` from the package entrypoints.
- Expanded the internal and Starlight documentation with dedicated API, recipes, entrypoint, framework, and TypeScript references.
- Added regression coverage for dedicated and combined prefix/suffix stripping.
- Strengthened password-validator tests so every enabled uppercase, lowercase, numeric, and special-character requirement is enforced independently.

### Fixed

- Made `stripPrefixAndSuffix()` remove the dedicated `suffix` option as documented, including combined prefix/suffix values.
- Made parametric password validators enforce each enabled uppercase, lowercase, numeric, and special-character requirement.
- Corrected documentation contracts for `RegexKey`, the browser global, affix helpers, and framework examples.
- Prevented the country-selector recipe from accumulating input listeners and removed direct DOM mutation from the React recipe.

## [2.0.1] - 2026-09-23

### Fixed

- Corrected automatic date and time interpretation when the configured display delimiter is an empty string.
- Kept the browser global version synchronized with `package.json`.

### Changed

- Added continuous integration coverage and refreshed the internal and Starlight documentation.
- Removed obsolete implementation history and redundant source comments while preserving public contracts and non-obvious invariants.

## [2.0.0] - 2026-07-19

### Changed — **BREAKING**

- **`format()` now defaults to `interpretInputAs: 'auto'` for `'date'` and `'time'` inputs.** v1.2.0 introduced `'display'` as the default, which fixed the live-keystroke scramble (typing `15091989` into a `d/m/Y` display + `Ymd` raw field) but exposed the inverse problem: a server-pre-filled raw (Blade `old()` carrying `"19901212"`) was now mis-segmented and the visible ended up showing `"19/09/1212"`. v2.0.0 flips the default to a context-aware heuristic: a value with no delimiter and a digit length equal to the raw pattern length is treated as raw; anything else (a value with delimiters, or a partial value) is treated as display. This covers the realistic "general purpose" case without an opt-in: a server-pre-filled raw Ymd is correctly converted to display, and a user keystroke (which always lands with a delimiter after the first digit of each segment) is processed as display so `cleave-zen` inserts the missing separators as it always did. `'display'` and `'raw'` are preserved as opt-ins for callers that know the convention unambiguously.

  ```ts
  // Default (v2.0.0+) — auto-detect raw vs display by the input shape
  format('19901212', 'date', {
    datePattern: ['d', 'm', 'Y'],
    delimiter: '/',
    dateRawPattern: ['Y', 'm', 'd'],
    dateRawPatternDelimiter: ''
  })
  // => { formatted: '12/12/1990', raw: '19901212', type: 'date' }

  // Opt-in to the v1.2.0 strict display interpretation
  format('15091989', 'date', {
    datePattern: ['d', 'm', 'Y'],
    delimiter: '/',
    dateRawPattern: ['Y', 'm', 'd'],
    dateRawPatternDelimiter: '',
    interpretInputAs: 'display'
  })
  // => { formatted: '15/09/1989', raw: '19890915', type: 'date' }

  // Opt-in to the pre-1.2.0 round-trip rearrangement
  format('19890915', 'date', {
    datePattern: ['d', 'm', 'Y'],
    delimiter: '/',
    dateRawPattern: ['Y', 'm', 'd'],
    dateRawPatternDelimiter: '',
    interpretInputAs: 'raw'
  })
  // => { formatted: '15/09/1989', raw: '19890915', type: 'date' }
  ```

  The only realistic regression is a paste of exactly the raw-pattern digit count with no delimiter (e.g. pasting `"12121990"` into a `d/m/Y` + `Ymd` field, which the auto heuristic now routes through the raw branch). Callers that need to disambiguate that case can pass `'display'` or `'raw'` explicitly. The keystroke case is unaffected: by the time the input event listener fires, the formatter has already inserted the delimiters, so the value reaching `format()` has a delimiter and the auto heuristic routes it through the display branch.

### Added

- **`interpretInputAs?: 'auto'`** as a third value alongside `'display'` and `'raw'`. The auto heuristic inspects the value: if it has no delimiter (matching the configured `datePattern` / `timePattern` delimiter or the default `/` / `:`) and its digit-only length matches the raw pattern length, it is treated as raw. Otherwise it is treated as display. The heuristic is the new v2.0.0 default; explicit `'auto'` is accepted for readability and forward-compatibility.
- **`looksLikeRawDateValue(value, options?)` and `looksLikeRawTimeValue(value, options?)`** exported helpers that expose the auto heuristic for callers that want to apply the same detection independently of `format()` (e.g. a custom form pipeline that needs to know whether to treat an inbound string as raw or display before doing other work).

### Migration notes

- **From `1.x` to `2.0.0`**: this is a breaking change. Pin to `1.x` (e.g. `^1.2.0`) if you cannot update immediately. The `format()` API signature is unchanged; the breaking part is the default of one option. The only realistic call site that the new default breaks is one that passes a raw-formatted string with no delimiter to `format()` and previously relied on the v1.2.0 display interpretation (which would mis-segment the raw digits) — those sites now correctly produce the canonical display and raw, so the "regression" is in practice a fix.
- **`@samline/forms@2.4.0`** drops the internal `interpretInputAs: 'raw'` override that v2.3.5 added to work around the v1.2.0 default; the v2.0.0 formatter default already does the right thing for the initial value pass and the mirror-source events that the override was guarding.

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
