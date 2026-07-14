import { describe, it, expect } from 'vitest'
import { format, FORMAT_TYPES, isFormatType } from '../../src/core/formatter'

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
    it('formats a raw ISO date to display pattern (d/m/Y by default)', () => {
      const result = format('2026-05-12', 'date')
      expect(result.type).toBe('date')
      expect(result.formatted).toBe('12/05/2026')
    })

    it('returns raw value in Y-m-d order (round-trip from formatted display)', () => {
      const result = format('2026-05-12', 'date')
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
      // same and protects consumers that depend on it.
      const result = format('2026-05-12', 'date')
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
      // by passing dateRawPattern + dateRawPatternDelimiter explicitly.
      const result = format('2026-05-12', 'date', {
        datePattern: ['d', 'm', 'Y'],
        delimiter: '/',
        dateRawPattern: ['Y', 'm', 'd'],
        dateRawPatternDelimiter: '-'
      })
      expect(result.formatted).toBe('12/05/2026')
      expect(result.raw).toBe('2026-05-12')
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