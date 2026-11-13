import { describe, expect, it } from 'vitest'
import {
  addDate,
  clampDate,
  createDate,
  createDuration,
  dayOfYear,
  daysInMonth,
  diffDate,
  durationAs,
  durationToISO,
  endOfDate,
  formatCalendar,
  formatDatePattern,
  formatDuration,
  formatDurationPattern,
  formatRelativeTime,
  fromUnix,
  getDateParts,
  getTimeZone,
  getTimeZoneOffset,
  getWeekInfo,
  humanizeDuration,
  isAfterDate,
  isBeforeDate,
  isBetweenDate,
  isLeapYear,
  isoWeek,
  isoWeeksInYear,
  isoWeekYear,
  isSameDate,
  isSameOrAfterDate,
  isSameOrBeforeDate,
  isToday,
  isTomorrow,
  isValidDate,
  isWeekend,
  isYesterday,
  maxDate,
  minDate,
  parseDate,
  quarter,
  setDateUnit,
  startOfDate,
  subtractDate,
  toUnix,
  weekOfYear,
  weekYear,
} from '../../src/date/index.js'

const UTC = { timeZone: 'UTC' } as const
const NY = { timeZone: 'America/New_York' } as const
const iso = (date: Date | undefined): string | undefined => date?.toISOString()
const utc = (text: string): Date => new Date(`${text}Z`)

describe('reading dates', () => {
  it('reads ISO strings without an offset as a wall clock in the zone', () => {
    expect(iso(parseDate('2026-11-12', UTC))).toBe('2026-11-12T00:00:00.000Z')
    expect(iso(parseDate('2026-11-12 09:30', NY))).toBe('2026-11-12T14:30:00.000Z')
    expect(iso(parseDate('2026-11-12T09:30:15.250', UTC))).toBe('2026-11-12T09:30:15.250Z')
    const local = parseDate('2026-11-12')!
    expect([local.getFullYear(), local.getMonth(), local.getDate(), local.getHours()]).toEqual([
      2026, 10, 12, 0,
    ])
  })

  it('reads instants with an offset exactly, plus Date values and timestamps', () => {
    expect(iso(parseDate('2026-11-12T09:30:00-06:00', NY))).toBe('2026-11-12T15:30:00.000Z')
    expect(iso(parseDate(Date.UTC(2026, 0, 1)))).toBe('2026-01-01T00:00:00.000Z')
    const date = new Date()
    expect(parseDate(date)).not.toBe(date)
  })

  it('rejects impossible days and empty values', () => {
    expect(parseDate('2026-02-30')).toBeUndefined()
    expect(parseDate('2026-13-01')).toBeUndefined()
    expect(parseDate('nope')).toBeUndefined()
    expect(parseDate('')).toBeUndefined()
    expect(parseDate(null)).toBeUndefined()
    expect(isValidDate('2024-02-29')).toBe(true)
    expect(isValidDate('2025-02-29')).toBe(false)
    expect(isValidDate(new Date(NaN))).toBe(false)
  })
})

describe('parseDate with a format', () => {
  const format = (text: string, pattern: string | string[], options = {}) =>
    iso(parseDate(text, { format: pattern, ...UTC, ...options }))

  it('reads numbers at their full width in strict mode', () => {
    expect(format('12/11/2026', 'DD/MM/YYYY')).toBe('2026-11-12T00:00:00.000Z')
    expect(format('1/2/2026', 'DD/MM/YYYY')).toBeUndefined()
    expect(format('12/11/2026 extra', 'DD/MM/YYYY')).toBeUndefined()
    expect(format('31/02/2026', 'DD/MM/YYYY')).toBeUndefined()
    expect(format('20261112', 'YYYYMMDD')).toBe('2026-11-12T00:00:00.000Z')
    expect(format('12-11-26', 'DD-MM-YY')).toBe('2026-11-12T00:00:00.000Z')
    expect(format('12-11-99', 'DD-MM-YY')).toBe('1999-11-12T00:00:00.000Z')
  })

  it('accepts short numbers and any separator in loose mode', () => {
    expect(format('1-2-2026', 'DD/MM/YYYY', { strict: false })).toBe('2026-02-01T00:00:00.000Z')
    expect(format(' 1 / 2 / 2026 ', 'DD/MM/YYYY', { strict: false })).toBe(
      '2026-02-01T00:00:00.000Z'
    )
    expect(format('31-02-2026', 'DD/MM/YYYY', { strict: false })).toBeUndefined()
  })

  it('reads month names, weekdays and day periods in the locale', () => {
    const es = { locale: 'es-MX' }
    expect(format('5 de marzo de 2026', 'D [de] MMMM [de] YYYY', es)).toBe(
      '2026-03-05T00:00:00.000Z'
    )
    expect(format('5 de MARZO de 2026', 'D [de] MMMM [de] YYYY', es)).toBe(
      '2026-03-05T00:00:00.000Z'
    )
    expect(format('jueves 12 nov 2026', 'dddd D MMM YYYY', es)).toBe('2026-11-12T00:00:00.000Z')
    expect(format('lunes 12 nov 2026', 'dddd D MMM YYYY', es)).toBeUndefined()
    expect(format('March 5th, 2026 3:30 PM', 'MMMM Do, YYYY h:mm A', { locale: 'en-US' })).toBe(
      '2026-03-05T15:30:00.000Z'
    )
    expect(format('12:15 a.m.', 'hh:mm a', es)).toMatch(/T00:15:00.000Z$/)
    expect(format('12 ноября 2026', 'D MMMM YYYY', { locale: 'ru' })).toBe(
      '2026-11-12T00:00:00.000Z'
    )
  })

  it('reads times, fractions, offsets and Unix timestamps', () => {
    expect(format('2026-11-12 23:59:58.5', 'YYYY-MM-DD HH:mm:ss.S')).toBe(
      '2026-11-12T23:59:58.500Z'
    )
    expect(format('2026-11-12T09:00:00+05:30', 'YYYY-MM-DDTHH:mm:ssZ')).toBe(
      '2026-11-12T03:30:00.000Z'
    )
    expect(format('2026-11-12 0900 -0600', 'YYYY-MM-DD HHmm ZZ')).toBe('2026-11-12T15:00:00.000Z')
    expect(format('1789200000', 'X')).toBe('2026-09-12T08:00:00.000Z')
    expect(format('24:00', 'kk:mm')).toMatch(/T00:00:00.000Z$/)
    expect(format('25:00', 'HH:mm')).toBeUndefined()
    expect(format('13:00 PM', 'hh:mm A')).toBeUndefined()
  })

  it('fills a missing date from today and tries several formats', () => {
    const today = getDateParts(new Date(), UTC)!
    const time = parseDate('08:15', { format: 'HH:mm', ...UTC })!
    expect(getDateParts(time, UTC)).toMatchObject({
      year: today.year,
      month: today.month,
      day: today.day,
      hour: 8,
      minute: 15,
    })
    expect(format('2026-11-12', ['DD/MM/YYYY', 'YYYY-MM-DD'])).toBe('2026-11-12T00:00:00.000Z')
    expect(format('059 2026', 'DDDD YYYY')).toBe('2026-02-28T00:00:00.000Z')
    expect(format('2026 Q3', 'YYYY [Q]Q')).toBe('2026-07-01T00:00:00.000Z')
  })

  it('rejects wall times skipped by daylight saving in strict mode', () => {
    expect(parseDate('2026-03-08 02:30', { format: 'YYYY-MM-DD HH:mm', ...NY })).toBeUndefined()
    expect(
      iso(parseDate('2026-03-08 02:30', { format: 'YYYY-MM-DD HH:mm', strict: false, ...NY }))
    ).toBe('2026-03-08T07:30:00.000Z')
    expect(parseDate('2026', { format: 'LL' })).toBeUndefined()
  })
})

describe('formatDatePattern', () => {
  const date = utc('2026-11-12T15:04:05.678')
  const at = (pattern: string, options = {}) =>
    formatDatePattern(date, pattern, { ...UTC, ...options })

  it('prints numbers, names and literals', () => {
    expect(at('YYYY-MM-DD HH:mm:ss.SSS')).toBe('2026-11-12 15:04:05.678')
    expect(at('YY M D H m s S SS')).toBe('26 11 12 15 4 5 6 67')
    expect(at('dddd, D [de] MMMM [de] YYYY', { locale: 'es-MX' })).toBe(
      'jueves, 12 de noviembre de 2026'
    )
    expect(at('ddd dd d E MMM', { locale: 'en-US' })).toBe('Thu Th 4 4 Nov')
    expect(at('[Today is] dddd', { locale: 'en-US' })).toBe('Today is Thursday')
    expect(at('h:mm A hh a k kk', { locale: 'en-US' })).toBe('3:04 PM 03 pm 15 15')
    expect(at('Q DDD DDDD X x')).toBe(
      `4 316 316 ${Math.floor(date.getTime() / 1000)} ${date.getTime()}`
    )
  })

  it('uses the grammatical month form next to a day', () => {
    expect(at('D MMMM', { locale: 'ru' })).toBe('12 ноября')
    expect(at('MMMM YYYY', { locale: 'ru' })).toBe('ноябрь 2026')
  })

  it('prints ordinals per language', () => {
    const day = (value: number, locale: string) =>
      formatDatePattern(utc(`2026-11-${String(value).padStart(2, '0')}T12:00`), 'Do', {
        ...UTC,
        locale,
      })
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23].map(value => day(value, 'en'))).toEqual([
      '1st',
      '2nd',
      '3rd',
      '4th',
      '11th',
      '12th',
      '13th',
      '21st',
      '22nd',
      '23rd',
    ])
    expect([day(1, 'es'), day(1, 'fr'), day(2, 'fr'), day(3, 'de'), day(4, 'ja')]).toEqual([
      '1º',
      '1er',
      '2',
      '3.',
      '4日',
    ])
  })

  it('prints weeks, offsets and time-zone names', () => {
    expect(formatDatePattern('2025-12-29', 'W WW GGGG', UTC)).toBe('1 01 2026')
    expect(formatDatePattern('2026-01-01', 'w ww gggg', { ...UTC, locale: 'en-US' })).toBe(
      '1 01 2026'
    )
    expect(formatDatePattern(date, 'HH:mm Z ZZ', { timeZone: 'Asia/Kolkata' })).toBe(
      '20:34 +05:30 +0530'
    )
    expect(
      formatDatePattern(date, 'HH:mm Z z', { timeZone: 'America/Mexico_City', locale: 'en-US' })
    ).toBe('09:04 -06:00 CST')
    expect(
      formatDatePattern(date, 'zzz', { timeZone: 'America/Mexico_City', locale: 'en-US' })
    ).toBe('Central Standard Time')
  })

  it('prints the locale formats from Intl', () => {
    const en = { locale: 'en-US' }
    expect(at('L', en)).toBe('11/12/2026')
    expect(at('L', { locale: 'es-MX' })).toBe('12/11/2026')
    expect(at('LL', en)).toBe('November 12, 2026')
    expect(at('ll', en)).toBe('Nov 12, 2026')
    expect(at('LT', en)).toBe('3:04 PM')
    expect(at('LLLL', en)).toMatch(/^Thursday, November 12, 2026(,| at) 3:04 PM$/)
  })

  it('defaults to ISO 8601 and never prints Invalid Date', () => {
    expect(formatDatePattern(date, undefined, UTC)).toBe('2026-11-12T15:04:05+00:00')
    expect(formatDatePattern('nope', 'YYYY')).toBe('')
    expect(formatDatePattern('nope', 'YYYY', { fallback: '—' })).toBe('—')
    expect(formatDatePattern(null, 'YYYY', { fallback: '—' })).toBe('')
    expect(
      formatDatePattern(createDate({ year: 5, month: 3, day: 1 }, UTC), 'YYYY-MM-DD', UTC)
    ).toBe('0005-03-01')
  })
})

describe('adding and setting', () => {
  it('keeps the day inside shorter months', () => {
    expect(iso(addDate('2026-01-31', 1, 'month', UTC))).toBe('2026-02-28T00:00:00.000Z')
    expect(iso(addDate('2024-01-31', 1, 'month', UTC))).toBe('2024-02-29T00:00:00.000Z')
    expect(iso(addDate('2024-02-29', 1, 'year', UTC))).toBe('2025-02-28T00:00:00.000Z')
    expect(iso(addDate('2026-01-31', 1, 'quarter', UTC))).toBe('2026-04-30T00:00:00.000Z')
    expect(iso(subtractDate('2026-03-31', 1, 'month', UTC))).toBe('2026-02-28T00:00:00.000Z')
    expect(iso(addDate('2026-12-15', 1, 'month', UTC))).toBe('2027-01-15T00:00:00.000Z')
    expect(iso(addDate('2026-01-15', -13, 'months' as 'month', UTC))).toBe(
      '2024-12-15T00:00:00.000Z'
    )
  })

  it('adds calendar days across daylight saving and exact hours', () => {
    const nine = createDate({ year: 2026, month: 3, day: 7, hour: 9 }, NY)
    expect(iso(addDate(nine, 1, 'day', NY))).toBe('2026-03-08T13:00:00.000Z')
    expect(iso(addDate(nine, 24, 'hour', NY))).toBe('2026-03-08T14:00:00.000Z')
    expect(iso(addDate(nine, 2, 'week', NY))).toBe('2026-03-21T13:00:00.000Z')
    expect(iso(addDate('2026-11-12', 90, 'minute', UTC))).toBe('2026-11-12T01:30:00.000Z')
  })

  it('adds durations, larger units first', () => {
    expect(iso(addDate('2026-01-31', { months: 1, days: 1, hours: 2 }, UTC))).toBe(
      '2026-03-01T02:00:00.000Z'
    )
    expect(iso(subtractDate('2026-03-01', { days: 1 }, UTC))).toBe('2026-02-28T00:00:00.000Z')
  })

  it('never changes its input and propagates invalid dates', () => {
    const input = utc('2026-11-12T00:00')
    addDate(input, 1, 'day')
    expect(input.toISOString()).toBe('2026-11-12T00:00:00.000Z')
    expect(Number.isNaN(addDate('nope', 1, 'day').getTime())).toBe(true)
    expect(() => addDate(input, 1, 'fortnight' as never)).toThrow(RangeError)
  })

  it('sets units with clamping and roll-over', () => {
    expect(iso(setDateUnit('2026-01-31', 'month', 2, UTC))).toBe('2026-02-28T00:00:00.000Z')
    expect(iso(setDateUnit('2026-01-31', 'day', 32, UTC))).toBe('2026-02-01T00:00:00.000Z')
    expect(iso(setDateUnit('2024-02-29', 'year', 2025, UTC))).toBe('2025-02-28T00:00:00.000Z')
    expect(iso(setDateUnit('2026-11-12', 'weekday', 0, UTC))).toBe('2026-11-08T00:00:00.000Z')
    expect(iso(setDateUnit('2026-11-12', 'isoWeekday', 7, UTC))).toBe('2026-11-15T00:00:00.000Z')
    expect(iso(setDateUnit('2026-11-12', 'dayOfYear', 60, UTC))).toBe('2026-03-01T00:00:00.000Z')
    expect(iso(setDateUnit('2026-11-12', 'quarter', 1, UTC))).toBe('2026-02-12T00:00:00.000Z')
    expect(iso(setDateUnit('2026-11-12T10:20:30.400', 'hour', 23, UTC))).toBe(
      '2026-11-12T23:20:30.400Z'
    )
  })
})

describe('start and end of units', () => {
  const at = utc('2026-11-12T15:04:05.678')
  it('rounds to every unit', () => {
    expect(iso(startOfDate(at, 'year', UTC))).toBe('2026-01-01T00:00:00.000Z')
    expect(iso(startOfDate(at, 'quarter', UTC))).toBe('2026-10-01T00:00:00.000Z')
    expect(iso(startOfDate(at, 'month', UTC))).toBe('2026-11-01T00:00:00.000Z')
    expect(iso(startOfDate(at, 'day', UTC))).toBe('2026-11-12T00:00:00.000Z')
    expect(iso(startOfDate(at, 'hour', UTC))).toBe('2026-11-12T15:00:00.000Z')
    expect(iso(startOfDate(at, 'minute', UTC))).toBe('2026-11-12T15:04:00.000Z')
    expect(iso(startOfDate(at, 'second', UTC))).toBe('2026-11-12T15:04:05.000Z')
    expect(iso(endOfDate(at, 'month', UTC))).toBe('2026-11-30T23:59:59.999Z')
    expect(iso(endOfDate('2024-02-10', 'month', UTC))).toBe('2024-02-29T23:59:59.999Z')
    expect(iso(endOfDate(at, 'year', UTC))).toBe('2026-12-31T23:59:59.999Z')
    expect(iso(endOfDate(at, 'hour', UTC))).toBe('2026-11-12T15:59:59.999Z')
  })

  it('starts weeks on the locale first day, or Monday for ISO weeks', () => {
    expect(iso(startOfDate(at, 'week', { ...UTC, locale: 'en-US' }))).toBe(
      '2026-11-08T00:00:00.000Z'
    )
    expect(iso(startOfDate(at, 'week', { ...UTC, locale: 'es-ES' }))).toBe(
      '2026-11-09T00:00:00.000Z'
    )
    expect(iso(startOfDate(at, 'week', { ...UTC, weekStart: 6 }))).toBe('2026-11-07T00:00:00.000Z')
    expect(iso(startOfDate(at, 'isoWeek', UTC))).toBe('2026-11-09T00:00:00.000Z')
    expect(iso(endOfDate(at, 'isoWeek', UTC))).toBe('2026-11-15T23:59:59.999Z')
  })

  it('works in a zone with a half-hour offset and across daylight saving', () => {
    // 15:04 UTC is 20:34 on November 12 in India.
    expect(iso(startOfDate(at, 'day', { timeZone: 'Asia/Kolkata' }))).toBe(
      '2026-11-11T18:30:00.000Z'
    )
    expect(iso(startOfDate(at, 'hour', { timeZone: 'Asia/Kolkata' }))).toBe(
      '2026-11-12T14:30:00.000Z'
    )
    // March 8, 2026 in New York has 23 hours.
    const start = startOfDate('2026-03-08T12:00', 'day', NY)
    const end = endOfDate('2026-03-08T12:00', 'day', NY)
    expect((end.getTime() + 1 - start.getTime()) / 3_600_000).toBe(23)
  })
})

describe('differences and comparisons', () => {
  it('measures calendar units like a person would', () => {
    expect(diffDate('2026-12-24', '2026-12-20', 'day', UTC)).toBe(4)
    expect(diffDate('2026-12-20', '2026-12-24', 'days' as 'day', UTC)).toBe(-4)
    expect(diffDate('2026-03-31', '2026-01-31', 'month', UTC)).toBe(2)
    // Jan 31 + 1 month is Feb 28, so that is one whole month.
    expect(diffDate('2026-02-28', '2026-01-31', 'month', UTC)).toBe(1)
    expect(diffDate('2026-02-27', '2026-01-31', 'month', UTC)).toBe(0)
    expect(diffDate('2026-03-01', '2026-01-31', 'month', { ...UTC, float: true })).toBeCloseTo(
      1 + 1 / 31,
      5
    )
    expect(diffDate('2027-11-12', '2026-11-12', 'year', UTC)).toBe(1)
    expect(diffDate('2026-11-12', '2026-05-12', 'quarter', UTC)).toBe(2)
    expect(diffDate('2026-11-12T12:00', '2026-11-12T10:30', 'hour', { ...UTC, float: true })).toBe(
      1.5
    )
    expect(diffDate('2026-11-12T00:00:01', '2026-11-12', undefined, UTC)).toBe(1000)
    expect(Number.isNaN(diffDate('nope', '2026-01-01'))).toBe(true)
  })

  it('counts a daylight-saving day as one day', () => {
    const before = createDate({ year: 2026, month: 3, day: 8 }, NY)
    const after = createDate({ year: 2026, month: 3, day: 9 }, NY)
    expect(diffDate(after, before, 'day', NY)).toBe(1)
    expect(diffDate(after, before, 'hour', NY)).toBe(23)
  })

  it('compares instants and whole units', () => {
    expect(isBeforeDate('2026-11-12T23:00', '2026-11-13', 'day', UTC)).toBe(true)
    expect(isBeforeDate('2026-11-12T23:00', '2026-11-12T23:30', 'day', UTC)).toBe(false)
    expect(isAfterDate('2026-11-13', '2026-11-12T23:00', 'day', UTC)).toBe(true)
    expect(isAfterDate('2026-11-12', '2026-11-11')).toBe(true)
    expect(isSameDate('2026-11-12T01:00', '2026-11-12T23:00', 'day', UTC)).toBe(true)
    expect(isSameDate('2026-11-12', '2026-12-12', 'month', UTC)).toBe(false)
    expect(isSameDate('2026-11-12', '2026-11-12')).toBe(true)
    expect(isSameOrBeforeDate('2026-11-12', '2026-11-12')).toBe(true)
    expect(isSameOrAfterDate('2026-11-11', '2026-11-12')).toBe(false)
    expect(isBeforeDate('nope', '2026-11-12')).toBe(false)
  })

  it('checks ranges with inclusivity', () => {
    expect(isBetweenDate('2026-11-12', '2026-11-01', '2026-11-30')).toBe(true)
    expect(isBetweenDate('2026-11-12', '2026-11-30', '2026-11-01')).toBe(true)
    expect(isBetweenDate('2026-11-01', '2026-11-01', '2026-11-30')).toBe(false)
    expect(isBetweenDate('2026-11-01', '2026-11-01', '2026-11-30', { inclusivity: '[]' })).toBe(
      true
    )
    expect(
      isBetweenDate('2026-11-30T18:00', '2026-11-01', '2026-11-30', {
        inclusivity: '[]',
        unit: 'day',
        ...UTC,
      })
    ).toBe(true)
  })

  it('finds the earliest, latest and clamped dates', () => {
    expect(iso(minDate('2026-11-12', 'nope', ['2026-01-01', '2026-06-01'] as never))).toBe(
      iso(parseDate('2026-01-01'))
    )
    expect(iso(maxDate(['2026-11-12', '2027-01-01']))).toBe(iso(parseDate('2027-01-01')))
    expect(minDate()).toBeUndefined()
    expect(iso(clampDate('2027-05-01', '2026-01-01', '2026-12-31'))).toBe(
      iso(parseDate('2026-12-31'))
    )
    expect(iso(clampDate('2025-05-01', '2026-01-01'))).toBe(iso(parseDate('2026-01-01')))
  })
})

describe('calendar facts', () => {
  it('knows leap years, month lengths, days of year and quarters', () => {
    expect([
      isLeapYear(2024),
      isLeapYear(1900),
      isLeapYear(2000),
      isLeapYear('2026-01-01'),
    ]).toEqual([true, false, true, false])
    expect([
      daysInMonth('2024-02-01'),
      daysInMonth('2026-02-01'),
      daysInMonth('2026-04-10'),
    ]).toEqual([29, 28, 30])
    expect([dayOfYear('2026-01-01'), dayOfYear('2024-12-31'), quarter('2026-11-12')]).toEqual([
      1, 366, 4,
    ])
  })

  it('numbers ISO weeks', () => {
    expect([isoWeek('2025-12-29'), isoWeekYear('2025-12-29')]).toEqual([1, 2026])
    expect([isoWeek('2021-01-03'), isoWeekYear('2021-01-03')]).toEqual([53, 2020])
    expect([
      isoWeek('2026-11-12'),
      isoWeeksInYear(2026),
      isoWeeksInYear(2020),
      isoWeeksInYear(2025),
    ]).toEqual([46, 53, 53, 52])
  })

  it('numbers locale weeks', () => {
    expect([
      weekOfYear('2026-01-01', { locale: 'en-US' }),
      weekOfYear('2025-12-28', { locale: 'en-US' }),
    ]).toEqual([1, 1])
    expect(weekYear('2025-12-28', { locale: 'en-US' })).toBe(2026)
    expect(weekOfYear('2026-01-01', { locale: 'de-DE' })).toBe(1)
    expect(weekOfYear('2027-01-01', { locale: 'de-DE' })).toBe(53)
    expect(weekOfYear('2027-01-01', { weekStart: 1, minimalDays: 4 })).toBe(53)
  })

  it('reads week rules from the locale', () => {
    expect(getWeekInfo('en-US')).toMatchObject({ firstDay: 0, minimalDays: 1 })
    expect(getWeekInfo('es-MX')).toMatchObject({ firstDay: 0, minimalDays: 1 })
    expect(getWeekInfo('de-DE')).toMatchObject({ firstDay: 1, minimalDays: 4 })
    expect(getWeekInfo('es-ES')).toMatchObject({ firstDay: 1, minimalDays: 4 })
    expect(isWeekend('2026-11-14', { locale: 'en-US' })).toBe(true)
    expect(isWeekend('2026-11-12', { locale: 'en-US' })).toBe(false)
  })

  it('falls back to CLDR week data where Intl.Locale has none (Firefox)', () => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>
    const saved = ['getWeekInfo', 'weekInfo'].map(
      key => [key, Object.getOwnPropertyDescriptor(proto, key)] as const
    )
    for (const [key] of saved)
      Object.defineProperty(proto, key, { value: undefined, configurable: true })
    try {
      expect(getWeekInfo('ar-EG')).toEqual({ firstDay: 6, minimalDays: 1, weekend: [5, 6] })
      expect(getWeekInfo('pt-BR')).toEqual({ firstDay: 0, minimalDays: 1, weekend: [6, 0] })
      expect(getWeekInfo('fr-FR')).toEqual({ firstDay: 1, minimalDays: 4, weekend: [6, 0] })
    } finally {
      for (const [key, descriptor] of saved) {
        if (descriptor) Object.defineProperty(proto, key, descriptor)
        else delete proto[key]
      }
    }
  })

  it('knows today, tomorrow and yesterday', () => {
    const now = '2026-11-12T23:30'
    expect(isToday('2026-11-12T00:01', { now, ...UTC })).toBe(true)
    expect(isTomorrow('2026-11-13T22:00', { now, ...UTC })).toBe(true)
    expect(isYesterday('2026-11-11', { now, ...UTC })).toBe(true)
    expect(isToday('2026-11-13', { now, ...UTC })).toBe(false)
    expect(isToday(new Date())).toBe(true)
  })
})

describe('time zones', () => {
  it('builds wall clocks in any zone', () => {
    expect(
      iso(createDate({ year: 2026, month: 12, day: 24, hour: 20 }, { timeZone: 'America/Cancun' }))
    ).toBe('2026-12-25T01:00:00.000Z')
    expect(iso(createDate({ year: 2026, month: 13, day: 1 }, UTC))).toBe('2027-01-01T00:00:00.000Z')
    expect(Number.isNaN(createDate({ year: Number.NaN }).getTime())).toBe(true)
  })

  it('resolves skipped and repeated hours like Date and Temporal', () => {
    expect(iso(createDate({ year: 2026, month: 3, day: 8, hour: 2, minute: 30 }, NY))).toBe(
      '2026-03-08T07:30:00.000Z'
    )
    expect(iso(createDate({ year: 2026, month: 11, day: 1, hour: 1, minute: 30 }, NY))).toBe(
      '2026-11-01T05:30:00.000Z'
    )
  })

  it('reads parts and offsets', () => {
    expect(getDateParts(utc('2026-07-01T12:00'), { timeZone: 'Asia/Kolkata' })).toEqual({
      year: 2026,
      month: 7,
      day: 1,
      hour: 17,
      minute: 30,
      second: 0,
      millisecond: 0,
      weekday: 3,
      offset: 330,
    })
    expect(getTimeZoneOffset(utc('2026-07-01T12:00'), { timeZone: 'Europe/Madrid' })).toBe(120)
    expect(getTimeZoneOffset(utc('2026-01-01T12:00'), { timeZone: 'Europe/Madrid' })).toBe(60)
    expect(getDateParts('nope')).toBeUndefined()
    expect(typeof getTimeZone()).toBe('string')
    expect(() => getDateParts(new Date(), { timeZone: 'Mars/Base' })).toThrow(RangeError)
  })

  it('converts Unix seconds', () => {
    expect(iso(fromUnix(1_789_200_000.5))).toBe('2026-09-12T08:00:00.500Z')
    expect(toUnix(utc('2026-09-12T08:00:00.900'))).toBe(1_789_200_000)
    expect(Number.isNaN(toUnix('nope'))).toBe(true)
  })
})

describe('calendar labels and relative time', () => {
  const now = utc('2026-11-12T15:00')
  const en = { locale: 'en-US', now, ...UTC }
  it('labels nearby days in words and the rest as a date', () => {
    expect(formatCalendar(utc('2026-11-12T09:30'), en)).toBe('Today at 9:30 AM')
    expect(formatCalendar(utc('2026-11-13T09:30'), en)).toBe('Tomorrow at 9:30 AM')
    expect(formatCalendar(utc('2026-11-11T09:30'), en)).toBe('Yesterday at 9:30 AM')
    expect(formatCalendar(utc('2026-11-16T09:30'), en)).toBe('Monday at 9:30 AM')
    expect(formatCalendar(utc('2026-11-01T09:30'), en)).toBe('11/01/2026')
    expect(formatCalendar(utc('2026-11-01T09:30'), { ...en, sameElse: 'LL' })).toBe(
      'November 1, 2026'
    )
    expect(formatCalendar(utc('2026-11-13T09:30'), { ...en, locale: 'es-MX' })).toMatch(
      /^Mañana, 9:30/
    )
    expect(formatCalendar('nope', { ...en, fallback: '—' })).toBe('—')
  })

  it('reuses formatRelativeTime from the Intl helpers', () => {
    expect(formatRelativeTime(utc('2026-11-09T15:00'), { locale: 'es-MX', now })).toBe(
      'hace 3 días'
    )
  })
})

describe('durations', () => {
  it('creates durations from milliseconds, ISO strings and objects', () => {
    expect(createDuration(90_061_001)).toEqual({
      years: 0,
      months: 0,
      weeks: 0,
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1,
      milliseconds: 1,
    })
    expect(createDuration(-3_600_000)).toMatchObject({ hours: -1, days: 0 })
    expect(createDuration('P1Y2M3W4DT5H6M7.5S')).toEqual({
      years: 1,
      months: 2,
      weeks: 3,
      days: 4,
      hours: 5,
      minutes: 6,
      seconds: 7,
      milliseconds: 500,
    })
    expect(createDuration('-PT1H')).toMatchObject({ hours: -1 })
    expect(createDuration({ minutes: 90 })).toMatchObject({ minutes: 90, hours: 0 })
    expect([
      createDuration('P'),
      createDuration('PT'),
      createDuration('1 day'),
      createDuration(Number.NaN),
    ]).toEqual([undefined, undefined, undefined, undefined])
  })

  it('totals, serializes and formats them', () => {
    expect(durationAs({ hours: 36 }, 'day')).toBe(1.5)
    expect(durationAs('PT1M30S', 'second')).toBe(90)
    expect(durationAs({ years: 1 }, 'day')).toBe(365.2425)
    expect(durationToISO({ days: 1, hours: 2, seconds: 1.5 })).toBe('P1DT2H1.5S')
    expect(durationToISO(-90_000)).toBe('-PT1M30S')
    expect(durationToISO({})).toBe('PT0S')
    expect(formatDuration({ hours: 1, minutes: 30 }, { locale: 'en-US' })).toBe(
      '1 hour, 30 minutes'
    )
    expect(formatDuration({ hours: 1, minutes: 30 }, { locale: 'es-MX' })).toMatch(
      /^1 hora,? y? ?30 minutos$/
    )
    expect(formatDuration('P1DT2H', { style: 'narrow', locale: 'en-US' })).toBe('1d 2h')
    expect(formatDuration(5_400_000, { style: 'digital' })).toBe('1:30:00')
    expect(formatDuration({ hours: 30, minutes: 5 }, { style: 'digital', locale: 'en-US' })).toBe(
      '30:05:00'
    )
    expect(formatDuration({}, { locale: 'en-US' })).toBe('0 seconds')
    expect(formatDuration('nope', { fallback: '—' })).toBe('—')
    expect(formatDurationPattern({ hours: 2, minutes: 5, seconds: 9 }, 'HH:mm:ss')).toBe('02:05:09')
    expect(formatDurationPattern(90_061_001, 'D [days] H[h] m[m] SSS')).toBe('1 days 1h 1m 001')
  })

  it('humanizes them', () => {
    expect(humanizeDuration({ minutes: 90 }, { locale: 'en-US' })).toBe('2 hours')
    expect(humanizeDuration({ seconds: 20 }, { locale: 'en-US' })).toBe('20 seconds')
    expect(humanizeDuration({ days: 3 }, { locale: 'en-US', withSuffix: true })).toBe('in 3 days')
    expect(humanizeDuration(-3 * 86_400_000, { locale: 'es', withSuffix: true })).toBe(
      'hace 3 días'
    )
    expect(humanizeDuration('nope', { fallback: '—' })).toBe('—')
  })
})
