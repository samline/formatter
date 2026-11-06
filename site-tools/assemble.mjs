import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { project } from '../shared/lib/project.mjs'
await cp(
  new URL('../docs/dist/', import.meta.url),
  new URL('../landing/dist/docs/', import.meta.url),
  { recursive: true }
)
const index = new URL('../landing/dist/sitemap-index.xml', import.meta.url)
const [landing, docs] = await Promise.all([
  readFile(index, 'utf8'),
  readFile(new URL('../docs/dist/sitemap-index.xml', import.meta.url), 'utf8'),
])
await writeFile(
  index,
  landing.replace(
    '</sitemapindex>',
    (docs.match(/<sitemap>.*?<\/sitemap>/g) ?? []).join('') + '</sitemapindex>'
  )
)
await writeFile(new URL('../landing/dist/.nojekyll', import.meta.url), '')

// The retired Starlight site (formatter <= 2.0.3) served articles from the site
// root. Keep those public URLs, including their fragments, working.
const legacy = {
  'getting-started': 'getting-started',
  'guides/formatting-with-frameworks': 'guides/frameworks',
  'guides/styling-and-ux': 'guides/styling-and-ux',
  reference: 'reference/api',
  'reference/api': 'reference/api',
  'reference/configuration': 'reference/configuration',
  'reference/recipes': 'guides/recipes',
  'reference/regex': 'reference/regex',
  'reference/entrypoints': 'reference/entrypoints',
  'reference/browser': 'reference/browser',
  'reference/typescript': 'reference/typescript',
}
for (const [old, route] of Object.entries(legacy)) {
  const target = project.docsBase + route + '/'
  const directory = new URL('../landing/dist/' + old + '/', import.meta.url)
  await mkdir(directory, { recursive: true })
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${project.name} documentation</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${new URL(target, project.origin)}"></head><body><p>Continue to <a href="${target}">${project.name} documentation</a>.</p><script>location.replace(${JSON.stringify(target)} + location.hash)</script></body></html>`
  await writeFile(new URL('index.html', directory), html)
}
console.log('Combined landing, examples, docs, search, fonts and sitemap into landing/dist.')
