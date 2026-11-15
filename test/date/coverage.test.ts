import { describe, expect, it } from 'vitest'

import * as d from '../../src/date'

const INVALID = 'not a date'
const ZONES = [undefined, 'UTC', 'America/Mexico_City', 'Asia/Kolkata'] as const
const UNITS = [
  'year',
  'quarter',
  'month',
  'week',
  'isoWeek',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
] as const
const SET_UNITS = [
  'year',
  'quarter',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
] as const
const PATTERN =
  '[at] YYYY YY Q MMMM MMM MM M Do DDDD DDD DD D dddd ddd dd d E e ww w WW W gggg GGGG HH H hh h kk k mm m ss s SSS SS S A a X x ZZ Z zzz z LTS LT LLLL LLL LL L llll lll ll l'

describe('date module edge cases', () => {
  it('formats every token across zones, locales and invalid input', () => {
    for (const timeZone of ZONES) {
      for (const locale of ['en-US', 'es-MX', ['ja-JP'], undefined] as const) {
        const options = { ...(timeZone ? { timeZone } : {}), ...(locale ? { locale } : {}) }
        expect(d.formatDatePattern('2026-01-04T00:05:06.007Z', PATTERN, options)).not.toBe('')
        expect(d.formatDatePattern('2024-12-31T23:59:59.999Z', PATTERN, options)).not.toBe('')
      }
    }
    expect(d.formatDatePattern(INVALID, 'YYYY', { fallback: '—' })).toBe('—')
    expect(d.formatDatePattern(-62_198_755_200_000, 'YYYY Z')).toMatch(/^-/)
  })

  it('formats calendar phrases around a reference day', () => {
    const now = new Date('2026-03-11T12:00:00Z')
    for (const offset of [-8, -6, -1, 0, 1, 2, 6, 7, 30]) {
      const value = new Date(now.getTime() + offset * 86_400_000)
      for (const locale of ['en', 'es', 'de', 'fr']) {
        expect(d.formatCalendar(value, { now, locale, timeZone: 'UTC' })).not.toBe('')
      }
    }
    expect(d.formatCalendar(now, { now, sameElse: 'YYYY', timeZone: 'Asia/Kolkata' })).not.toBe('')
    expect(d.formatCalendar(INVALID, { fallback: 'x' })).toBe('x')
    expect(d.formatCalendar(now, { now: INVALID, fallback: 'y' })).toBe('y')
  })

  it('parses strict and loose formats, names and every failure', () => {
    const cases: Array<[string, string, Record<string, unknown>]> = [
      ['31/12/2026', 'DD/MM/YYYY', {}],
      ['1-2-26', 'D/M/YY', { strict: false }],
      ['3 de marzo de 2026', 'D [de] MMMM [de] YYYY', { locale: 'es' }],
      ['mar. 3, 2026', 'MMM D, YYYY', { locale: 'es', strict: false }],
      ['Tuesday 3rd March 2026 10:15:30.250 PM', 'dddd Do MMMM YYYY h:mm:ss.SSS A', {}],
      ['2026-03-03 22:15 +05:30', 'YYYY-MM-DD HH:mm Z', {}],
      ['2026-03-03 22:15 -0600', 'YYYY-MM-DD HH:mm ZZ', {}],
      ['1772500000', 'X', {}],
      ['1772500000123', 'x', {}],
      ['2026 Q2', 'YYYY [Q]Q', {}],
      ['2026-060', 'YYYY-DDDD', {}],
      ['12 am', 'h a', {}],
      ['3월 3 2026', 'MMMM D YYYY', { locale: 'ko', strict: false }],
    ]
    for (const [text, format, options] of cases) {
      expect(d.parseDate(text, { format, ...options })).toBeInstanceOf(Date)
      expect(
        d.parseDate(text, { format, timeZone: 'America/Mexico_City', ...options })
      ).toBeInstanceOf(Date)
    }
    for (const [text, format] of [
      ['31/02/2026', 'DD/MM/YYYY'],
      ['1/2/2026', 'DD/MM/YYYY'],
      ['2026-03-03x', 'YYYY-MM-DD'],
      ['Nope 3 2026', 'MMMM D YYYY'],
      ['25:00', 'HH:mm'],
      ['13 pm', 'h a'],
      ['2026', 'YYYY-MM'],
      ['ab', '[cd]'],
    ] as Array<[string, string]>) {
      expect(d.isValidDate(d.parseDate(text, { format }))).toBe(false)
    }
    expect(d.parseDate('31/12/2026', { format: ['YYYY-MM-DD', 'DD/MM/YYYY'] })).toBeInstanceOf(Date)
    for (const value of [
      new Date(0),
      0,
      '2026-03-03',
      '2026-03-03T10:00',
      '',
      null,
      undefined,
      {},
    ]) {
      d.parseDate(value as never)
      d.isValidDate(value as never)
    }
  })

  it('adds, rounds and sets every unit in every zone', () => {
    const base = '2026-03-08T07:30:00.000Z'
    for (const timeZone of ZONES) {
      const options = timeZone ? { timeZone } : {}
      for (const unit of UNITS) {
        expect(d.isValidDate(d.startOfDate(base, unit, options))).toBe(true)
        expect(d.isValidDate(d.endOfDate(base, unit, options))).toBe(true)
        d.addDate(base, 1.5, unit as never, options)
        d.subtractDate(base, 2, unit as never, options)
      }
      for (const unit of SET_UNITS) d.setDateUnit(base, unit, 3, options)
      d.addDate(
        base,
        {
          years: 1,
          months: -1,
          weeks: 1,
          days: 1,
          hours: 1,
          minutes: 1,
          seconds: 1,
          milliseconds: 1,
        } as never,
        options
      )
      d.subtractDate(base, { months: 13 } as never, options)
    }
    expect(d.isValidDate(d.addDate(INVALID, 1, 'day'))).toBe(false)
    expect(d.isValidDate(d.startOfDate(INVALID, 'day'))).toBe(false)
    expect(d.isValidDate(d.endOfDate(INVALID, 'day'))).toBe(false)
    expect(d.isValidDate(d.setDateUnit(INVALID, 'day', 1))).toBe(false)
    expect(d.isValidDate(d.setDateUnit(base, 'day', Number.NaN))).toBe(false)
    expect(d.isValidDate(d.addDate(base, Number.NaN, 'day'))).toBe(false)
    expect(d.addDate('2026-01-31', 1, 'month').getDate()).toBeLessThanOrEqual(29)
  })

  it('compares, measures and queries dates', () => {
    const a = '2024-02-29T10:00:00Z'
    const b = '2026-03-08T07:30:00Z'
    for (const unit of [undefined, ...UNITS]) {
      for (const float of [false, true]) {
        d.diffDate(b, a, unit as never, { float })
        d.diffDate(a, b, unit as never, { float, timeZone: 'Asia/Kolkata' })
      }
      d.isSameDate(a, b, unit as never, { timeZone: 'UTC' })
      d.isBeforeDate(a, b, unit as never)
      d.isAfterDate(a, b, unit as never)
      d.isSameOrBeforeDate(a, b, unit as never)
      d.isSameOrAfterDate(a, b, unit as never)
    }
    expect(Number.isNaN(d.diffDate(INVALID, a))).toBe(true)
    expect(d.isBeforeDate(INVALID, a)).toBe(false)
    expect(d.isSameDate(INVALID, a)).toBe(false)
    for (const inclusivity of ['()', '[]', '[)', '(]'] as const) {
      d.isBetweenDate(a, a, b, { inclusivity })
      d.isBetweenDate(b, a, b, { inclusivity, unit: 'day' })
      d.isBetweenDate(b, b, a, { inclusivity })
    }
    expect(d.isBetweenDate(INVALID, a, b)).toBe(false)
    expect(d.minDate()).toBeUndefined()
    expect(d.maxDate([], INVALID)).toBeUndefined()
    expect(d.minDate([a, b], INVALID)!.toISOString()).toBe(new Date(a).toISOString())
    expect(d.maxDate(a, [b])!.toISOString()).toBe(new Date(b).toISOString())
    d.clampDate(a, b)
    d.clampDate(b, undefined, a)
    d.clampDate(a)
    expect(d.isValidDate(d.clampDate(INVALID, a, b))).toBe(false)
    for (const timeZone of ZONES) {
      const options = timeZone ? { timeZone } : {}
      for (const value of [a, b, '2020-12-31T12:00:00Z', '2021-01-03T12:00:00Z', INVALID]) {
        d.isLeapYear(value, options)
        d.daysInMonth(value, options)
        d.dayOfYear(value, options)
        d.quarter(value, options)
        d.weekOfYear(value, { ...options, locale: 'en-US' } as never)
        d.weekYear(value, { ...options, locale: 'de-DE' } as never)
        d.isoWeek(value, options)
        d.isoWeekYear(value, options)
        d.isoWeeksInYear(value, options)
        d.isWeekend(value, { ...options, locale: 'ar-EG' } as never)
        d.isToday(value, { ...options, now: a })
        d.isTomorrow(value, { ...options, now: a })
        d.isYesterday(value, options)
      }
    }
    for (const locale of [undefined, 'en-US', 'ar-EG', ['he-IL']]) {
      expect(() => d.getWeekInfo(locale as never)).not.toThrow()
    }
  })

  it('creates and reads zoned dates and unix seconds', () => {
    expect(d.getTimeZone()).toBeTruthy()
    for (const timeZone of ZONES) {
      const options = timeZone ? { timeZone } : {}
      d.getTimeZoneOffset('2026-07-01T00:00:00Z', options)
      d.getDateParts('2026-07-01T00:00:00Z', options)
      d.createDate({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, options)
      d.createDate({ year: 2026 }, options)
      d.toUnix('2026-07-01T00:00:00Z', options)
    }
    expect(Number.isNaN(d.getTimeZoneOffset(INVALID))).toBe(true)
    expect(d.getDateParts(INVALID)).toBeUndefined()
    expect(d.isValidDate(d.createDate({ year: Number.NaN } as never))).toBe(false)
    expect(d.isValidDate(d.createDate({ year: 2026, month: 2, day: 31 } as never))).toBe(true)
    expect(Number.isNaN(d.toUnix(INVALID))).toBe(true)
    expect(d.fromUnix(1).getTime()).toBe(1000)
  })

  it('creates, converts, formats and humanizes durations', () => {
    const inputs = [
      0,
      -90_061_001,
      3_723_004,
      'P1Y2M3W4DT5H6M7.5S',
      'PT0S',
      '-P1D',
      'P',
      'garbage',
      { years: 1, months: 2, days: -3, hours: 4, minutes: 5, seconds: 6, milliseconds: 7 },
      { weeks: 2 },
      { days: Number.NaN },
      Number.POSITIVE_INFINITY,
    ]
    for (const input of inputs) {
      d.createDuration(input as never)
      for (const unit of [
        'year',
        'month',
        'week',
        'day',
        'hour',
        'minute',
        'second',
        'millisecond',
      ] as const) {
        d.durationAs(input as never, unit)
      }
      d.durationToISO(input as never)
      for (const style of ['long', 'short', 'narrow', 'digital'] as const) {
        d.formatDuration(input as never, { style, locale: 'es', fallback: '-' } as never)
      }
      for (const withSuffix of [false, true]) {
        d.humanizeDuration(input as never, { withSuffix, locale: 'en', fallback: '?' })
        d.humanizeDuration(input as never, { withSuffix, style: 'narrow' } as never)
      }
      d.formatDurationPattern(input as never, 'Y M W D H HH m mm s ss SSS [literal]' as never)
    }
    for (const seconds of [
      1, 44, 45, 89, 90, 2_700, 5_400, 79_200, 129_600, 2_160_000, 3_000_000, 27_000_000,
      47_000_000, 90_000_000,
    ]) {
      d.humanizeDuration(seconds * 1000, { withSuffix: true })
      d.humanizeDuration(-seconds * 1000, { withSuffix: true })
    }
  })
})
