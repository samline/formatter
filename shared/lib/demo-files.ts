import { format, resolveConfig } from 'prettier'
import demo, { scenarios, type DemoPreset } from '../i18n/translations/en/demo'
import controls from '../i18n/translations/en/controls'
import { htmlFor, javascriptFor, stylesFor, quickStart, type DemoMode } from './demo-source'
import { project } from './project.mjs'

export type { DemoMode }

// Read formatting options once at build time. Every consumer shares the same files.
const options = await resolveConfig(process.cwd())

const documentFor = (separate: boolean, preset: DemoPreset, mode: DemoMode) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${scenarios[preset].title}</title>
${separate ? '<link rel="stylesheet" href="./style.css">' : `<style>\n${stylesFor(preset)}\n</style>`}
</head>

<body>
<main>
${htmlFor(preset)}
</main>

${mode === 'cdn' && project.delivery.cdnScript ? `<script src="${project.delivery.cdnScript}"></script>` : ''}
${
  separate
    ? mode === 'esm'
      ? '<script type="module" src="./main.js"></script>'
      : '<script src="./main.js" defer></script>'
    : `<script${mode === 'esm' ? ' type="module"' : ''}>\n${javascriptFor(preset, mode)}\n</script>`
}
</body>
</html>`

const cache = new Map<string, ReturnType<typeof build>>()
const build = async (preset: DemoPreset, mode: DemoMode) => ({
  files: [
    {
      id: 'html',
      label: controls.codeFiles.html,
      filename: 'index.html',
      language: 'html' as const,
      code: await format(documentFor(true, preset, mode), { ...options, parser: 'html' }),
    },
    {
      id: 'css',
      label: controls.codeFiles.css,
      filename: 'style.css',
      language: 'css' as const,
      code: await format(stylesFor(preset), { ...options, parser: 'css' }),
    },
    {
      id: 'javascript',
      label: controls.codeFiles.javascript,
      filename: 'main.js',
      language: 'javascript' as const,
      code: await format(javascriptFor(preset, mode), { ...options, parser: 'babel' }),
    },
  ],
  complete: {
    code: await format(documentFor(false, preset, mode), { ...options, parser: 'html' }),
  },
  markup: await format(htmlFor(preset), { ...options, parser: 'html' }),
})

/** Formatted files for one scenario and loading mode, generated once per build. */
export const createDemoFiles = (preset: DemoPreset = 'phone', mode: DemoMode = 'cdn') => {
  const key = `${preset}:${mode}`
  if (!cache.has(key)) cache.set(key, build(preset, mode))
  return cache.get(key)!
}

export const quickStartFiles = {
  markup: await format(quickStart.markup, { ...options, parser: 'html' }),
  esm: await format(quickStart.script('esm'), { ...options, parser: 'babel' }),
  cdn: await format(quickStart.script('cdn'), { ...options, parser: 'babel' }),
}

export const demoFiles = createDemoFiles()
export { demo }
