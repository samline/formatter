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
} from '../date/index.js'
import type { formatRelativeTime } from '../intl/index.js'

/*
 * Classic-script add-on: load it after `formatter.global.js` (or
 * `formatter.phone.global.js`) and it adds the date tools as
 * `window.Formatter.date`. `formatRelativeTime` is taken from
 * `window.Formatter.intl`, so the add-on does not ship it twice. Loaded
 * alone, it creates `window.Formatter` with only `date` (and no
 * `formatRelativeTime`).
 */
const date = {
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
}

export type FormatterDate = typeof date & { formatRelativeTime?: typeof formatRelativeTime }

type Scope = {
  Formatter?: Record<string, unknown> & {
    intl?: { formatRelativeTime?: typeof formatRelativeTime }
  }
}

const scope = globalThis as unknown as Scope
const formatter = (scope.Formatter ??= {})
const relative = formatter.intl?.formatRelativeTime
formatter.date = relative ? { ...date, formatRelativeTime: relative } : date
