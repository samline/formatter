/**
 * One source of truth for every formatter scenario. Home, Examples and Docs
 * render the live preview from these records, and the copied CDN/ESM files are
 * generated from the same records, so the preview and the copied code share
 * their options, samples and validation rules.
 */
export type FormatType =
  'general' | 'phone' | 'numeral' | 'date' | 'time' | 'creditCard' | 'creditCardType' | 'text'

/** Check-digit validators exported from the root and as `window.Formatter.checks`. */
export type CheckDigit = 'isValidCurp' | 'isValidIban' | 'isValidCard' | 'isValidClabe'

export interface ScenarioCheck {
  /** `regex` entry name. */
  readonly key: string
  /** Arguments for a parametric entry, e.g. `regex.digits(8)`. */
  readonly args?: readonly (number | string)[]
  /** Build the rule from the scenario's own format options: `regex.numeral(options)`. */
  readonly withOptions?: true
  /** Build the rule from the select: `regex.postalCode({ country })`. */
  readonly choiceOption?: string
  /** A check-digit validator run after the pattern passes, with its message. */
  readonly digit?: { readonly name: CheckDigit; readonly error: string }
  /** Which output the rule validates. */
  readonly on: 'raw' | 'formatted'
  readonly valid: string
}

/**
 * A select that changes one format option (`country`), the validation rule,
 * the rule's own option (`check`, see `ScenarioCheck.choiceOption`) or the
 * locale of the date readout.
 */
export interface ScenarioChoice {
  readonly id: string
  readonly label: string
  readonly role: 'country' | 'rule' | 'check' | 'locale'
  readonly initial: string
  readonly choices: readonly (readonly [value: string, label: string])[]
}

export interface Scenario {
  readonly category: CategoryId
  readonly tab: string
  readonly title: string
  readonly description: string
  readonly hint: string
  /** `null` for the validation-only scenario. */
  readonly formatType: FormatType | null
  readonly options: Readonly<Record<string, unknown>>
  readonly field: {
    readonly id: string
    readonly name: string
    readonly label: string
    readonly inputmode: 'tel' | 'numeric' | 'decimal' | 'text' | 'email'
    readonly autocomplete: string
    readonly value: string
    readonly placeholder: string
  }
  readonly choice?: ScenarioChoice
  readonly brand?: { readonly label: string; readonly empty: string }
  readonly check?: ScenarioCheck
  /**
   * Reads the formatted value with `parseDate` from `@samline/formatter/date`
   * and shows it again with `formatDatePattern` in the selected locale.
   */
  readonly dateReadout?: {
    readonly parse: string
    readonly empty: string
    readonly outputs: readonly { readonly label: string; readonly pattern: string }[]
  }
  readonly samples: readonly {
    readonly label: string
    readonly value: string
    readonly choice?: string
  }[]
}

export const categories = {
  contact: 'Phones',
  numbers: 'Numbers and money',
  dates: 'Dates and times',
  cards: 'Payment cards',
  masks: 'Custom masks',
  validation: 'Validation',
} as const
export type CategoryId = keyof typeof categories

const countries = [
  ['MX', 'Mexico'],
  ['US', 'United States'],
  ['ES', 'Spain'],
  ['GB', 'United Kingdom'],
  ['AR', 'Argentina'],
  ['DE', 'Germany'],
] as const

export const scenarios = {
  phone: {
    category: 'contact',
    tab: 'Phone',
    title: 'A phone number for any country',
    description:
      'Type or paste a number. The selected country decides the grouping; the backend receives digits, plus a leading + for international numbers.',
    hint: 'Changing the country reformats the same digits. One input listener and one change listener read the current country, so listeners never pile up.',
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
    choice: {
      id: 'phone-country',
      label: 'Country',
      role: 'country',
      initial: 'MX',
      choices: countries,
    },
    samples: [
      { label: 'US number', value: '2025550123', choice: 'US' },
      { label: 'Paste with symbols', value: '(55) 1234-5678', choice: 'MX' },
      { label: 'International', value: '+44 20 7946 0958' },
    ],
  },
  amount: {
    category: 'numbers',
    tab: 'Amount',
    title: 'An amount with currency and decimals',
    description:
      'Thousands separators and a currency prefix appear while typing. The raw value is a plain decimal string ready to parse on the server.',
    hint: 'numeralDecimalScale limits the decimals. The prefix is display-only: raw never includes it. regex.numeral(options) takes the same options, so the rule accepts exactly what the mask writes.',
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
    check: { key: 'numeral', withOptions: true, on: 'formatted', valid: 'Matches the mask' },
    samples: [
      { label: 'Small amount', value: '49.5' },
      { label: 'Pasted total', value: '$12,000.00' },
      { label: 'Decimal mark last', value: '1234.' },
    ],
  },
  euro: {
    category: 'numbers',
    tab: 'Euro price',
    title: 'A European price with the symbol after it',
    description:
      'A comma for decimals, dots for thousands and the currency after the number. The raw value still uses a dot, so the server parses it the same way.',
    hint: 'numeralDecimalMark and delimiter switch the separators; tailPrefix moves the prefix to the end. regex.numeral(options) checks the comma, the dots and the trailing symbol.',
    formatType: 'numeral',
    options: {
      numeralDecimalMark: ',',
      delimiter: '.',
      numeralDecimalScale: 2,
      prefix: ' €',
      tailPrefix: true,
    },
    field: {
      id: 'price-eur',
      name: 'price',
      label: 'Price',
      inputmode: 'decimal',
      autocomplete: 'off',
      value: '1234567,891',
      placeholder: '0,00 €',
    },
    check: { key: 'numeral', withOptions: true, on: 'formatted', valid: 'Matches the mask' },
    samples: [
      { label: 'Under 50 euros', value: '49,9' },
      { label: 'Symbol deleted', value: '1.234,56 ' },
    ],
  },
  quantity: {
    category: 'numbers',
    tab: 'Quantity',
    title: 'A whole, positive quantity',
    description:
      'Stock counts and seat numbers never need decimals or a minus sign. Leading zeros disappear and large counts stay readable.',
    hint: 'numeralDecimalScale: 0 drops decimals and numeralPositiveOnly drops the sign. The raw value is an integer string.',
    formatType: 'numeral',
    options: { numeralDecimalScale: 0, numeralPositiveOnly: true },
    field: {
      id: 'quantity',
      name: 'quantity',
      label: 'Units in stock',
      inputmode: 'numeric',
      autocomplete: 'off',
      value: '1500',
      placeholder: '0',
    },
    samples: [
      { label: 'Negative typed', value: '-3' },
      { label: 'Leading zeros', value: '0042' },
    ],
  },
  date: {
    category: 'dates',
    tab: 'Date',
    title: 'A date shown locally, stored as ISO',
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
      { label: 'Partly typed', value: '05/03' },
    ],
  },
  expiry: {
    category: 'dates',
    tab: 'Card expiry',
    title: 'A card expiry date as MM/YY',
    description:
      'Month and two-digit year with the slash inserted automatically. An impossible month such as 13 is corrected while typing.',
    hint: 'datePattern: ["m", "y"] builds the mask. Setting dateRawPatternDelimiter keeps the slash in raw for payment forms that expect MM/YY.',
    formatType: 'date',
    options: { datePattern: ['m', 'y'], delimiter: '/', dateRawPatternDelimiter: '/' },
    field: {
      id: 'card-expiry',
      name: 'card_expiry',
      label: 'Expiry date',
      inputmode: 'numeric',
      autocomplete: 'cc-exp',
      value: '1228',
      placeholder: 'MM/YY',
    },
    check: { key: 'expirationDate', on: 'formatted', valid: 'Valid expiry format' },
    samples: [
      { label: 'Month 13 typed', value: '1328' },
      { label: 'Incomplete', value: '0' },
    ],
  },
  time: {
    category: 'dates',
    tab: 'Time',
    title: 'A 24-hour appointment time',
    description:
      'Digits become hours and minutes, and out-of-range values are corrected while typing. The raw value is ready for a time column.',
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
  weekday: {
    category: 'dates',
    tab: 'Date tools',
    title: 'A typed date read back in any language',
    description:
      'The mask writes day/month/year; parseDate reads it with the same tokens and formatDatePattern shows the weekday, the long date and the ISO week in the selected locale.',
    hint: 'The date tools live in @samline/formatter/date (CDN: formatter.date.global.js after the core script). parseDate is strict, so it returns undefined until the date is complete and real.',
    formatType: 'date',
    options: { datePattern: ['d', 'm', 'Y'], delimiter: '/' },
    field: {
      id: 'event-date',
      name: 'event_date',
      label: 'Event date',
      inputmode: 'numeric',
      autocomplete: 'off',
      value: '24122026',
      placeholder: 'dd/mm/yyyy',
    },
    choice: {
      id: 'date-locale',
      label: 'Language',
      role: 'locale',
      initial: 'es-MX',
      choices: [
        ['es-MX', 'Spanish (Mexico)'],
        ['en-US', 'English (US)'],
        ['pt-BR', 'Portuguese (Brazil)'],
        ['fr-FR', 'French'],
        ['de-DE', 'German'],
      ],
    },
    check: { key: 'date', withOptions: true, on: 'formatted', valid: 'Complete date' },
    dateReadout: {
      parse: 'DD/MM/YYYY',
      empty: 'Keep typing',
      outputs: [
        { label: 'Weekday', pattern: 'dddd' },
        { label: 'Long date', pattern: 'LL' },
        { label: 'ISO week', pattern: 'WW' },
      ],
    },
    samples: [
      { label: 'Leap day', value: '29022028', choice: 'en-US' },
      { label: 'In German', value: '01052026', choice: 'de-DE' },
      { label: 'Half typed', value: '0503' },
    ],
  },
  card: {
    category: 'cards',
    tab: 'Card',
    title: 'A card number with its brand',
    description:
      'Grouping follows the detected card brand. The same digits drive a brand badge and a paired validation message.',
    hint: 'creditCardType returns the brand as formatted and the digits as raw. Formatting is not payment validation: rely on your payment provider for that.',
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
      { label: 'Too short', value: '4111 1111' },
    ],
  },
  reference: {
    category: 'masks',
    tab: 'Mask',
    title: 'An order reference with a fixed prefix',
    description:
      'The ORD- prefix is locked, digits are grouped by blocks, and the backend receives only the digits. Deleting part of the prefix restores it.',
    hint: 'Pasted values that already include the prefix are accepted. Add rawPrefix: true when the backend stores ORD- as part of the value.',
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
  weight: {
    category: 'masks',
    tab: 'Weight',
    title: 'A measurement with a unit suffix',
    description:
      'The unit stays at the end while people type digits. Backspace into the unit and it comes back; the backend receives only the number.',
    hint: 'suffix adds a trailing decoration to general values. The default lock mode restores it; suffixMode: "passthrough" lets people type it themselves.',
    formatType: 'general',
    options: { blocks: [5], numericOnly: true, suffix: ' kg' },
    field: {
      id: 'weight',
      name: 'weight_kg',
      label: 'Package weight',
      inputmode: 'numeric',
      autocomplete: 'off',
      value: '12',
      placeholder: '0 kg',
    },
    samples: [
      { label: 'Unit partly deleted', value: '12 k' },
      { label: 'Heavy parcel', value: '125' },
    ],
  },
  promo: {
    category: 'masks',
    tab: 'Promo code',
    title: 'A promo code people type themselves',
    description:
      'Codes start with SAVE, but people often type it, in any case. Passthrough mode keeps every keystroke and uppercases the code.',
    hint: 'prefixMode: "passthrough" recognizes the prefix as it is typed instead of adding it for the user. Raw excludes the prefix unless rawPrefix is true.',
    formatType: 'general',
    options: { blocks: [8], prefix: 'SAVE', prefixMode: 'passthrough', uppercase: true },
    field: {
      id: 'promo',
      name: 'promo_code',
      label: 'Promo code',
      inputmode: 'text',
      autocomplete: 'off',
      value: 'save20',
      placeholder: 'SAVE20',
    },
    samples: [
      { label: 'Lower case', value: 'save15' },
      { label: 'Only the discount', value: '30' },
    ],
  },
  postal: {
    category: 'masks',
    tab: 'ZIP code',
    title: 'A US ZIP code with optional +4',
    description:
      'Five digits, with the hyphen shown only when the optional four extra digits start. Both forms pass the paired postal code rule.',
    hint: 'delimiterLazyShow waits for the next block before showing its delimiter, so a five-digit ZIP never ends with a dangling hyphen.',
    formatType: 'general',
    options: { blocks: [5, 4], delimiter: '-', numericOnly: true, delimiterLazyShow: true },
    field: {
      id: 'zip',
      name: 'zip',
      label: 'ZIP code',
      inputmode: 'numeric',
      autocomplete: 'postal-code',
      value: '90210',
      placeholder: '00000',
    },
    check: { key: 'postalCode', on: 'formatted', valid: 'Valid ZIP code' },
    samples: [
      { label: 'ZIP+4', value: '902101234' },
      { label: 'Too short', value: '902' },
    ],
  },
  postcode: {
    category: 'masks',
    tab: 'Postal code',
    title: 'A postal code checked for the selected country',
    description:
      'Postal codes have no single shape: SW1A 1AA, K1A 0B1, 100-0001. The text type uppercases what people type and regex.postalCode({ country }) checks it for one of 24 countries.',
    hint: 'The static regex.postalCode stays the US ZIP. Countries without a built-in rule use regex.custom() with your own pattern.',
    formatType: 'text',
    options: { case: 'upper' },
    field: {
      id: 'postcode',
      name: 'postcode',
      label: 'Postal code',
      inputmode: 'text',
      autocomplete: 'postal-code',
      value: 'sw1a 1aa',
      placeholder: 'Postal code',
    },
    choice: {
      id: 'postcode-country',
      label: 'Country',
      role: 'check',
      initial: 'GB',
      choices: [
        ['GB', 'United Kingdom'],
        ['CA', 'Canada'],
        ['US', 'United States'],
        ['MX', 'Mexico'],
        ['DE', 'Germany'],
        ['JP', 'Japan'],
      ],
    },
    check: {
      key: 'postalCode',
      choiceOption: 'country',
      on: 'raw',
      valid: 'Valid postal code',
    },
    samples: [
      { label: 'Canada', value: 'k1a 0b1', choice: 'CA' },
      { label: 'Japan', value: '100-0001', choice: 'JP' },
      { label: 'US ZIP in the UK', value: '10001', choice: 'GB' },
    ],
  },
  curp: {
    category: 'masks',
    tab: 'CURP',
    title: 'A Mexican CURP in capital letters',
    description:
      'An 18-character identifier typed in any case. The display and raw value are uppercase; regex.curp checks the structure and isValidCurp the final check digit.',
    hint: 'uppercase transforms the display; without a prefix or suffix, raw is derived from the formatted value. A pattern cannot see a typo in a digit; the check digit can.',
    formatType: 'general',
    options: { blocks: [18], uppercase: true },
    field: {
      id: 'curp',
      name: 'curp',
      label: 'CURP',
      inputmode: 'text',
      autocomplete: 'off',
      value: 'goma800101hdfrrn05',
      placeholder: 'AAAA000000AAAAAA00',
    },
    check: {
      key: 'curp',
      on: 'raw',
      valid: 'Valid CURP and check digit',
      digit: { name: 'isValidCurp', error: 'The CURP check digit does not match.' },
    },
    samples: [
      { label: 'Another CURP', value: 'LOPJ921215MDFRRS09' },
      { label: 'Wrong check digit', value: 'GOMA800101HDFRRN09' },
      { label: 'Incomplete', value: 'GOMA8001' },
    ],
  },
  color: {
    category: 'masks',
    tab: 'Hex color',
    title: 'A brand color with the # included',
    description:
      'The # is shown and stored, letters are uppercased and the value is capped at six characters. The paired rule accepts #RGB and #RRGGBB.',
    hint: 'rawPrefix: true keeps the prefix in raw, so the stored value is a complete CSS color. Without it raw would be FF8800.',
    formatType: 'general',
    options: { prefix: '#', blocks: [6], uppercase: true, rawPrefix: true },
    field: {
      id: 'brand-color',
      name: 'brand_color',
      label: 'Brand color',
      inputmode: 'text',
      autocomplete: 'off',
      value: 'ff8800',
      placeholder: '#000000',
    },
    check: { key: 'hexColor', on: 'raw', valid: 'Valid hex color' },
    samples: [
      { label: 'Short form', value: '0f0' },
      { label: 'Not a color', value: 'zz99' },
    ],
  },
  iban: {
    category: 'validation',
    tab: 'IBAN',
    title: 'An IBAN grouped in fours and checked with mod 97',
    description:
      'The mask uppercases and groups the IBAN as it is printed. regex.iban checks the shape; isValidIban checks the length for the country and the two check digits, so a mistyped character fails.',
    hint: 'raw drops the spaces. The check-digit validators ignore spaces and hyphens, return a boolean and do not import regex.',
    formatType: 'general',
    options: { blocks: [4, 4, 4, 4, 4, 4, 4, 4, 2], delimiter: ' ', uppercase: true },
    field: {
      id: 'iban',
      name: 'iban',
      label: 'IBAN',
      inputmode: 'text',
      autocomplete: 'off',
      value: 'gb82west12345698765432',
      placeholder: 'GB00 0000 0000 0000 0000 00',
    },
    check: {
      key: 'iban',
      on: 'raw',
      valid: 'Valid IBAN and check digits',
      digit: {
        name: 'isValidIban',
        error: 'One character is wrong: the IBAN check digits do not match.',
      },
    },
    samples: [
      { label: 'German IBAN', value: 'DE89370400440532013000' },
      { label: 'One digit wrong', value: 'GB82WEST12345698765433' },
    ],
  },
  validator: {
    category: 'validation',
    tab: 'Rules',
    title: 'Validation rules with ready messages',
    description:
      'Choose a rule from the regex catalog and type a value. Each rule pairs its pattern with the message to show, so the two never drift apart.',
    hint: 'Static rules are records; parametric ones such as password() are called first. Validate again on the server: these patterns give quick feedback.',
    formatType: null,
    options: {},
    field: {
      id: 'value',
      name: 'value',
      label: 'Value to check',
      inputmode: 'text',
      autocomplete: 'off',
      value: 'hello@example.com',
      placeholder: 'Type a value',
    },
    choice: {
      id: 'rule',
      label: 'Rule',
      role: 'rule',
      initial: 'email',
      choices: [
        ['email', 'Email address'],
        ['password', 'Password strength'],
        ['url', 'URL'],
        ['rfc', 'Mexican RFC'],
        ['curp', 'Mexican CURP'],
        ['personName', 'Person name'],
        ['phone', 'Phone number (10 digits)'],
        ['ine', 'Mexican INE voter key'],
        ['ssn', 'US Social Security number'],
        ['iban', 'IBAN'],
        ['ipv4', 'IPv4 address'],
        ['uuid', 'UUID'],
        ['slug', 'URL slug'],
        ['username', 'Username'],
        ['semver', 'Semantic version'],
        ['macAddress', 'MAC address'],
      ],
    },
    samples: [
      { label: 'Weak password', value: 'password1', choice: 'password' },
      { label: 'Strong password', value: 'Passw0rd!', choice: 'password' },
      { label: 'Slug with spaces', value: 'my new post', choice: 'slug' },
      { label: 'Accented name', value: 'José Pérez-Güemes', choice: 'personName' },
      { label: 'IBAN with spaces', value: 'GB82 WEST 1234 5698 7654 32', choice: 'iban' },
      { label: 'Phone with symbols', value: '(55) 1234-5678', choice: 'phone' },
      { label: 'Letters between digits', value: 'abc5512345678', choice: 'phone' },
    ],
  },
} as const satisfies Record<string, Scenario>

export type DemoPreset = keyof typeof scenarios
export const presetIds = Object.keys(scenarios) as DemoPreset[]
/** Home shows one representative scenario per format family. */
export const homePresets = [
  'phone',
  'amount',
  'date',
  'card',
  'reference',
  'validator',
] as const satisfies readonly DemoPreset[]

export default {
  label: 'Formatter studio',
  previewTagline: 'Live · formatted and raw',
  validationTagline: 'Live · pattern and message',
  tabs: homePresets.map(id => ({ id, label: scenarios[id].tab })),
  rawLabel: 'Sent to your backend',
  formattedLabel: 'Shown to people',
  patternLabel: 'Pattern',
  ruleLabel: 'Result',
  validLabel: 'Looks valid',
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
} as const
