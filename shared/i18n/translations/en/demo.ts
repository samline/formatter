/**
 * One source of truth for every formatter scenario. Home, Examples and Docs
 * render the live preview from these records, and the copied CDN/ESM files are
 * generated from the same records, so the preview and the copied code share
 * their options, samples and validation rules.
 */
export type FormatType =
  'general' | 'phone' | 'numeral' | 'date' | 'time' | 'creditCard' | 'creditCardType'

export interface ScenarioCheck {
  /** `regex` entry name. */
  readonly key: string
  /** Arguments for a parametric entry, e.g. `regex.digits(8)`. */
  readonly args?: readonly (number | string)[]
  /** Which output the rule validates. */
  readonly on: 'raw' | 'formatted'
  readonly valid: string
}

export interface Scenario {
  readonly tab: string
  readonly title: string
  readonly eyebrow: string
  readonly description: string
  readonly hint: string
  readonly formatType: FormatType
  readonly options: Readonly<Record<string, unknown>>
  readonly field: {
    readonly id: string
    readonly name: string
    readonly label: string
    readonly inputmode: 'tel' | 'numeric' | 'decimal' | 'text'
    readonly autocomplete: string
    readonly value: string
    readonly placeholder: string
  }
  readonly country?: {
    readonly id: string
    readonly label: string
    readonly choices: readonly (readonly [code: string, label: string])[]
  }
  readonly brand?: { readonly label: string; readonly empty: string }
  readonly check?: ScenarioCheck
  readonly samples: readonly { readonly label: string; readonly value: string }[]
}

export const scenarios = {
  phone: {
    tab: 'Phone',
    title: 'A phone number for any country',
    eyebrow: 'phone · libphonenumber',
    description:
      'Type or paste a number. The country decides the grouping; the backend receives only digits (and a leading + for international numbers).',
    hint: 'Change the country to regroup the same digits. One input listener and one change listener read the current country, so listeners never pile up.',
    formatType: 'phone',
    options: { country: 'MX' },
    field: {
      id: 'phone',
      name: 'phone',
      label: 'Mobile phone',
      inputmode: 'tel',
      autocomplete: 'tel',
      value: '5512345678',
      placeholder: '55 1234 5678',
    },
    country: {
      id: 'phone-country',
      label: 'Country',
      choices: [
        ['MX', 'Mexico'],
        ['US', 'United States'],
        ['ES', 'Spain'],
        ['GB', 'United Kingdom'],
      ],
    },
    samples: [
      { label: 'Paste with symbols', value: '(55) 1234-5678' },
      { label: 'International', value: '+44 20 7946 0958' },
    ],
  },
  amount: {
    tab: 'Amount',
    title: 'An amount with currency and decimals',
    eyebrow: 'numeral · prefix',
    description:
      'Thousands separators and a currency prefix appear while typing. The raw value is a plain decimal string ready for parsing on the server.',
    hint: 'numeralDecimalScale limits the decimals. Use numeralDecimalMark and delimiter for regional formats such as 1.234,56.',
    formatType: 'numeral',
    options: { prefix: '$', numeralDecimalScale: 2 },
    field: {
      id: 'amount',
      name: 'amount',
      label: 'Invoice total',
      inputmode: 'decimal',
      autocomplete: 'off',
      value: '1234567.891',
      placeholder: '$0.00',
    },
    samples: [
      { label: 'Small amount', value: '49.5' },
      { label: 'Pasted total', value: '$12,000.00' },
    ],
  },
  date: {
    tab: 'Date',
    title: 'A date shown locally, stored as ISO',
    eyebrow: 'date · raw pattern',
    description:
      'People read day/month/year; the API stores year-month-day. A server value such as 1990-12-31 is recognized and converted for display.',
    hint: 'interpretInputAs: "auto" treats a complete value without the display delimiter as raw. Partial or delimited values are treated as typing.',
    formatType: 'date',
    options: {
      datePattern: ['d', 'm', 'Y'],
      delimiter: '/',
      dateRawPattern: ['Y', 'm', 'd'],
      dateRawPatternDelimiter: '-',
    },
    field: {
      id: 'birth-date',
      name: 'birth_date',
      label: 'Date of birth',
      inputmode: 'numeric',
      autocomplete: 'bday',
      value: '1990-12-31',
      placeholder: 'dd/mm/yyyy',
    },
    check: { key: 'date', on: 'raw', valid: 'Complete ISO date' },
    samples: [
      { label: 'Value from the API', value: '2026-11-05' },
      { label: 'Typed digits', value: '0503' },
    ],
  },
  time: {
    tab: 'Time',
    title: 'A 24-hour appointment time',
    eyebrow: 'time · hh:mm',
    description:
      'Digits become hours and minutes, with out-of-range values corrected by cleave-zen. The raw value is ready for a time column.',
    hint: 'timePattern sets the visible segments. The raw value uses timeRawPattern, which follows timePattern unless you set it.',
    formatType: 'time',
    options: { timePattern: ['h', 'm'] },
    field: {
      id: 'appointment',
      name: 'appointment',
      label: 'Appointment time',
      inputmode: 'numeric',
      autocomplete: 'off',
      value: '0930',
      placeholder: 'hh:mm',
    },
    check: { key: 'time24', on: 'raw', valid: 'Valid 24-hour time' },
    samples: [
      { label: 'Afternoon', value: '1745' },
      { label: 'Out of range', value: '2975' },
    ],
  },
  card: {
    tab: 'Card',
    title: 'A card number with its brand',
    eyebrow: 'creditCard · creditCardType',
    description:
      'Grouping follows the detected card brand. The same digits drive a brand badge and a paired validation message.',
    hint: 'creditCardType returns the brand as formatted and the digits as raw. Formatting is not payment validation: use your payment provider for that.',
    formatType: 'creditCard',
    options: {},
    field: {
      id: 'card-number',
      name: 'card_number',
      label: 'Card number',
      inputmode: 'numeric',
      autocomplete: 'cc-number',
      value: '4111111111111111',
      placeholder: '0000 0000 0000 0000',
    },
    brand: { label: 'Brand', empty: 'Unknown' },
    check: { key: 'creditCard', on: 'formatted', valid: 'Card number length is valid' },
    samples: [
      { label: 'American Express', value: '378282246310005' },
      { label: 'Mastercard', value: '5555555555554444' },
    ],
  },
  reference: {
    tab: 'Custom',
    title: 'An order reference with a fixed prefix',
    eyebrow: 'general · prefix · blocks',
    description:
      'A custom mask: the ORD- prefix is locked, digits are grouped by blocks, and the backend receives only the digits.',
    hint: 'Pasted values that already include the prefix are accepted. Add rawPrefix: true when the backend expects ORD- in the stored value.',
    formatType: 'general',
    options: { prefix: 'ORD-', blocks: [4, 4], delimiter: '-', numericOnly: true },
    field: {
      id: 'order',
      name: 'order_reference',
      label: 'Order reference',
      inputmode: 'numeric',
      autocomplete: 'off',
      value: '20261105',
      placeholder: 'ORD-0000-0000',
    },
    check: { key: 'digits', args: [8], on: 'raw', valid: 'Complete reference' },
    samples: [
      { label: 'Paste with prefix', value: 'ORD-4821-0093' },
      { label: 'Partial', value: '123' },
    ],
  },
} as const satisfies Record<string, Scenario>

export type DemoPreset = keyof typeof scenarios
export const presetIds = Object.keys(scenarios) as DemoPreset[]

export default {
  label: 'Formatter studio',
  previewTagline: 'Live · formatted and raw',
  tabs: presetIds.map(id => ({ id, label: scenarios[id].tab })),
  rawLabel: 'Sent to your backend',
  formattedLabel: 'Shown to people',
  emptyRaw: '—',
  samplesLabel: 'Try a value',
  reset: 'Reset',
  noscript:
    'Enable JavaScript to format the fields as you type. The example source files remain readable below.',
  openCode: 'Explore the code',
  modeLabel: 'Loading mode',
  cdn: 'HTML / CDN',
  esm: 'Package / ESM',
  note: 'Save these files in one folder and open index.html. The CDN script defines window.Formatter; no build step is needed.',
  esmNote:
    'Install @samline/formatter and serve these files with your bundler or dev server (for example Vite). The package import replaces the CDN script.',
  copyComplete: 'Copy the complete example',
  invalidFallback: 'Keep typing',
} as const
