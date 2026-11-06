import { scenarios, type DemoPreset, type ScenarioCheck } from '../i18n/translations/en/demo'
import demo from '../i18n/translations/en/demo'
import { project } from './project.mjs'

export type DemoMode = 'cdn' | 'esm'

const escape = (value: string) =>
  value.replace(
    /[&<>"]/g,
    character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]!
  )

/** `regex.date` or `regex.digits(8)`, exactly as consumers write it. */
export const checkExpression = (check: ScenarioCheck) =>
  `regex.${check.key}${check.args ? `(${check.args.map(value => JSON.stringify(value)).join(', ')})` : ''}`

const literal = (value: unknown) =>
  JSON.stringify(value, null, 2)
    .replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:')
    .replaceAll('"', "'")

export const htmlFor = (preset: DemoPreset) => {
  const item = scenarios[preset]
  const { field } = item
  const country =
    'country' in item
      ? `
  <label for="${item.country.id}">${item.country.label}</label>
  <select id="${item.country.id}">
${item.country.choices.map(([code, label]) => `    <option value="${code}"${code === item.options.country ? ' selected' : ''}>${escape(label)}</option>`).join('\n')}
  </select>`
      : ''
  return `<div class="formatter-field">${country}
  <label for="${field.id}">${escape(field.label)}</label>
  <input
    id="${field.id}"
    type="text"
    inputmode="${field.inputmode}"
    autocomplete="${field.autocomplete}"
    placeholder="${escape(field.placeholder)}"
    value="${escape(field.value)}"
    aria-describedby="${field.id}-raw${'check' in item ? ` ${field.id}-status` : ''}"
  >
  <input type="hidden" name="${field.name}">
  <p id="${field.id}-raw">${demo.rawLabel}: <output data-raw></output></p>${
    'brand' in item
      ? `
  <p>${item.brand.label}: <output data-brand></output></p>`
      : ''
  }${
    'check' in item
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
}
.formatter-field [data-status][data-valid="false"] {
  color: #9b2c2c;
}`

export const javascriptFor = (preset: DemoPreset, mode: DemoMode = 'cdn') => {
  const item = scenarios[preset]
  const { field } = item
  const hasCountry = 'country' in item
  const hasCheck = 'check' in item
  const hasBrand = 'brand' in item
  const imports = hasCheck ? 'format, regex' : 'format'
  const options = hasCountry ? `{ ...options, country: country.value }` : 'options'
  const staticOptions = Object.fromEntries(
    Object.entries(item.options).filter(([key]) => key !== 'country')
  )
  const lines = [
    mode === 'esm'
      ? `import { ${imports} } from '${project.npmName}'`
      : `const { ${imports} } = window.Formatter`,
    '',
    `const field = document.querySelector('#${field.id}')`,
    `const hidden = document.querySelector('input[name="${field.name}"]')`,
    `const rawOutput = document.querySelector('[data-raw]')`,
    ...(hasCountry ? [`const country = document.querySelector('#${item.country.id}')`] : []),
    ...(hasBrand ? [`const brand = document.querySelector('[data-brand]')`] : []),
    ...(hasCheck ? [`const status = document.querySelector('[data-status]')`] : []),
    `const options = ${literal(hasCountry ? staticOptions : item.options)}`,
    ...(hasCheck ? [`const rule = ${checkExpression(item.check)}`] : []),
    '',
    'const update = () => {',
    `  const { formatted, raw } = format(field.value, '${item.formatType}', ${options})`,
    '  field.value = formatted',
    '  hidden.value = raw',
    `  rawOutput.value = raw || '${demo.emptyRaw}'`,
    ...(hasBrand
      ? [`  brand.value = format(raw, 'creditCardType').formatted || '${item.brand.empty}'`]
      : []),
    ...(hasCheck
      ? [
          `  const valid = rule.pattern.test(${item.check.on})`,
          '  status.dataset.valid = String(valid)',
          `  status.textContent = valid ? '${item.check.valid}' : rule.errorMessage`,
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
