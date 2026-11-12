import { quickStartFiles } from '../../../../../shared/lib/demo-files'
import { project } from '../../../../../shared/lib/project.mjs'
const text = (value: string) => [{ kind: 'text' as const, value }]
const codeText = (value: string) => ({ kind: 'code' as const, value })
const plain = (value: string) => ({ kind: 'text' as const, value })
const heading = (prefix: string, accent: string) => [
  { kind: 'text' as const, value: prefix + ' ' },
  { kind: 'emphasis' as const, value: accent },
]
const code = (filename: string, source: string, language: 'html' | 'javascript' | 'bash') => ({
  filename,
  code: source,
  language,
})
export default {
  hero: {
    kicker: 'Small library. Clean input.',
    title: project.name,
    seoTitle: 'Input formatting and raw values',
    titleAccent: 'Keep every field readable.',
    description: 'Input formatting for the fields that matter.',
    descriptionContinuation: 'Group a phone, price a total, or store a date as ISO.',
    footnotes: ['One pure function', 'JavaScript & TypeScript', 'MIT licensed'],
    compatibilityLabel: 'ONE SMALL SCRIPT. RIGHT AT HOME IN YOUR STACK.',
    platforms: ['JavaScript', 'TypeScript', 'React', 'Vue', 'Svelte', 'Shopify', 'WordPress'],
  },
  features: {
    eyebrow: '01 / More than a mask',
    title: 'Formatted while typing.',
    titleAccent: 'Clean when it is sent.',
    items: {
      dependencies: {
        title: 'Two outputs, one call',
        description: [
          codeText('format()'),
          plain(' returns '),
          codeText('formatted'),
          plain(' for the visible field and '),
          codeText('raw'),
          plain(' for the hidden input or request body, so the two never drift apart.'),
        ],
      },
      accessibility: {
        title: 'Your field, your markup',
        description: text(
          'Formatter never touches the DOM. Labels, error messages, autocomplete, inputmode and caret behavior stay under your control.'
        ),
      },
      lifecycle: {
        title: 'Pure and stateless',
        description: text(
          'There is no instance to create or destroy. Call it on every input event, on the server, or in a test with the same result.'
        ),
      },
      entrypoints: {
        title: 'Seven format types',
        description: text(
          'Numerals, dates, times, card numbers and brands, and general block masks from a built-in engine, plus opt-in phones through libphonenumber-js.'
        ),
      },
      frameworks: {
        title: 'Fits controlled inputs',
        description: text(
          'Store raw in state and render formatted. The same call works in React, Vue, Svelte, vanilla JavaScript and server code.'
        ),
      },
      markup: {
        title: 'Validation that stays in sync',
        description: [
          plain('The '),
          codeText('regex'),
          plain(
            ' catalog pairs each pattern with its error message, including parametric rules for digits, phones, cards, URLs and passwords.'
          ),
        ],
      },
    },
  },
  runtimes: {
    eyebrow: '02 / Fit it into your stack',
    heading: heading('Two ways in.', 'One format() call.'),
    description:
      'Every entrypoint exposes the same format() and regex. Pick the one that matches how your project loads JavaScript.',
    items: {
      main: {
        label: 'Package / ESM',
        entrypoint: project.npmName,
        description: 'ES module and CommonJS builds with bundled type declarations.',
      },
      vanilla: {
        label: 'Explicit subpath',
        entrypoint: `${project.npmName}/vanilla`,
        description: 'The same API under a stable name for projects that pin a runtime subpath.',
      },
      browser: {
        label: 'HTML / CDN',
        entrypoint: `${project.npmName}/browser`,
        description:
          'A minified standalone script for pages without a bundler, including CMS themes.',
      },
      global: {
        label: 'Browser global',
        entrypoint: 'window.Formatter',
        description: 'The standalone script defines format, regex and version on one global.',
      },
      core: {
        label: 'Types',
        entrypoint: 'FormatOptions · FormatterResult',
        description: 'FormatType, RegexKey, DatePatternType and every option are exported.',
      },
      style: {
        label: 'Styles',
        entrypoint: 'No stylesheet',
        description:
          'Nothing to import: the package returns strings and your CSS styles the field.',
      },
    },
  },
  gettingStarted: {
    eyebrow: '03 / From install to input',
    heading: heading('One field.', 'Two clean values.'),
    integrationDescription:
      'Format the visible input on every keystroke and mirror the raw value into a hidden input that your form submits.',
    integrationLabel: 'Read the installation guide',
    steps: { install: 'Install', markup: 'Add two inputs', initialize: 'Format on input' },
    installLabel: 'Installation method',
    installTabs: [],
    initLabel: 'Example format',
    initTabs: [
      { id: 'script', label: 'Package / ESM' },
      { id: 'complete', label: 'HTML / CDN' },
    ],
    cdnHint:
      'Load the CDN script from step 1 first, then this file with defer. window.Formatter replaces the import.',
    fullExampleLabel: 'Copy complete working files',
    markupDescription:
      'A visible field for people and a hidden field with the name your backend reads.',
    examples: {
      markup: code('index.html', quickStartFiles.markup, 'html'),
      script: code('main.js', quickStartFiles.esm, 'javascript'),
      complete: code('main.js', quickStartFiles.cdn, 'javascript'),
    },
    docs: {
      description: 'Continue with every option, the regex catalog and the TypeScript types.',
      label: 'Explore the configuration reference',
    },
  },
  recipes: {
    eyebrow: '04 / After the first field',
    title: 'Keep the display familiar.',
    titleAccent: 'Keep the data clean.',
    description:
      'Patterns that come up in real forms: server-filled values, regional numbers, stored values and validation messages.',
    examplesLabel: 'Explore all fifteen examples',
    items: [
      {
        title: 'Show a value from your API',
        context: 'Edit forms',
        docsRoute: 'options' as const,
        docsLabel: 'Read about interpretInputAs',
        description: text(
          'A stored ISO date has no display delimiter, so the default auto mode treats it as raw and converts it for display.'
        ),
        code: code(
          'edit-form.js',
          `const { formatted } = format('1990-12-31', 'date', {
  datePattern: ['d', 'm', 'Y'],
  delimiter: '/',
  dateRawPattern: ['Y', 'm', 'd'],
  dateRawPatternDelimiter: '-',
})

field.value = formatted // '31/12/1990'`,
          'javascript'
        ),
      },
      {
        title: 'Regional number formats',
        context: 'Numerals',
        docsRoute: 'options' as const,
        docsLabel: 'Read the numeral options',
        description: text(
          'Swap the decimal mark and grouping delimiter for European amounts. The raw value always uses a dot.'
        ),
        code: code(
          'amount.js',
          `format('1234567,891', 'numeral', {
  numeralDecimalMark: ',',
  delimiter: '.',
  numeralDecimalScale: 2,
})
// { formatted: '1.234.567,89', raw: '1234567.89', type: 'numeral' }`,
          'javascript'
        ),
      },
      {
        title: 'Display what you stored',
        context: 'Display',
        docsRoute: 'intl' as const,
        docsLabel: 'Read about the Intl helpers',
        description: text(
          'Show stored amounts and dates in the reader’s locale with the Intl helpers. Empty or unreadable values return an empty string, never NaN.'
        ),
        code: code(
          'invoice.js',
          `import { formatCurrency, formatDate } from '${project.npmName}/intl'

formatCurrency('1234.5', { locale: 'es-MX', currency: 'MXN' }) // '$1,234.50'
formatDate('2026-11-12', { locale: 'es-MX', preset: 'long' }) // '12 de noviembre de 2026'
formatCurrency(null, { currency: 'MXN' }) // ''`,
          'javascript'
        ),
      },
      {
        title: 'Validate with the paired message',
        context: 'Validation',
        docsRoute: 'regex' as const,
        docsLabel: 'Explore the regex catalog',
        description: text(
          'Test the raw value and show the message that belongs to the same rule through the native constraint API.'
        ),
        code: code(
          'validate.js',
          `import { format, regex } from '${project.npmName}'
import { registerPhone } from '${project.npmName}/phone'

registerPhone()

field.addEventListener('input', () => {
  const { formatted, raw } = format(field.value, 'phone')
  const rule = regex.phone({ length: 10 })
  field.value = formatted
  field.setCustomValidity(rule.pattern.test(raw) ? '' : rule.errorMessage)
})`,
          'javascript'
        ),
      },
    ],
  },
  faq: {
    eyebrow: '05 / Before you build',
    heading: heading('A few details.', 'Clearly answered.'),
    items: {
      submit: {
        question: text('Which value should my form submit?'),
        answer: text(
          'Submit raw. It drops delimiters and decorations, keeps a leading + for international phones, uses a dot as the decimal mark and follows the raw date or time pattern. Keep formatted for display only: mirror raw into a hidden input, a form state field or the request body.'
        ),
      },
      prefill: {
        question: text('How do I show a value that is already stored?'),
        answer: text(
          'Pass the stored raw value through format() and put formatted in the field. Dates and times use interpretInputAs: "auto" by default, so an ISO value such as 1990-12-31 is recognized as raw and converted to the display pattern. Use "raw" or "display" when your data is ambiguous.'
        ),
      },
      paste: {
        question: text('What happens when people paste text?'),
        answer: text(
          'Each call formats the whole value, so pasting works like typing. Phones ignore spaces, dashes and parentheses; card numbers and numerals drop separators; a pasted prefix or suffix that is already present is recognized instead of being added twice.'
        ),
      },
      caret: {
        question: text('Does Formatter keep the caret position?'),
        answer: text(
          'No. Formatter is a pure function and never reads the selection. Assigning the formatted value moves the caret to the end in most browsers, which suits fields typed from left to right. For editing in the middle, save selectionStart before formatting and restore an adjusted position with setSelectionRange(); the Styling and UX guide covers this.'
        ),
      },
      inputType: {
        question: text('Should I use type="number" or type="tel"?'),
        answer: text(
          'Use type="text" with an inputmode hint (numeric, decimal or tel) and the matching autocomplete value. type="number" rejects separators, prefixes and suffixes, so the formatted value cannot be shown in it.'
        ),
      },
      validation: {
        question: text('Does formatting validate the value?'),
        answer: text(
          'No. Formatting shapes input; it does not decide whether it is correct. Pair it with the regex catalog, which gives each pattern a ready error message for setCustomValidity() or your own UI, and always validate again on the server. Card formatting is not payment validation.'
        ),
      },
      countries: {
        question: text('Which countries and regional formats are supported?'),
        answer: text(
          'Phones use libphonenumber-js, so any ISO 3166-1 country code works, in upper or lower case; MX is the default. Numerals switch the decimal mark, grouping delimiter and currency position, and dates and times take any order of their segments.'
        ),
      },
      frameworks: {
        question: text('Can I use it with React, Vue, Svelte or a CMS?'),
        answer: text(
          'Yes. There is no adapter to install: call format() in the input handler you already have, store raw in state and render formatted. In Shopify or WordPress, load the CDN script once and attach listeners to your own fields. The framework guide has complete controlled-input examples.'
        ),
      },
      server: {
        question: text('Can I run it on the server?'),
        answer: text(
          'Yes. format() has no DOM access or timers, and its only module state is the one-time registerPhone() switch, so it runs in Node.js 20+, workers and tests with the same output. Use it to normalize imported data, render formatted values in emails, or re-check what a form submitted.'
        ),
      },
      size: {
        question: text('How large is it?'),
        answer: text(
          'The core is about 19 KB minified (7 KB gzip) with a bundler and has no runtime dependency. Phone support is opt-in: @samline/formatter/phone adds libphonenumber-js (about 143 KB minified). The browser scripts are about 25 KB without phones and 165 KB with them.'
        ),
      },
      errors: {
        question: text('What happens with empty or invalid input?'),
        answer: text(
          'null, undefined and empty strings return empty formatted and raw values. An unknown format type throws a TypeError, and a general mask without blocks throws a descriptive error; use isFormatType() to check a type that comes from configuration or a URL.'
        ),
      },
      upgrade: {
        question: text('Is upgrading from 2.x safe?'),
        answer: text(
          '3.0.0 makes phones opt-in: call registerPhone() from @samline/formatter/phone, or load formatter.phone.global.js instead of the renamed browser script. Every other format keeps its output. Read the changelog migration notes before you upgrade.'
        ),
      },
    },
  },
  callToAction: {
    eyebrow: 'A little structure goes a long way',
    heading: heading('Make every field', 'a clean one.'),
    description: 'Try a working field or format your first input.',
    docs: {
      description: `Installation, practical guides and the complete API for ${project.name} ${project.version}.`,
      label: 'Read the documentation',
    },
  },
} as const
