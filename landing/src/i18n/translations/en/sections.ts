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
    kicker: 'Input formatting for the open web.',
    title: project.name,
    titleAccent: 'Formatted and raw, at once.',
    description:
      'One pure function formats phones, amounts, dates, times, card numbers and custom masks as people type,',
    descriptionContinuation: 'and returns the clean value your backend expects alongside it.',
    footnotes: ['Pure function', 'Seven format types', 'Paired validation'],
    compatibilityLabel: 'Works anywhere JavaScript runs',
    platforms: ['Browsers', 'Node.js 20+', 'React', 'Vue', 'Svelte', 'Shopify', 'WordPress'],
  },
  features: {
    eyebrow: '01 / The package at a glance',
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
          'Phones through libphonenumber-js, numerals, dates, times, card numbers and brands through cleave-zen, plus general block masks.'
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
    eyebrow: '02 / Choose your integration',
    heading: heading('One function.', 'Three ways to load it.'),
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
    eyebrow: '03 / From install to interaction',
    heading: heading('Three steps.', 'A formatted field.'),
    integrationDescription:
      'Format the visible input on every keystroke and mirror the raw value into a hidden input that your form submits.',
    integrationLabel: 'Read the installation guide',
    steps: { install: 'Install', markup: 'Add two inputs', initialize: 'Format on input' },
    installLabel: 'Installation method',
    installTabs: [],
    fullExampleLabel: 'Copy complete working files',
    markupDescription:
      'A visible field for people and a hidden field with the name your backend reads.',
    examples: {
      markup: code('index.html', quickStartFiles.markup, 'html'),
      script: code('main.js', quickStartFiles.esm, 'javascript'),
    },
    docs: {
      description: 'Continue with every option, the regex catalog and the TypeScript types.',
      label: 'Explore the configuration reference',
    },
  },
  recipes: {
    eyebrow: '04 / Useful patterns',
    title: 'Small examples.',
    titleAccent: 'Practical context.',
    description:
      'Patterns that come up in real forms: server-filled values, regional numbers and validation messages.',
    examplesLabel: 'Explore working examples',
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
      docs: {
        question: text('Does Formatter keep the caret position?'),
        answer: text(
          'No. Formatter is a pure function and never reads the selection. Assigning the formatted value moves the caret to the end in most browsers; the Styling and UX guide explains how to restore it when people edit in the middle.'
        ),
      },
      copy: {
        question: text('Which value should I submit?'),
        answer: text(
          'Submit raw. It removes delimiters and decorations, keeps a leading + for international phones and uses the raw date or time pattern. Keep formatted only for display.'
        ),
      },
      changes: {
        question: text('Is it a replacement for server-side validation?'),
        answer: text(
          'No. The regex catalog gives quick feedback with consistent messages, and card formatting is not payment validation. Always validate again on the server.'
        ),
      },
    },
  },
  callToAction: {
    eyebrow: 'Format with confidence',
    heading: heading('Ready for the details?', 'Start here.'),
    description: 'Continue with installation, or look up a specific option or validation rule.',
    docs: {
      description: 'Guides, the complete option reference and release notes, in one place.',
      label: 'Read the documentation',
    },
  },
} as const
