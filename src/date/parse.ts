import { TOKENS } from './format.js'
import { dayPeriods, monthNames, weekdayNames } from './names.js'
import {
  fromParts,
  getParts,
  isEmpty,
  isValid,
  monthDays,
  readDate,
  wallTime,
  type DateInput,
  type DateLocale,
  type DateOptions,
} from './shared.js'

export interface ParseDateOptions extends DateOptions {
  /**
   * Tokens the text is written in, such as `'DD/MM/YYYY'` or
   * `'D [de] MMMM [de] YYYY'`, or a list to try in order. Without it,
   * `Date` values, timestamps and ISO strings are read.
   */
  format?: string | readonly string[]
  /**
   * Strict (default) requires every number at its full width (`DD` = two
   * digits), the separators exactly as written and nothing left over. Loose
   * accepts `1/2/2026` for `DD/MM/YYYY` and any separator.
   */
  strict?: boolean
}

interface Fields {
  year?: number
  month?: number
  day?: number
  dayOfYear?: number
  quarter?: number
  hour?: number
  minute?: number
  second?: number
  millisecond?: number
  pm?: boolean
  hour12?: boolean
  hour24?: boolean
  offset?: number
  instant?: number
  weekday?: number
}

const NUMBER_WIDTH: Record<string, [number, number]> = {
  YYYY: [4, 4],
  YY: [2, 2],
  Q: [1, 1],
  MM: [2, 2],
  M: [1, 2],
  DDDD: [3, 3],
  DDD: [1, 3],
  DD: [2, 2],
  D: [1, 2],
  Do: [1, 2],
  d: [1, 1],
  E: [1, 1],
  HH: [2, 2],
  H: [1, 2],
  hh: [2, 2],
  h: [1, 2],
  kk: [2, 2],
  k: [1, 2],
  mm: [2, 2],
  m: [1, 2],
  ss: [2, 2],
  s: [1, 2],
  SSS: [3, 3],
  SS: [2, 2],
  S: [1, 1],
}

const normalize = (text: string, locale: DateLocale | undefined): string =>
  text
    .toLocaleLowerCase(typeof locale === 'string' ? locale : locale?.[0])
    .normalize('NFD')
    .replace(/[̀-ͯ.]/g, '')

/** Index of the longest name that starts `text`, and how many characters it used. */
const matchName = (
  text: string,
  names: string[],
  locale: DateLocale | undefined
): [number, number] | undefined => {
  let best: [number, number] | undefined
  names.forEach((name, index) => {
    const wanted = normalize(name, locale)
    if (!wanted) return
    // Compare a growing prefix so dots and accents in the input are tolerated.
    for (
      let length = Math.min(text.length, name.length + 2);
      length >= wanted.length;
      length -= 1
    ) {
      if (normalize(text.slice(0, length), locale) === wanted) {
        if (!best || length > best[1]) best = [index, length]
        break
      }
    }
  })
  return best
}

const SEPARATORS = /^[\s\p{P}\p{S}]*/u

const parseWith = (text: string, format: string, options: ParseDateOptions): Date | undefined => {
  const { locale, timeZone, strict = true } = options
  const fields: Fields = {}
  let position = 0
  let last = 0
  const pieces: Array<{ literal: string } | { token: string }> = []
  for (const match of format.matchAll(TOKENS)) {
    if ((match.index ?? 0) > last) pieces.push({ literal: format.slice(last, match.index) })
    pieces.push(match[1] !== undefined ? { literal: match[1] } : { token: match[0] })
    last = (match.index ?? 0) + match[0].length
  }
  if (last < format.length) pieces.push({ literal: format.slice(last) })

  for (const piece of pieces) {
    const rest = text.slice(position)
    if ('literal' in piece) {
      if (strict || /[\p{L}\p{N}]/u.test(piece.literal)) {
        const wanted = strict ? piece.literal : piece.literal.trim()
        const skipped = strict ? 0 : (SEPARATORS.exec(rest)?.[0].length ?? 0)
        const candidate = text.slice(position + skipped, position + skipped + wanted.length)
        const same = strict
          ? candidate === wanted
          : normalize(candidate, locale) === normalize(wanted, locale)
        if (!same) return undefined
        position += skipped + wanted.length
        if (!strict) position += SEPARATORS.exec(text.slice(position))?.[0].length ?? 0
      } else {
        position += SEPARATORS.exec(rest)?.[0].length ?? 0
      }
      continue
    }

    const { token } = piece
    const width = NUMBER_WIDTH[token]
    if (width) {
      const [min, max] = strict
        ? width
        : [1, token === 'YYYY' ? 6 : token.startsWith('S') ? 9 : Math.max(width[1], 2)]
      const sign = token === 'YYYY' ? '[+-]?' : ''
      const found = new RegExp(`^${sign}\\d{${min},${max}}`).exec(rest)
      if (!found) return undefined
      position += found[0].length
      const value = Number(found[0])
      if (token === 'Do') {
        // Ordinal marks: 1st, 2nd, 1º, 1er, 1., 1日.
        position += /^(st|nd|rd|th|º|ª|er|e|\.|日|일)/i.exec(text.slice(position))?.[0].length ?? 0
      }
      switch (token) {
        case 'YYYY':
          fields.year = value
          break
        case 'YY':
          fields.year = value + (value > 68 ? 1900 : 2000)
          break
        case 'Q':
          fields.quarter = value
          break
        case 'MM':
        case 'M':
          fields.month = value
          break
        case 'DDDD':
        case 'DDD':
          fields.dayOfYear = value
          break
        case 'd':
          fields.weekday = value
          break
        case 'E':
          fields.weekday = value % 7
          break
        case 'HH':
        case 'H':
          fields.hour = value
          break
        case 'hh':
        case 'h':
          fields.hour = value
          fields.hour12 = true
          break
        case 'kk':
        case 'k':
          fields.hour = value
          fields.hour24 = true
          break
        case 'mm':
        case 'm':
          fields.minute = value
          break
        case 'ss':
        case 's':
          fields.second = value
          break
        case 'SSS':
        case 'SS':
        case 'S':
          fields.millisecond = Math.floor(Number(`0.${found[0]}`) * 1000)
          break
        default:
          fields.day = value
      }
      continue
    }

    switch (token) {
      case 'MMMM':
      case 'MMM': {
        const names = [
          ...monthNames(locale, 'long', 'format'),
          ...monthNames(locale, 'long', 'standalone'),
          ...monthNames(locale, 'short', 'format'),
          ...monthNames(locale, 'short', 'standalone'),
        ]
        const found = matchName(rest, names, locale)
        if (!found) return undefined
        fields.month = (found[0] % 12) + 1
        position += found[1]
        break
      }
      case 'dddd':
      case 'ddd':
      case 'dd': {
        const short = weekdayNames(locale, 'short')
        const names = [
          ...weekdayNames(locale, 'long'),
          ...short,
          ...short.map(name => Array.from(name).slice(0, 2).join('')),
        ]
        const found = matchName(rest, names, locale)
        if (!found) return undefined
        fields.weekday = found[0] % 7
        position += found[1]
        break
      }
      case 'A':
      case 'a': {
        const [am, pm] = dayPeriods(locale)
        const found = matchName(rest, [am, pm, 'am', 'pm'], locale)
        if (!found) return undefined
        fields.pm = found[0] % 2 === 1
        position += found[1]
        break
      }
      case 'X':
      case 'x': {
        const found = (token === 'X' ? /^-?\d+(\.\d+)?/ : /^-?\d+/).exec(rest)
        if (!found) return undefined
        fields.instant = Number(found[0]) * (token === 'X' ? 1000 : 1)
        position += found[0].length
        break
      }
      case 'Z':
      case 'ZZ': {
        const found = /^(?:Z|([+-])(\d{2}):?(\d{2}))/i.exec(rest)
        if (!found) return undefined
        fields.offset = found[1]
          ? (found[1] === '-' ? -1 : 1) * (Number(found[2]) * 60 + Number(found[3]))
          : 0
        position += found[0].length
        break
      }
      default:
        // Localized (L…), week and time-zone-name tokens are output only.
        return undefined
    }
  }

  const leftover = text.slice(position)
  if (strict ? leftover !== '' : leftover.trim() !== '') return undefined
  return build(fields, timeZone, strict)
}

const build = (fields: Fields, timeZone: string | undefined, strict: boolean): Date | undefined => {
  if (fields.instant !== undefined) return new Date(fields.instant)
  const now = getParts(new Date(), timeZone)
  const dateless =
    fields.year === undefined && fields.month === undefined && fields.day === undefined
  const year = fields.year ?? now.year
  let month =
    fields.month ??
    (fields.quarter !== undefined ? (fields.quarter - 1) * 3 + 1 : dateless ? now.month : 1)
  let day = fields.day ?? (dateless && fields.dayOfYear === undefined ? now.day : 1)
  if (fields.dayOfYear !== undefined) {
    const daysInYear = monthDays(year, 2) === 29 ? 366 : 365
    if (fields.dayOfYear < 1 || fields.dayOfYear > daysInYear) return undefined
    const date = new Date(wallTime(year, 1, fields.dayOfYear))
    month = date.getUTCMonth() + 1
    day = date.getUTCDate()
  }
  let hour = fields.hour ?? 0
  if (fields.hour12) {
    if (hour < 1 || hour > 12) return undefined
    hour = (hour % 12) + (fields.pm ? 12 : 0)
  } else if (fields.hour24) {
    if (hour < 1 || hour > 24) return undefined
    hour %= 24
  } else if (fields.pm !== undefined && hour < 12 && fields.pm) {
    hour += 12
  }
  const minute = fields.minute ?? 0
  const second = fields.second ?? 0
  const millisecond = fields.millisecond ?? 0
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > monthDays(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return undefined
  }
  const date =
    fields.offset !== undefined
      ? new Date(
          wallTime(year, month, day, hour, minute, second, millisecond) - fields.offset * 60000
        )
      : fromParts({ year, month, day, hour, minute, second, millisecond }, timeZone)
  const parts = getParts(date, fields.offset !== undefined ? 'UTC' : timeZone)
  if (
    fields.weekday !== undefined &&
    parts.weekday !== fields.weekday &&
    (strict || fields.offset === undefined)
  ) {
    return undefined
  }
  // A time skipped by a daylight-saving jump does not exist on that day.
  if (strict && fields.offset === undefined && (parts.hour !== hour || parts.minute !== minute))
    return undefined
  return date
}

/**
 * Read a date: `parseDate('12/11/2026', { format: 'DD/MM/YYYY' })`. Month and
 * weekday names match in the given locale, ignoring case, accents and dots.
 * Impossible dates (`'31/02/2026'`) are rejected. Returns a `Date`, or
 * `undefined` when the text cannot be read.
 */
export const parseDate = (
  value: DateInput | null | undefined,
  options: ParseDateOptions = {}
): Date | undefined => {
  if (isEmpty(value)) return undefined
  const { format } = options
  if (format === undefined || value instanceof Date || typeof value === 'number') {
    const date = readDate(value, options.timeZone)
    return isValid(date) ? date : undefined
  }
  const text = String(value).trim()
  for (const candidate of typeof format === 'string' ? [format] : format) {
    const date = parseWith(text, candidate, options)
    if (date) return date
  }
  return undefined
}

/** Whether `value` can be read as a date (with `format`, in that format). */
export const isValidDate = (
  value: DateInput | null | undefined,
  options: ParseDateOptions = {}
): boolean => parseDate(value, options) !== undefined
