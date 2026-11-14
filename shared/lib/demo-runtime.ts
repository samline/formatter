import {
  format,
  isValidCard,
  isValidClabe,
  isValidCurp,
  isValidIban,
  regex,
  type FormatOptions,
} from '@samline/formatter'
import { formatDatePattern, parseDate } from '@samline/formatter/date'
import t, { type CheckDigit, type Scenario } from '../i18n/translations/en/demo'

/**
 * Evaluates one scenario for a value and the current select value. Playground
 * renders the build-time result with it and the browser script calls it on
 * every input, so the static HTML and the live preview cannot disagree.
 */
type Rule = { pattern: RegExp; errorMessage: string }

const digits: Record<CheckDigit, (value: string) => boolean> = {
  isValidCard,
  isValidClabe,
  isValidCurp,
  isValidIban,
}

/** Format options with the select applied when it chooses the country. */
export const optionsFor = (item: Scenario, choice?: string): FormatOptions =>
  (item.choice?.role === 'country' && choice
    ? { ...item.options, country: choice }
    : item.options) as FormatOptions

const resolve = (key: string, args?: readonly unknown[]): Rule => {
  const entry = regex[key as keyof typeof regex] as unknown
  return typeof entry === 'function'
    ? (entry as (...values: unknown[]) => Rule)(...(args ?? []))
    : (entry as Rule)
}

/** The regex rule the scenario validates with, or `null` when it has none. */
export const ruleFor = (item: Scenario, choice?: string): Rule | null => {
  if (!item.formatType) return resolve(choice ?? item.choice!.initial)
  const check = item.check
  if (!check) return null
  if (check.withOptions) return resolve(check.key, [item.options])
  if (check.choiceOption)
    return resolve(check.key, [{ [check.choiceOption]: choice ?? item.choice!.initial }])
  return resolve(check.key, check.args)
}

/** The label above the status, e.g. `regex.postalCode({ country }) + isValidIban`. */
export const ruleLabel = (item: Scenario) => {
  const check = item.check
  if (!item.formatType) return t.ruleLabel
  if (!check) return ''
  const args = check.withOptions
    ? 'options'
    : check.choiceOption
      ? `{ ${check.choiceOption} }`
      : check.args?.join(', ')
  return `regex.${check.key}${args === undefined ? '' : `(${args})`}${check.digit ? ` + ${check.digit.name}` : ''}`
}

export interface DemoState {
  formatted: string
  raw: string
  brand: string | null
  pattern: string | null
  status: { valid: boolean; text: string } | null
  dates: string[] | null
}

export const evaluate = (item: Scenario, value: string, choice?: string): DemoState => {
  const rule = ruleFor(item, choice)
  if (!item.formatType) {
    const valid = rule!.pattern.test(value)
    return {
      formatted: value,
      raw: value,
      brand: null,
      pattern: rule!.pattern.source,
      status: { valid, text: valid ? t.validLabel : rule!.errorMessage },
      dates: null,
    }
  }
  const { formatted, raw } = format(value, item.formatType, optionsFor(item, choice))
  const check = item.check
  let status: DemoState['status'] = null
  if (rule && check) {
    const tested = check.on === 'raw' ? raw : formatted
    const shape = rule.pattern.test(tested)
    const digit = !shape || !check.digit || digits[check.digit.name](tested)
    status = {
      valid: shape && digit,
      text: !shape ? rule.errorMessage : digit ? check.valid : check.digit!.error,
    }
  }
  let dates: string[] | null = null
  if (item.dateReadout) {
    const readout = item.dateReadout
    const date = parseDate(formatted, { format: readout.parse })
    const locale = item.choice?.role === 'locale' ? (choice ?? item.choice.initial) : undefined
    dates = readout.outputs.map(output =>
      date ? formatDatePattern(date, output.pattern, { locale }) : readout.empty
    )
  }
  return {
    formatted,
    raw,
    brand: item.brand ? format(raw, 'creditCardType').formatted || item.brand.empty : null,
    pattern: null,
    status,
    dates,
  }
}
