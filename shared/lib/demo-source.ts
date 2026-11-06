import {
  scenarios,
  type DemoPreset,
  type Scenario,
  type ScenarioCheck,
} from '../i18n/translations/en/demo'
import demo from '../i18n/translations/en/demo'
import { project } from './project.mjs'

export type DemoMode = 'cdn' | 'esm'

const escape = (value: string) =>
  value.replace(
    /[&<>"]/g,
    character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!
  )

const scenario = (preset: DemoPreset): Scenario => scenarios[preset]

/** `regex.date` or `regex.digits(8)`, exactly as consumers write it. */
export const checkExpression = (check: ScenarioCheck) =>
  `regex.${check.key}${check.args ? `(${check.args.map(value => JSON.stringify(value)).join(', ')})` : ''}`

const literal = (value: unknown) =>
  JSON.stringify(value, null, 2)
    .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:')
    .replaceAll('"', "'")

/** The call shown above each preview, e.g. `format(value, 'phone', { country })`. */
export const callSignature = (preset: DemoPreset) => {
  const item = scenario(preset)
  if (!item.formatType) return 'regex[rule].pattern.test(value)'
  const keys = Object.keys(item.options)
  return `format(value, '${item.formatType}'${keys.length ? `, { ${keys.join(', ')} }` : ''})`
}

export const htmlFor = (preset: DemoPreset) => {
  const item = scenario(preset)
  const { field } = item
  const choice = item.choice
    ? `
  <label for="${item.choice.id}">${escape(item.choice.label)}</label>
  <select id="${item.choice.id}">
${item.choice.choices.map(([value, label]) => `    <option value="${value}"${value === item.choice!.initial ? ' selected' : ''}>${escape(label)}</option>`).join('\n')}
  </select>`
    : ''
  const validation = !item.formatType
  const status = item.check || validation
  const described = validation
    ? `${field.id}-status`
    : `${field.id}-raw${status ? ` ${field.id}-status` : ''}`
  const outputs = validation
    ? `
  <p>${demo.patternLabel}: <output data-pattern></output></p>`
    : `
  <input type="hidden" name="${field.name}">
  <p id="${field.id}-raw">${demo.rawLabel}: <output data-raw></output></p>${
    item.brand
      ? `
  <p>${item.brand.label}: <output data-brand></output></p>`
      : ''
  }`
  return `<div class="formatter-field">${choice}
  <label for="${field.id}">${escape(field.label)}</label>
  <input
    id="${field.id}"
    type="text"
    inputmode="${field.inputmode}"
    autocomplete="${field.autocomplete}"
    placeholder="${escape(field.placeholder)}"
    value="${escape(field.value)}"
    aria-describedby="${described}"
  >${outputs}${
    status
      ? `
  <p id="${field.id}-status" data-status aria-live="polite"></p>`
      : ''
  }
</div>`
}

export const stylesFor = (_preset?: DemoPreset) => `.formatter-field {
  display: grid;
  gap: 0.5rem;
  max-width: 24rem;
  padding: 1.5rem;
  border: 0.0625rem solid #c9d3b8;
  border-radius: 1rem;
  font: 1rem/1.6 system-ui, sans-serif;
}
.formatter-field label {
  font-weight: 600;
}
.formatter-field input,
.formatter-field select {
  padding: 0.75rem 0.875rem;
  border: 0.0625rem solid #9aa58a;
  border-radius: 0.5rem;
  font: inherit;
  font-variant-numeric: tabular-nums;
}
.formatter-field select {
  cursor: pointer;
}
.formatter-field input:focus-visible,
.formatter-field select:focus-visible {
  outline: 0.125rem solid ${project.accentLight};
  outline-offset: 0.125rem;
}
.formatter-field p {
  margin: 0;
  color: #4a5240;
}
.formatter-field output {
  font-family: ui-monospace, monospace;
  overflow-wrap: anywhere;
}
.formatter-field [data-status][data-valid="false"] {
  color: #9b2c2c;
}`

const validationScript = (preset: DemoPreset, mode: DemoMode) => {
  const item = scenario(preset)
  return [
    mode === 'esm'
      ? `import { regex } from '${project.npmName}'`
      : 'const { regex } = window.Formatter',
    '',
    `const field = document.querySelector('#${item.field.id}')`,
    `const ruleSelect = document.querySelector('#${item.choice!.id}')`,
    `const patternOutput = document.querySelector('[data-pattern]')`,
    `const status = document.querySelector('[data-status]')`,
    '',
    'const update = () => {',
    '  // Parametric entries such as password() are called for their default rule.',
    '  const entry = regex[ruleSelect.value]',
    "  const rule = typeof entry === 'function' ? entry() : entry",
    '  const valid = rule.pattern.test(field.value)',
    '  patternOutput.value = rule.pattern.source',
    '  status.dataset.valid = String(valid)',
    `  status.textContent = valid ? '${demo.validLabel}' : rule.errorMessage`,
    '}',
    '',
    "field.addEventListener('input', update)",
    "ruleSelect.addEventListener('change', update)",
    'update()',
  ].join('\n')
}

export const javascriptFor = (preset: DemoPreset, mode: DemoMode = 'cdn') => {
  const item = scenario(preset)
  if (!item.formatType) return validationScript(preset, mode)
  const { field } = item
  const hasCountry = item.choice?.role === 'country'
  const check = item.check
  const imports = check ? 'format, regex' : 'format'
  const staticOptions = Object.fromEntries(
    Object.entries(item.options).filter(([key]) => key !== 'country')
  )
  const options = hasCountry ? `{ ...options, country: country.value }` : 'options'
  const lines = [
    mode === 'esm'
      ? `import { ${imports} } from '${project.npmName}'`
      : `const { ${imports} } = window.Formatter`,
    '',
    `const field = document.querySelector('#${field.id}')`,
    `const hidden = document.querySelector('input[name="${field.name}"]')`,
    `const rawOutput = document.querySelector('[data-raw]')`,
    ...(hasCountry ? [`const country = document.querySelector('#${item.choice!.id}')`] : []),
    ...(item.brand ? [`const brand = document.querySelector('[data-brand]')`] : []),
    ...(check ? [`const status = document.querySelector('[data-status]')`] : []),
    `const options = ${literal(staticOptions)}`,
    ...(check ? [`const rule = ${checkExpression(check)}`] : []),
    '',
    'const update = () => {',
    `  const { formatted, raw } = format(field.value, '${item.formatType}', ${options})`,
    '  field.value = formatted',
    '  hidden.value = raw',
    `  rawOutput.value = raw || '${demo.emptyRaw}'`,
    ...(item.brand
      ? [`  brand.value = format(raw, 'creditCardType').formatted || '${item.brand.empty}'`]
      : []),
    ...(check
      ? [
          `  const valid = rule.pattern.test(${check.on})`,
          '  status.dataset.valid = String(valid)',
          `  status.textContent = valid ? '${check.valid}' : rule.errorMessage`,
        ]
      : []),
    '}',
    '',
    `field.addEventListener('input', update)`,
    ...(hasCountry ? [`country.addEventListener('change', update)`] : []),
    'update()',
  ]
  return lines.join('\n')
}

/** The shortest setup, used by Home's three steps. */
export const quickStart = {
  markup: `<label for="phone">Mobile phone</label>
<input id="phone" type="text" inputmode="tel" autocomplete="tel">
<input type="hidden" name="phone">`,
  script: (
    mode: DemoMode
  ) => `${mode === 'esm' ? `import { format } from '${project.npmName}'` : 'const { format } = window.Formatter'}

const field = document.querySelector('#phone')
const hidden = document.querySelector('input[name="phone"]')

field.addEventListener('input', () => {
  const { formatted, raw } = format(field.value, 'phone', { country: 'MX' })
  field.value = formatted
  hidden.value = raw
})`,
}
