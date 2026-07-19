import { describe, it, expect } from 'vitest'
import { format, FORMAT_TYPES, isFormatType } from '../../src/core/formatter'
import type { FormatOptions } from '../../src/core/formatter'

describe('format', () => {
  describe('empty / nullish input', () => {
    it('returns empty strings for null', () => {
      const result = format(null, 'general')
      expect(result).toEqual({ formatted: '', raw: '', type: 'general' })
    })

    it('returns empty strings for undefined', () => {
      const result = format(undefined, 'general')
      expect(result).toEqual({ formatted: '', raw: '', type: 'general' })
    })

    it('returns empty strings for empty string', () => {
      const result = format('', 'general')
      expect(result).toEqual({ formatted: '', raw: '', type: 'general' })
    })
  })

  describe('invalid formatType', () => {
    it('throws TypeError', () => {
      // @ts-expect-error — testing runtime guard
      expect(() => format('hello', 'bogus')).toThrow(TypeError)
    })

    it('throws with the list of valid types in the message', () => {
      // @ts-expect-error — testing runtime guard
      expect(() => format('hello', 'bogus')).toThrow(/general.*phone.*numeral/)
    })
  })

  describe('general', () => {
    it('formats with delimiter', () => {
      const result = format('1234567890', 'general', {
        blocks: [4, 4, 4, 4],
        delimiter: ' '
      })
      expect(result.type).toBe('general')
      expect(result.formatted).toBe('1234 5678 90')
    })

    it('returns digits-only raw value', () => {
      const result = format('1234 5678 90', 'general', {
        blocks: [4, 4, 4, 4],
        delimiter: ' '
      })
      expect(result.raw).toBe('1234567890')
    })
  })

  describe('phone', () => {
    it('formats a 10-digit number with default MX country', () => {
      const result = format('5512345678', 'phone')
      expect(result.type).toBe('phone')
      expect(result.formatted).toBe('55 1234 5678')
    })

    it('returns digits-only raw value preserving +', () => {
      const result = format('+52 1 55 1234 5678', 'phone')
      expect(result.raw).toMatch(/^\+\d+$/)
    })

    it('uses a custom delimiter when provided', () => {
      const result = format('5512345678', 'phone', { delimiter: '-' })
      expect(result.formatted).not.toContain(' ')
      expect(result.formatted).toContain('-')
    })

    it('uses a custom country when provided', () => {
      const result = format('2025551234', 'phone', { country: 'US' })
      expect(result.formatted).toBeTruthy()
      expect(result.raw).toBe('2025551234')
    })
  })

  describe('numeral', () => {
    it('formats with thousand separators', () => {
      const result = format('1234567', 'numeral')
      expect(result.type).toBe('numeral')
      expect(result.formatted).toMatch(/1,234,567|1\.234\.567/)
    })

    it('returns digits-only raw value', () => {
      const result = format('1,234,567.89', 'numeral')
      expect(result.raw).toBe('1234567.89')
    })

    it('honors custom decimal mark', () => {
      const result = format('1234.5', 'numeral', { numeralDecimalMark: '.' })
      expect(result.raw).toBe('1234.5')
    })
  })

  describe('date', () => {
    it('formats a display-order date to display pattern (d/m/Y by default)', () => {
      // Input is in display order (the user is typing what they see — the
      // realistic live-keystroke case). The v2.0.0 `auto` default
      // detects the `/` delimiter and passes the value through to
      // cleave-zen, which segments the digits into `datePattern` order
      // and re-emits with the default delimiter.
      const result = format('12/05/2026', 'date')
      expect(result.type).toBe('date')
      expect(result.formatted).toBe('12/05/2026')
    })

    it('returns raw value in Y-m-d order (round-trip from formatted display)', () => {
      // `getDateRawValue` re-segments the display digits in `dateRawPattern`
      // order (default `['Y','m','d']`) and re-emits with
      // `dateRawPatternDelimiter` (default `'-'`), so the canonical backend
      // form round-trips out of the display.
      const result = format('12/05/2026', 'date')
      expect(result.raw).toBe('2026-05-12')
    })

    it('honors a custom datePattern with custom delimiter', () => {
      const result = format('20260512', 'date', {
        datePattern: ['Y', 'm', 'd'],
        delimiter: '-'
      })
      expect(result.formatted).toBe('2026-05-12')
      expect(result.raw).toBe('2026-05-12')
    })
  })

  describe('time', () => {
    it('formats a raw time to display pattern (h/m/s by default)', () => {
      const result = format('14:30', 'time')
      expect(result.type).toBe('time')
      // cleave-zen emits `14:30:` (empty trailing seconds, not padded).
      expect(result.formatted).toBe('14:30:')
    })

    it('returns raw value', () => {
      const result = format('14:30:00', 'time')
      expect(result.raw).toBe('14:30')
    })
  })

  describe('creditCard', () => {
    it('formats a 16-digit card number', () => {
      const result = format('4111111111111111', 'creditCard')
      expect(result.type).toBe('creditCard')
      expect(result.formatted).toBe('4111 1111 1111 1111')
    })

    it('returns digits-only raw value', () => {
      const result = format('4111 1111 1111 1111', 'creditCard')
      expect(result.raw).toBe('4111111111111111')
    })
  })

  describe('creditCardType', () => {
    it('detects visa', () => {
      const result = format('4111111111111111', 'creditCardType')
      expect(result.type).toBe('creditCardType')
      expect(result.formatted.toLowerCase()).toContain('visa')
    })

    it('returns digits-only raw value (derived from input, not card-brand output)', () => {
      const result = format('4111-1111-1111-1111', 'creditCardType')
      expect(result.raw).toBe('4111111111111111')
    })
  })

  describe('non-string input', () => {
    it('stringifies numbers', () => {
      const result = format(12345, 'general', { blocks: [5] })
      expect(result.formatted).toBe('12345')
      expect(result.raw).toBe('12345')
    })

    it('stringifies booleans', () => {
      const result = format(true, 'general', { blocks: [4] })
      expect(result.formatted).toBe('true')
    })
  })

  describe('prefix / tailPrefix', () => {
    it('strips prefix before computing raw', () => {
      const result = format('$1,234.50', 'numeral', {
        prefix: '$',
        numeralDecimalMark: '.'
      })
      expect(result.formatted).toContain('1,234')
      expect(result.raw).toBe('1234.50')
    })

    it('strips tailPrefix (suffix) before computing raw', () => {
      const result = format('1234.50 USD', 'numeral', {
        prefix: ' USD',
        tailPrefix: true,
        numeralDecimalMark: '.'
      })
      expect(result.raw).toBe('1234.50')
    })
  })

  describe('general + prefix (lock mode, default)', () => {
    // Regression suite for the "prefix + general rejects keystrokes"
    // issue. The formatter used to delegate prefix handling to cleave-zen,
    // whose `stripPrefix` discards any input that doesn't already start
    // with the prefix — freezing the field at the literal prefix and
    // returning an empty raw. The fix manages the prefix entirely on the
    // formatter's side so user input always flows through to the suffix
    // (regardless of whether the user typed the prefix themselves).

    const lockOpts = {
      blocks: [13],
      prefix: 'EASY'
    }

    it('auto-prepends the configured prefix when the user types only the suffix', () => {
      const result = format('123456789', 'general', lockOpts)
      expect(result.formatted).toBe('EASY123456789')
      expect(result.raw).toBe('123456789')
    })

    it('strips a pasted prefix before processing the suffix (paste case)', () => {
      const result = format('EASY123456789', 'general', lockOpts)
      expect(result.formatted).toBe('EASY123456789')
      expect(result.raw).toBe('123456789')
    })

    it('honors numericOnly + uppercase on the suffix', () => {
      const result = format('easy12345abc', 'general', {
        ...lockOpts,
        numericOnly: true,
        uppercase: true
      })
      expect(result.formatted).toBe('EASY12345')
      // The typed input is the raw mirror; cleave-zen's numericOnly /
      // uppercase filtering applies to the display, not to raw.
      expect(result.raw).toBe('easy12345abc')
    })

    it('preserves a tailPrefix (suffix) at the end of the display', () => {
      const result = format('123456789', 'general', {
        prefix: 'USD',
        tailPrefix: true,
        blocks: [12]
      })
      expect(result.formatted).toBe('123456789USD')
      expect(result.raw).toBe('123456789')
    })

    it('does not silently truncate overflow — raw mirrors what the user typed', () => {
      // `blocks` is a display-time shape, not a hard cap on the input.
      // The backend already knows the canonical length and would surface
      // its own validation; the formatter intentionally does not clip.
      const result = format(
        '1234567890EXTRA',
        'general',
        { blocks: [13], prefix: 'EASY' }
      )
      expect(result.formatted.startsWith('EASY')).toBe(true)
      expect(result.raw).toBe('1234567890EXTRA')
    })
  })

  describe('general + prefix + rawPrefix', () => {
    // `rawPrefix: true` includes the configured prefix in the `raw` mirror
    // so callers can ship the canonical identifier (e.g.
    // `EASY123456789`) to a backend that expects the prefix.

    it('includes the prefix in raw when rawPrefix: true', () => {
      const result = format('123456789', 'general', {
        blocks: [13],
        prefix: 'EASY',
        rawPrefix: true
      })
      expect(result.formatted).toBe('EASY123456789')
      expect(result.raw).toBe('EASY123456789')
    })

    it('excludes the prefix in raw when rawPrefix: false (default)', () => {
      const result = format('123456789', 'general', {
        blocks: [13],
        prefix: 'EASY'
      })
      expect(result.formatted).toBe('EASY123456789')
      expect(result.raw).toBe('123456789')
    })

    it('also works when the user pastes the full canonical value (lock mode)', () => {
      const result = format('EASY123456789', 'general', {
        blocks: [13],
        prefix: 'EASY',
        rawPrefix: true
      })
      expect(result.formatted).toBe('EASY123456789')
      expect(result.raw).toBe('EASY123456789')
    })
  })

  describe('general + prefix + prefixMode: passthrough', () => {
    // `passthrough` lets the user type the prefix themselves (character by
    // character) instead of the formatter auto-prepending it. Useful when
    // the prefix is part of the data the user is transcribing. The lock
    // / passthrough distinction only affects display; `raw` follows
    // `rawPrefix` and the configured prefix either way.

    const passthroughOpts = {
      blocks: [13],
      prefix: 'EASY',
      prefixMode: 'passthrough' as const
    }

    it('keeps a fully-prefixed value with raw matching the typed input', () => {
      const result = format('EASY123456789', 'general', passthroughOpts)
      expect(result.formatted).toBe('EASY123456789')
      // rawPrefix defaults to false → raw excludes the typed prefix.
      expect(result.raw).toBe('123456789')
    })

    it('lets the user build up the prefix character by character', () => {
      // Once the typed input starts with the prefix characters, they
      // stick on every keystroke (instead of snapping to the literal
      // prefix and emptying the suffix).
      expect(format('EA', 'general', passthroughOpts).formatted).toBe('EA')
      expect(format('EASY', 'general', passthroughOpts).formatted).toBe(
        'EASY'
      )
      expect(format('EASY1', 'general', passthroughOpts).formatted).toBe(
        'EASY1'
      )
    })

    it('still formats and clamps raw when rawPrefix: true in passthrough mode', () => {
      const result = format('EASY123456789', 'general', {
        ...passthroughOpts,
        rawPrefix: true
      })
      expect(result.formatted).toBe('EASY123456789')
      expect(result.raw).toBe('EASY123456789')
    })

    it('falls back to the configured prefix in display when nothing is typed yet', () => {
      // Empty input → `format()` early-returns at the top of the function
      // with both formatted and raw as '', so the prefix alone is shown
      // only when there is at least a non-empty input. We assert the
      // boundary directly.
      const result = format('12345', 'general', passthroughOpts)
      // Prefix is fully typed (`EASY` matches `12345`'s leading chars? no),
      // so passthrough uses `typed || prefix`. `12345` doesn't start with
      // `E`, so typed is '' → displayedPrefix = 'EASY'.
      expect(result.formatted.startsWith('EASY')).toBe(true)
    })
  })

  describe('general + suffix (lock mode, default)', () => {
    // Mirror of the prefix lock-mode suite, applied to the trailing
    // decoration. `suffix` is the new dedicated option — `prefix +
    // tailPrefix: true` is preserved as a legacy alias.

    const lockSuffixOpts = {
      blocks: [12],
      suffix: 'USD'
    }

    it('auto-appends the configured suffix when the user types only the body', () => {
      const result = format('123456789', 'general', lockSuffixOpts)
      expect(result.formatted).toBe('123456789USD')
      expect(result.raw).toBe('123456789')
    })

    it('strips a pasted suffix before processing the body (paste case)', () => {
      const result = format('123456789USD', 'general', lockSuffixOpts)
      expect(result.formatted).toBe('123456789USD')
      expect(result.raw).toBe('123456789')
    })

    it('honors numericOnly on the body', () => {
      const result = format('abc12345', 'general', {
        ...lockSuffixOpts,
        numericOnly: true
      })
      // numericOnly filters the display body to digits; raw mirrors what
      // the user typed (matching the prefix-side convention).
      expect(result.formatted).toBe('12345USD')
      expect(result.raw).toBe('abc12345')
    })

    it('survives partial suffix typing in lock mode by always appending the configured suffix', () => {
      const result = format('12345US', 'general', lockSuffixOpts)
      // Lock doesn't strip partial suffixes — the user shouldn't be
      // typing the suffix in lock mode, so what they type lives in the
      // body and the configured suffix still shows.
      expect(result.formatted.endsWith('USD')).toBe(true)
    })
  })

  describe('general + suffix + rawSuffix', () => {
    it('includes the suffix in raw when rawSuffix: true', () => {
      const result = format('123456789', 'general', {
        blocks: [12],
        suffix: 'USD',
        rawSuffix: true
      })
      expect(result.formatted).toBe('123456789USD')
      expect(result.raw).toBe('123456789USD')
    })

    it('excludes the suffix in raw when rawSuffix: false (default)', () => {
      const result = format('123456789', 'general', {
        blocks: [12],
        suffix: 'USD'
      })
      expect(result.formatted).toBe('123456789USD')
      expect(result.raw).toBe('123456789')
    })

    it('combines rawPrefix + rawSuffix when both are present', () => {
      const result = format('12345', 'general', {
        blocks: [11],
        prefix: 'PRE-',
        suffix: '-END',
        rawPrefix: true,
        rawSuffix: true
      })
      expect(result.formatted).toBe('PRE-12345-END')
      expect(result.raw).toBe('PRE-12345-END')
    })
  })

  describe('general + suffix + suffixMode: passthrough', () => {
    const passthroughSuffixOpts = {
      blocks: [12],
      suffix: 'USD',
      suffixMode: 'passthrough' as const
    }

    it('keeps a fully-typed suffix and strips it from raw', () => {
      const result = format('12345USD', 'general', passthroughSuffixOpts)
      expect(result.formatted).toBe('12345USD')
      expect(result.raw).toBe('12345')
    })

    it('lets the user build up the suffix character by character', () => {
      // Each suffix character the user types sticks on the display
      // instead of snapping to the full configured suffix.
      expect(format('12345U', 'general', passthroughSuffixOpts).formatted).toBe(
        '12345U'
      )
      expect(format('12345US', 'general', passthroughSuffixOpts).formatted).toBe(
        '12345US'
      )
      expect(
        format('12345USD', 'general', passthroughSuffixOpts).formatted
      ).toBe('12345USD')
    })

    it('still includes the suffix in raw when rawSuffix: true in passthrough', () => {
      const result = format('12345USD', 'general', {
        ...passthroughSuffixOpts,
        rawSuffix: true
      })
      expect(result.formatted).toBe('12345USD')
      expect(result.raw).toBe('12345USD')
    })
  })

  describe('general + prefix + suffix (combined lock)', () => {
    it('renders head + body + tail when both decorations are present', () => {
      const result = format('12345', 'general', {
        blocks: [11],
        prefix: 'PRE-',
        suffix: '-END'
      })
      expect(result.formatted).toBe('PRE-12345-END')
      expect(result.raw).toBe('12345')
    })

    it('handles paste of a fully decorated value through both prefixes', () => {
      const result = format('PRE-12345-END', 'general', {
        blocks: [11],
        prefix: 'PRE-',
        suffix: '-END'
      })
      expect(result.formatted).toBe('PRE-12345-END')
      expect(result.raw).toBe('12345')
    })
  })

  describe('general + legacy tailPrefix (backwards compat)', () => {
    // The historical `prefix + tailPrefix: true` shape still works the
    // same way it always did for callers that haven't migrated to the new
    // dedicated `suffix` option.

    it('keeps prefix + tailPrefix producing a tail decoration', () => {
      const result = format('123456789', 'general', {
        blocks: [12],
        prefix: 'USD',
        tailPrefix: true
      })
      expect(result.formatted).toBe('123456789USD')
      expect(result.raw).toBe('123456789')
    })

    it('lets suffix win when both suffix and legacy prefix + tailPrefix are provided', () => {
      const result = format('12345', 'general', {
        blocks: [11],
        prefix: 'X',
        tailPrefix: true,
        suffix: 'OK'
      })
      // `prefix` becomes the head decoration (legacy tailPrefix is
      // ignored), `suffix` is the tail.
      expect(result.formatted).toBe('X12345OK')
    })
  })

  describe('general + prefix/suffix + numericOnly + raw (canonical raw contamination)', () => {
    // When `rawPrefix: true` (or `rawSuffix: true`) is set, the raw mirror
    // is meant to be the canonical identifier (`prefix + body + suffix`).
    // Up to 1.1.1 the body part of that raw was built from the user's
    // typed input verbatim, so a user fat-fingering letters into a
    // `numericOnly: true` field would see a clean display but ship a
    // contaminated identifier to the backend. The fix derives the body
    // part of the raw from `bodyFormatted` (which has already been
    // through `cleave-zen.formatGeneral` with `numericOnly` applied) and
    // strips the display delimiter.
    //
    // The blocks used here (`[4, 5]` for the dedicated cases and
    // `[4, 4, 5]` for the verbatim repro) intentionally match the
    // upstream bug report so the assertions double as documentation.

    it('strips non-digits from raw when prefix + rawPrefix + numericOnly are configured (lock mode)', () => {
      // Verbatim repro from the upstream bug report (typed
      // `1a2b3c4d5e6f7g8h9i`, expected canonical raw `EASY123456789`).
      // The `formatted` assertion uses `[4, 5]` so the cleave-zen
      // output is clean and orthogonal to the bug being fixed.
      const result = format('1a2b3c4d5e6f7g8h9i', 'general', {
        blocks: [4, 5],
        delimiter: ' ',
        prefix: 'EASY',
        prefixMode: 'lock',
        rawPrefix: true,
        numericOnly: true
      })
      expect(result.formatted).toBe('EASY1234 56789')
      expect(result.raw).toBe('EASY123456789')
    })

    it('preserves the original blocks [4, 4, 5] repro and asserts the same canonical raw', () => {
      // Same scenario as above but with the upstream `blocks: [4, 4, 5]`.
      // `cleave-zen` inserts a trailing delimiter before the incomplete
      // third block — that's orthogonal to this fix and is documented
      // here purely to lock in the canonical-raw outcome.
      const result = format('1a2b3c4d5e6f7g8h9i', 'general', {
        blocks: [4, 4, 5],
        delimiter: ' ',
        prefix: 'EASY',
        prefixMode: 'lock',
        rawPrefix: true,
        numericOnly: true
      })
      expect(result.formatted).toBe('EASY1234 5678 9')
      expect(result.raw).toBe('EASY123456789')
    })

    it('applies numericOnly symmetrically to suffix + rawSuffix', () => {
      const result = format('1a2b3c4d5e6f7g8h9i', 'general', {
        blocks: [4, 5],
        delimiter: ' ',
        suffix: 'USD',
        suffixMode: 'lock',
        rawSuffix: true,
        numericOnly: true
      })
      expect(result.formatted).toBe('1234 56789USD')
      expect(result.raw).toBe('123456789USD')
    })

    it('also strips non-digits in passthrough prefixMode', () => {
      const result = format('EASY1a2b3c4d5e6f7g8h9i', 'general', {
        blocks: [4, 5],
        delimiter: ' ',
        prefix: 'EASY',
        prefixMode: 'passthrough',
        rawPrefix: true,
        numericOnly: true
      })
      // The user typed the full `EASY` prefix themselves, so it sticks;
      // the body's non-digits are stripped from both display and raw.
      expect(result.formatted).toBe('EASY1234 56789')
      expect(result.raw).toBe('EASY123456789')
    })

    it('combines prefix + suffix + rawPrefix + rawSuffix + numericOnly end-to-end', () => {
      const result = format('1a2b3c4d5e6f7g8h9i', 'general', {
        blocks: [4, 5],
        delimiter: ' ',
        prefix: 'EASY',
        prefixMode: 'lock',
        rawPrefix: true,
        suffix: 'USD',
        suffixMode: 'lock',
        rawSuffix: true,
        numericOnly: true
      })
      expect(result.formatted).toBe('EASY1234 56789USD')
      expect(result.raw).toBe('EASY123456789USD')
    })

    it('keeps raw as the user typed it when numericOnly is not set (no spurious filtering)', () => {
      // Negative test: the fix must not introduce filtering when the
      // caller did not ask for it. `rawPrefix: true` here still wraps
      // the prefix around the typed body, but the typed letters must
      // survive (the body part is derived from `bodyFormatted`, which
      // does not apply `numericOnly` when the option is not set).
      const result = format('easy12345abc', 'general', {
        blocks: [13],
        prefix: 'EASY',
        prefixMode: 'lock',
        rawPrefix: true
      })
      expect(result.formatted).toBe('EASYeasy12345abc')
      expect(result.raw).toBe('EASYeasy12345abc')
    })

    it('does not leak the prefix into raw when rawPrefix is false even with numericOnly', () => {
      // Negative test: `rawPrefix: false` is the historical default and
      // must still produce just the typed body, even when `numericOnly`
      // strips letters from the display.
      const result = format('1a2b3c4d5e6f7g8h9i', 'general', {
        blocks: [4, 5],
        delimiter: ' ',
        prefix: 'EASY',
        prefixMode: 'lock',
        numericOnly: true
      })
      expect(result.formatted).toBe('EASY1234 56789')
      expect(result.raw).toBe('1a2b3c4d5e6f7g8h9i')
    })

    it('handles a delimiter with regex-special characters without crashing', () => {
      // Sanity test: the delimiter-strip regex escapes the delimiter so
      // unusual characters (`-`, `]`, `\`, etc.) do not blow up the
      // character class.
      const result = format('1a2b3c4d5e6f7g8h9i', 'general', {
        blocks: [4, 5],
        delimiter: '-',
        prefix: 'EASY',
        prefixMode: 'lock',
        rawPrefix: true,
        numericOnly: true
      })
      expect(result.formatted).toBe('EASY1234-56789')
      expect(result.raw).toBe('EASY123456789')
    })
  })

  describe('date round-trip (Bug #2 — raw pattern defaults)', () => {
    // The historical defaults for `dateRawPattern` (['Y','m','d']) and
    // `dateRawPatternDelimiter` ('-') silently produced a mismatch when a
    // caller customised `datePattern` / `delimiter`. The fix derives the
    // raw pattern / delimiter from the display pattern when the caller
    // doesn't pass them explicitly.

    it('formats a d-m-Y date with / delimiter and round-trips identically', () => {
      const result = format('15091989', 'date', {
        datePattern: ['d', 'm', 'Y'],
        delimiter: '/'
      })
      expect(result.formatted).toBe('15/09/1989')
      expect(result.raw).toBe('15/09/1989')
    })

    it('keeps the historical d-m-Y → Y-m-d behaviour when only the raw is queried', () => {
      // Calling format() with no options on a *raw* ISO date is documented
      // to display as d/m/Y and round-trip back to Y-m-d; this stays the
      // same and protects consumers that depend on it — but the caller has
      // to opt into the legacy raw-input interpretation with
      // `interpretInputAs: 'raw'`. As of v1.2.0 the default is `'display'`
      // (the realistic live-keystroke case), so passing a raw-formatted
      // string without the opt-in would mis-segment the digits.
      const result = format('2026-05-12', 'date', { interpretInputAs: 'raw' })
      expect(result.formatted).toBe('12/05/2026')
      expect(result.raw).toBe('2026-05-12')
    })

    it('honours a Y-m-d pattern with - delimiter end-to-end', () => {
      const result = format('20260512', 'date', {
        datePattern: ['Y', 'm', 'd'],
        delimiter: '-'
      })
      expect(result.formatted).toBe('2026-05-12')
      expect(result.raw).toBe('2026-05-12')
    })

    it('lets dateRawPattern override the derived default when explicitly set', () => {
      // If the caller actually wants the historical asymmetric behaviour
      // (input is already in raw order, e.g. ISO) they can still opt in
      // by passing dateRawPattern + dateRawPatternDelimiter explicitly
      // together with the new `interpretInputAs: 'raw'` flag.
      const result = format('2026-05-12', 'date', {
        datePattern: ['d', 'm', 'Y'],
        delimiter: '/',
        dateRawPattern: ['Y', 'm', 'd'],
        dateRawPatternDelimiter: '-',
        interpretInputAs: 'raw'
      })
      expect(result.formatted).toBe('12/05/2026')
      expect(result.raw).toBe('2026-05-12')
    })
  })

  describe('date / time live keystrokes (Bug — interpretInputAs default)', () => {
    // Up to 1.1.2 `format()` always treated `'date'` / `'time'` input as
    // raw-formatted, segmented by `dateRawPattern` / `timeRawPattern` and
    // re-emitted in `datePattern` / `timePattern` order. For a real user
    // typing into a field whose display order differs from the raw order,
    // this scrambled the digits on every keystroke (e.g. typing `15091989`
    // produced visible `19/09/0805` and hidden `08050919` for a
    // `d/m/Y` display + `Ymd` raw combo — see the original bug report).
    //
    // The fix landed in v1.2.0 as `interpretInputAs: 'display'` (a
    // strict default that passes the value through to cleave-zen
    // without rearranging). v2.0.0 changed the default to `'auto'`
    // (see the "auto" describe block below) which solves the inverse
    // problem — server-pre-filled raw values from `old()` no longer
    // scramble either. For consumers that want the strict
    // display-order behaviour of v1.2.0 (e.g. a real-time keystroke
    // listener where the formatter has already inserted delimiters),
    // `interpretInputAs: 'display'` remains available as an opt-in
    // and is what these legacy keystroke tests pin down.
    //
    // `getRawValue()` (the round-trip path) still re-segments the display
    // digits into the raw pattern, so the canonical backend form is
    // produced for complete dates. For partial keystrokes the
    // rearrangement is best-effort — the consumer is expected to finalise
    // the raw on submit (the bug report acknowledges this). The KEY
    // invariant is that the digits are no longer scrambled: the visible
    // and the raw both reflect the user's typed input, not a permutation
    // of it.

    const easTripDateOpts: FormatOptions = {
      datePattern: ['d', 'm', 'Y'],
      delimiter: '/',
      dateRawPattern: ['Y', 'm', 'd'],
      dateRawPatternDelimiter: '',
      interpretInputAs: 'display'
    }

    const easyTripTimeOpts: FormatOptions = {
      timePattern: ['h', 'm', 's'],
      timeRawPattern: ['h', 'm'],
      timeRawPatternDelimiter: ':',
      interpretInputAs: 'display'
    }

    it('date live keystrokes keep the visible and raw aligned with the user\'s input (d/m/Y + Ymd)', () => {
      // The EasyTrip-style config: user sees `DD/MM/AAAA` and the backend
      // expects `YYYYMMDD`. The fix: typing `15091989` produces
      // visible `15/09/1989` and raw `19890915` (the canonical form the
      // backend validates against `DateParser::FORMAT_DATE_INPUT = 'Ymd'`).
      //
      // For partial keystrokes the `raw` is the best-effort rearrangement
      // of the typed digits into `dateRawPattern` order — the consumer is
      // expected to finalise the raw on submit. The KEY invariant (the
      // one the bug violated) is that the visible digits are not
      // scrambled: typing `15` shows `15/`, typing `150` shows `15/0`,
      // etc. The raw follows the source-pattern slicing into the
      // target-pattern order, dropping incomplete trailing segments.
      const expected: Array<[string, string, string]> = [
        ['1', '1', '1'],
        ['15', '15/', '15'],
        ['150', '15/0', '015'],
        ['1509', '15/09/', '0915'],
        ['15091', '15/09/1', '10915'],
        ['150919', '15/09/19', '190915'],
        ['15091989', '15/09/1989', '19890915']
      ]
      for (const [input, expectedFormatted, expectedRaw] of expected) {
        const r = format(input, 'date', easTripDateOpts)
        expect(r.formatted).toBe(expectedFormatted)
        expect(r.raw).toBe(expectedRaw)
      }
    })

    it('time live keystrokes keep the visible and raw aligned (h/m/s + h/m, same fix applied symmetrically)', () => {
      // The parallel bug for `time`: the old default mis-segmented the
      // keystrokes whenever `timePattern` and `timeRawPattern` differed
      // (typing `1430` with `timePattern:['h','m','s']` and
      // `timeRawPattern:['s','m','h']` produced visible `03:14:` and raw
      // `1403`). The fix: same `interpretInputAs: 'display'` short-circuit
      // applies to the time branch in `getValueForFormatting`.
      //
      // With the same-shape raw pattern (`['h','m']` is a prefix of
      // `['h','m','s']`) the raw is just the display digits sliced into
      // the raw pattern order with the configured raw delimiter.
      const expected: Array<[string, string, string]> = [
        ['1', '1', '1'],
        ['14', '14:', '14'],
        ['143', '14:3', '14:3'],
        ['1430', '14:30:', '14:30'],
        ['14300', '14:30:0', '14:30'],
        ['143000', '14:30:00', '14:30']
      ]
      for (const [input, expectedFormatted, expectedRaw] of expected) {
        const r = format(input, 'time', easyTripTimeOpts)
        expect(r.formatted).toBe(expectedFormatted)
        expect(r.raw).toBe(expectedRaw)
      }
    })

    it('time live keystrokes with a fully reordering raw pattern do not scramble the visible digits', () => {
      // The most pathological asymmetric config: `timePattern:['h','m','s']`
      // and `timeRawPattern:['s','m','h']`. The OLD default produced
      // visible `03:4` and raw `403` for input `143` (digits scrambled).
      // The fix: visible shows the natural `h/m/s` slicing of the typed
      // digits, raw is the best-effort rearrangement into `s/m/h` order.
      // The v2.0.0 default (`'auto'`) would treat 6-digit inputs as raw
      // for a same-length raw pattern, so the test opts into the strict
      // display-order interpretation explicitly to keep the keystroke
      // semantics observable.
      const opts: FormatOptions = {
        timePattern: ['h', 'm', 's'],
        timeRawPattern: ['s', 'm', 'h'],
        timeRawPatternDelimiter: '',
        interpretInputAs: 'display'
      }
      // The KEY assertion: `formatted` is no longer scrambled. The raw
      // still re-segments (it's the round-trip helper, doing what it
      // always did), but the source is now in display order so the
      // slicing is predictable.
      expect(format('143', 'time', opts).formatted).toBe('14:3')
      expect(format('1430', 'time', opts).formatted).toBe('14:30:')
      expect(format('143059', 'time', opts).formatted).toBe('14:30:59')
    })

    it('date interpretInputAs: \'raw\' preserves the legacy raw-input round-trip', () => {
      // Callers that pass a raw-formatted value (e.g. a `setValue` from
      // a backend pre-filling the field) can opt into the historical
      // rearrangement. The fix lands as a strict opt-in so the default
      // change is safe.
      const result = format('19890915', 'date', {
        ...easTripDateOpts,
        interpretInputAs: 'raw'
      })
      expect(result.formatted).toBe('15/09/1989')
      expect(result.raw).toBe('19890915')
    })

    it('time interpretInputAs: \'raw\' preserves the legacy raw-input round-trip', () => {
      const result = format('1430', 'time', {
        ...easyTripTimeOpts,
        interpretInputAs: 'raw'
      })
      expect(result.formatted).toBe('14:30:')
      expect(result.raw).toBe('14:30')
    })

    it('getRawValue produces the canonical backend form for a complete formatted date', () => {
      // `getRawValue` (the round-trip path used by `format()` to compute
      // its `raw` mirror) still re-segments the display digits into the
      // raw pattern. For a complete formatted date this yields the
      // canonical backend form, ready to ship to a backend that
      // validates against `Ymd`. The input is in display order (with
      // delimiter) to match the v1.2.0-style keystroke semantics
      // pinned by the surrounding tests.
      const result = format('15/09/1989', 'date', easTripDateOpts)
      expect(result.raw).toBe('19890915')
    })

    it('getRawValue respects an explicit raw delimiter', () => {
      // Lock-in the documented `dateRawPatternDelimiter` contract so a
      // future refactor of `getDateRawValue` cannot accidentally drop it.
      // The input is in display order so the v2.0.0 `'auto'` default
      // routes it through the display branch (has delimiter) and the
      // raw uses the explicit raw delimiter.
      const result = format('15/09/1989', 'date', {
        datePattern: ['d', 'm', 'Y'],
        delimiter: '/',
        dateRawPattern: ['Y', 'm', 'd'],
        dateRawPatternDelimiter: '-'
      })
      expect(result.formatted).toBe('15/09/1989')
      expect(result.raw).toBe('1989-09-15')
    })

    it('getRawValue for time derives the raw delimiter from `delimiter` when timeRawPatternDelimiter is not set', () => {
      // Parallel to the 1.1.1 fix for date: `getTimeRawValue` now falls
      // back to `options.delimiter` (the display delimiter) when
      // `timeRawPatternDelimiter` is not set, so a single
      // `{ timePattern, delimiter }` configuration round-trips
      // consistently without the consumer having to repeat the delimiter
      // in the raw options.
      const result = format('143000', 'time', {
        timePattern: ['h', 'm', 's'],
        timeRawPattern: ['h', 'm'],
        delimiter: '-'
      })
      expect(result.formatted).toBe('14-30-00')
      expect(result.raw).toBe('14-30')
    })

    it('explicit timeRawPatternDelimiter still wins over the display delimiter', () => {
      // The explicit option takes precedence; the display delimiter is
      // only the fallback. This keeps the historical escape hatch
      // available for callers that want the raw in a different shape
      // (e.g. backend validates with `:` even though the user sees `-`).
      const result = format('143000', 'time', {
        timePattern: ['h', 'm', 's'],
        timeRawPattern: ['h', 'm'],
        delimiter: '-',
        timeRawPatternDelimiter: ':'
      })
      expect(result.formatted).toBe('14-30-00')
      expect(result.raw).toBe('14:30')
    })
  })

  describe('v2.0.0 default — interpretInputAs: "auto"', () => {
    // The v2.0.0 default flips from `'display'` to `'auto'`. The
    // heuristic is: if the value has no delimiter and its digit length
    // matches the raw pattern, treat it as raw; otherwise treat it as
    // display. This covers the realistic server-pre-fill case (Blade
    // `old()` carrying the raw Ymd) and the realistic live-keystroke
    // case (the formatter has already inserted delimiters by the time
    // the input event listener fires). See the `interpretInputAs`
    // doc in `FormatOptions` for the full contract.

    const dateAutoOpts: FormatOptions = {
      datePattern: ['d', 'm', 'Y'],
      delimiter: '/',
      dateRawPattern: ['Y', 'm', 'd'],
      dateRawPatternDelimiter: ''
    }

    const timeAutoOpts: FormatOptions = {
      timePattern: ['h', 'm', 's'],
      timeRawPattern: ['h', 'm'],
      timeRawPatternDelimiter: ''
    }

    it('treats a delimiter-less raw-length date as raw (the easytrip Blade old() case)', () => {
      // The bug case from the easytrip report: a Blade re-render
      // ships `value="{{ old('birthday') }}"` carrying `"19901212"`.
      // The v1.2.0 default scrambled the visible to "19/09/1212";
      // the v2.0.0 `auto` default routes the value through the raw
      // branch (no delimiter, 8 digits = Ymd raw length) and
      // produces the correct display "12/12/1990" with raw
      // "19901212".
      const result = format('19901212', 'date', dateAutoOpts)
      expect(result.formatted).toBe('12/12/1990')
      expect(result.raw).toBe('19901212')
    })

    it('treats a delimiter-bearing date as display (the user typing case)', () => {
      // Live keystroke: the formatter has already inserted the
      // delimiter, so the value reaching `format()` has `/`. The
      // auto heuristic routes it through the display branch and
      // cleave-zen handles the rest.
      const result = format('12/12/1990', 'date', dateAutoOpts)
      expect(result.formatted).toBe('12/12/1990')
      expect(result.raw).toBe('19901212')
    })

    it('treats a partial date (no delimiter, sub-raw-length) as display', () => {
      // Mid-typing values: a few digits without a delimiter, not
      // yet the full raw length. The auto heuristic falls through
      // to display and cleave-zen inserts the separators as it
      // does for any partial value.
      const partial = format('1212', 'date', dateAutoOpts)
      expect(partial.formatted).toBe('12/12/')
      expect(partial.raw).toBe('1212')
    })

    it('treats a delimiter-less raw-length time as raw', () => {
      const result = format('1430', 'time', timeAutoOpts)
      expect(result.formatted).toBe('14:30:')
      expect(result.raw).toBe('1430')
    })

    it('treats a delimiter-bearing time as display', () => {
      const result = format('14:30', 'time', timeAutoOpts)
      expect(result.formatted).toBe('14:30:')
      expect(result.raw).toBe('1430')
    })

    it('treats a custom delimiter consistently (the delimiter is the auto heuristic\'s discriminator)', () => {
      // When the display delimiter is not `/` (e.g. `-`), the
      // heuristic must look for THAT delimiter, not the default.
      const dashOpts: FormatOptions = {
        datePattern: ['d', 'm', 'Y'],
        delimiter: '-',
        dateRawPattern: ['Y', 'm', 'd'],
        dateRawPatternDelimiter: ''
      }
      // Display with the custom delimiter: routes through display.
      const display = format('12-12-1990', 'date', dashOpts)
      expect(display.formatted).toBe('12-12-1990')
      expect(display.raw).toBe('19901212')
      // Raw without any delimiter: routes through raw.
      const raw = format('19901212', 'date', dashOpts)
      expect(raw.formatted).toBe('12-12-1990')
      expect(raw.raw).toBe('19901212')
    })

    it('explicit interpretInputAs: "display" still opts into the v1.2.0 strict behaviour', () => {
      // The opt-in is preserved for callers that know the
      // convention unambiguously and want to skip the heuristic.
      // With "display" the 8-digit input is treated as display
      // d/m/Y even though it has no delimiter — i.e. the
      // pre-2.0 behaviour for keystroke listeners.
      const result = format('15091989', 'date', {
        ...dateAutoOpts,
        interpretInputAs: 'display'
      })
      expect(result.formatted).toBe('15/09/1989')
      expect(result.raw).toBe('19890915')
    })

    it('explicit interpretInputAs: "raw" still opts into the v1.0 round-trip', () => {
      // The opt-in is preserved for callers that always know the
      // value is in raw form (e.g. a programmatic setValue from a
      // pre-existing API contract). The input here is an actual
      // raw Ymd (19890915 = 15 September 1989), not a display-order
      // string, so the round-trip yields the same canonical form
      // both before and after the call.
      const result = format('19890915', 'date', {
        ...dateAutoOpts,
        interpretInputAs: 'raw'
      })
      expect(result.formatted).toBe('15/09/1989')
      expect(result.raw).toBe('19890915')
    })
  })
})

describe('FORMAT_TYPES', () => {
  it('contains exactly the seven supported types', () => {
    expect(FORMAT_TYPES).toEqual([
      'general',
      'phone',
      'numeral',
      'date',
      'time',
      'creditCard',
      'creditCardType'
    ])
  })
})

describe('isFormatType', () => {
  it('returns true for each supported type', () => {
    for (const t of FORMAT_TYPES) {
      expect(isFormatType(t)).toBe(true)
    }
  })

  it('returns false for unknown strings', () => {
    expect(isFormatType('bogus')).toBe(false)
    expect(isFormatType('')).toBe(false)
  })

  it('returns false for non-strings', () => {
    expect(isFormatType(null)).toBe(false)
    expect(isFormatType(undefined)).toBe(false)
    expect(isFormatType(123)).toBe(false)
    expect(isFormatType({})).toBe(false)
  })
})