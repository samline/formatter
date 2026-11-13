import { cached, dateTimeFormat, type DateLocale } from './shared.js'

const UTC_NOON = (year: number, month: number, day: number): number =>
  Date.UTC(year, month, day, 12)

const partOf = (
  format: Intl.DateTimeFormat,
  time: number,
  type: Intl.DateTimeFormatPartTypes
): string => format.formatToParts(time).find(part => part.type === type)?.value ?? ''

export type NameWidth = 'long' | 'short'

/**
 * Month names, January first. `format` is the form used next to a day
 * ("12 ноября"), `standalone` the form used alone ("ноябрь"); they differ
 * in languages with grammatical cases.
 */
export const monthNames = (
  locale: DateLocale | undefined,
  width: NameWidth,
  context: 'format' | 'standalone'
): string[] =>
  cached('months', locale, { width, context }, () => {
    const format = dateTimeFormat(
      locale,
      context === 'format'
        ? { timeZone: 'UTC', day: 'numeric', month: width }
        : { timeZone: 'UTC', month: width }
    )
    return Array.from({ length: 12 }, (_, month) =>
      partOf(format, UTC_NOON(2021, month, 15), 'month')
    )
  })

/** Weekday names, Sunday first. */
export const weekdayNames = (
  locale: DateLocale | undefined,
  width: NameWidth | 'narrow'
): string[] =>
  cached('weekdays', locale, { width }, () => {
    const format = dateTimeFormat(locale, { timeZone: 'UTC', weekday: width })
    // 2021-08-01 was a Sunday.
    return Array.from({ length: 7 }, (_, day) => format.format(UTC_NOON(2021, 7, 1 + day)))
  })

/** Two-letter weekday names (`'Su'`, `'Mo'`; `'do'`, `'lu'` in Spanish). */
export const weekdayMinNames = (locale: DateLocale | undefined): string[] =>
  weekdayNames(locale, 'short').map(name => Array.from(name).slice(0, 2).join(''))

/** Localized AM and PM markers. */
export const dayPeriods = (locale: DateLocale | undefined): [string, string] =>
  cached('periods', locale, {}, () => {
    const format = dateTimeFormat(locale, { timeZone: 'UTC', hour: 'numeric', hourCycle: 'h12' })
    const am = partOf(format, Date.UTC(2021, 0, 1, 9), 'dayPeriod') || 'AM'
    const pm = partOf(format, Date.UTC(2021, 0, 1, 21), 'dayPeriod') || 'PM'
    return [am, pm]
  })

const ORDINAL_EN: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' }

/** Day of the month with its ordinal mark: `1st` (en), `1º` (es), `1er` (fr), `1.` (de). */
export const ordinal = (value: number, locale: DateLocale | undefined): string => {
  const tag =
    (Array.isArray(locale) ? locale[0] : locale) ??
    new Intl.DateTimeFormat().resolvedOptions().locale
  const language = String(tag).toLowerCase().split('-')[0]
  switch (language) {
    case 'en': {
      const rules = cached(
        'ordinal',
        'en',
        {},
        () => new Intl.PluralRules('en', { type: 'ordinal' })
      )
      return `${value}${ORDINAL_EN[rules.select(value)] ?? 'th'}`
    }
    case 'es':
    case 'pt':
    case 'it':
    case 'gl':
    case 'ca':
      return `${value}º`
    case 'fr':
      return value === 1 ? '1er' : String(value)
    case 'ja':
    case 'zh':
      return `${value}日`
    case 'ko':
      return `${value}일`
    case 'nl':
      return `${value}e`
    default:
      return `${value}.`
  }
}

/** Time-zone name of `time` (`'CST'`, `'GMT-6'`, or the long form). */
export const timeZoneName = (
  time: number,
  locale: DateLocale | undefined,
  timeZone: string | undefined,
  long: boolean
): string =>
  partOf(
    dateTimeFormat(locale, {
      ...(timeZone ? { timeZone } : {}),
      timeZoneName: long ? 'long' : 'short',
    }),
    time,
    'timeZoneName'
  )
