import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { readFile, readdir } from 'node:fs/promises'
import { codeColors } from '../shared/testing/code-colors'
import { project } from '../shared/lib/project.mjs'
const articles = (
  await readdir(new URL('../docs/src/content/docs/', import.meta.url), { recursive: true })
)
  .filter(path => /\.mdx?$/.test(path))
  .map(
    path =>
      'docs/' +
      path
        .replace(/\.mdx?$/, '')
        .replace(/(^|\/)index$/, '$1')
        .replace(/\/$/, '') +
      '/'
  )
const paths = [
  ...new Set([
    '',
    'examples/',
    'docs/',
    'docs/changelog/',
    ...articles.map(path => path.replace('docs//', 'docs/')),
  ]),
]
test('all routes share readable metadata and fit both themes and enlarged mobile text', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of paths) {
    await page.goto(path || './')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('meta[charset]')).toHaveCount(1)
    await expect(page.locator('meta[name=viewport]')).toHaveCount(1)
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
      'href',
      new URL(path, project.url).href
    )
    await expect(page.locator('meta[name=robots]')).toHaveAttribute(
      'content',
      project.template ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'
    )
    for (const width of [320, 768, 1440, 320]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => {
          document.documentElement.dataset.theme = theme
        }, theme)
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          `${path} ${width} ${theme}`
        ).toBe(true)
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `${path} enlarged: ${JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter(el => {
              let p = el.parentElement
              while (p && p !== document.body) {
                if (['hidden', 'clip', 'auto', 'scroll'].includes(getComputedStyle(p).overflowX))
                  return false
                p = p.parentElement
              }
              const r = el.getBoundingClientRect()
              return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1)
            })
            .slice(0, 12)
            .map(el => ({
              tag: el.tagName,
              class: el.className,
              text: el.textContent?.slice(0, 55),
              right: el.getBoundingClientRect().right,
            }))
        )
      )}`
    ).toBe(true)
  }
})
test('Home, Examples and Docs share the title font pairing and actual preview', async ({
  page,
}) => {
  for (const path of ['', 'examples/', 'docs/getting-started/']) {
    await page.goto(path || './')
    const styles = await page.locator('h1').evaluate(el => ({
      primary: getComputedStyle(el).fontFamily,
      weight: getComputedStyle(el).fontWeight,
      accent: getComputedStyle(el.querySelector('.serif')!).fontFamily,
      style: getComputedStyle(el.querySelector('.serif')!).fontStyle,
    }))
    expect(styles.primary).toContain('Inter')
    expect(styles.weight).toBe('500')
    expect(styles.accent).toContain('Instrument Serif')
    expect(styles.style).toBe('italic')
  }
  for (const path of ['', 'examples/', 'docs/guides/examples/']) {
    await page.goto(path || './')
    const demo = page.locator('package-site-demo').first()
    await expect(demo).toHaveAttribute('data-mounted', 'true')
    await demo.getByRole('button', { name: 'International', exact: true }).click()
    await expect(demo.locator('output[data-raw]')).toHaveText('+442079460958')
    await demo.getByRole('button', { name: 'Reset', exact: true }).click()
    await expect(demo.locator('[data-field]')).toHaveValue('55 1234 5678')
    await expect(demo.locator('output[data-raw]')).toHaveText('5512345678')
  }
})
test('file tabs copy exact highlighted source and feedback resets independently', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  for (const path of ['examples/', 'docs/getting-started/']) {
    await page.goto(path)
    if (path === 'examples/')
      await page.getByText('Explore the code', { exact: true }).first().click()
    const viewer = page.locator('[data-code-files]:visible').first()
    for (const label of ['HTML', 'CSS', 'JavaScript', 'Complete file']) {
      await viewer.getByRole('tab', { name: label, exact: true }).click()
      const panel = viewer.getByRole('tabpanel', { name: label, exact: true })
      const text = await panel.locator('code').textContent()
      expect(await panel.locator('code span[style]').count()).toBeGreaterThan(2)
      const copy = panel.getByRole('button')
      await copy.click()
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(text)
      await expect(copy).toContainText('Copied!')
      await expect(copy).toContainText('Copy', { timeout: 4000 })
    }
  }
})
test('copied CDN and ESM files run for all fifteen scenarios', async ({ page, context }) => {
  // The CDN URL is served from this checkout's build; this proves the copied
  // code, not unpkg availability or npm publication.
  const iife = readFileSync(new URL('../dist/browser/global.global.js', import.meta.url), 'utf8')
  // [typed, formatted, raw]; the validator has no raw, only a status.
  const cases: Record<string, [string, string, string]> = {
    phone: ['5598765432', '55 9876 5432', '5598765432'],
    amount: ['2500.755', '$2,500.75', '2500.75'],
    euro: ['2500,755', '2.500,75 €', '2500.75'],
    quantity: ['-0042', '42', '42'],
    date: ['24/12/2026', '24/12/2026', '2026-12-24'],
    expiry: ['0731', '07/31', '07/31'],
    time: ['1805', '18:05', '18:05'],
    card: ['5555555555554444', '5555 5555 5555 4444', '5555555555554444'],
    reference: ['11112222', 'ORD-1111-2222', '11112222'],
    weight: ['250', '250 kg', '250'],
    promo: ['save40', 'SAVE40', '40'],
    postal: ['100011234', '10001-1234', '100011234'],
    curp: ['lopj921215mdfrrs05', 'LOPJ921215MDFRRS05', 'LOPJ921215MDFRRS05'],
    color: ['00aa55', '#00AA55', '#00AA55'],
    validator: ['not-an-email', 'not-an-email', ''],
  }
  await page.goto('examples/')
  const example = await context.newPage()
  const errors: string[] = []
  example.on('pageerror', error => errors.push(error.message))
  await example.route('https://unpkg.com/**', route =>
    route.fulfill({ body: iife, contentType: 'text/javascript' })
  )
  // ESM files import the package by name; map it to the same build for the test.
  await example.route('https://example.test/formatter.js', route =>
    route.fulfill({
      body: 'export const { format, regex, version } = window.Formatter',
      contentType: 'text/javascript',
    })
  )
  for (const [preset, [input, formatted, raw]] of Object.entries(cases)) {
    const section = page.locator(`#${preset}`)
    await section.getByText('Explore the code', { exact: true }).click()
    for (const mode of ['HTML / CDN', 'Package / ESM']) {
      await section.getByRole('tab', { name: mode, exact: true }).click()
      const panel = section.getByRole('tabpanel', { name: mode, exact: true })
      const viewer = panel.locator('[data-code-files]')
      await viewer.getByRole('tab', { name: 'Complete file', exact: true }).click()
      let complete = (await viewer
        .getByRole('tabpanel', { name: 'Complete file', exact: true })
        .locator('code')
        .textContent())!
      if (mode === 'Package / ESM') {
        expect(complete).toContain("from '@samline/formatter'")
        complete = complete
          .replace("from '@samline/formatter'", "from 'https://example.test/formatter.js'")
          .replace(
            '<head>',
            () => `<head><script>${iife.replaceAll('</script', '<\\/script')}</script>`
          )
      } else expect(complete).toContain('https://unpkg.com/@samline/formatter@')
      // Navigate (instead of setContent) so each document gets fresh globals.
      const document = complete
      await example.route('https://example.test/index.html', route =>
        route.fulfill({ body: document, contentType: 'text/html' })
      )
      await example.goto('https://example.test/index.html')
      await example.unroute('https://example.test/index.html')
      expect(errors, `${preset} ${mode}`).toEqual([])
      const field = example.locator('input[type=text]')
      await expect(field).not.toHaveValue('')
      await field.fill(input)
      await expect(field, `${preset} ${mode}`).toHaveValue(formatted)
      if (preset === 'validator') {
        await expect(example.locator('[data-status]')).toHaveText(
          'Please enter a valid email address.'
        )
        await example.locator('select').selectOption('slug')
        await field.fill('my-post')
        await expect(example.locator('[data-status]')).toHaveText('Looks valid')
        continue
      }
      await expect(example.locator('input[type=hidden]')).toHaveValue(raw)
      await expect(example.locator('output[data-raw]')).toHaveText(raw)
    }
  }
  expect(errors).toEqual([])
  await example.close()
})
test('production Pagefind search returns meaningful links in a compact top drawer', async ({
  page,
}) => {
  await page.goto('docs/')
  await page.getByRole('button', { name: 'Search documentation', exact: true }).click()
  const input = page.getByRole('searchbox')
  await input.fill('configuration')
  await expect(page.getByRole('link', { name: /Configuration/ }).last()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(input).not.toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Search documentation', exact: true })
  ).toBeFocused()
})
test('mobile menu closes without moving the background and keeps docs last', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./#how')
  const before = await page.evaluate(() => scrollY)
  const trigger = page.getByRole('button', { name: 'Open navigation menu' })
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const links = page.getByRole('navigation', { name: 'Mobile navigation' }).locator('.menu-link')
  await expect(links.last()).toHaveText(/Docs/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThanOrEqual(1)
})
test('no JavaScript preserves content, code, alternative installs and mobile navigation', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 },
  })
  const page = await context.newPage()
  await page.goto(new URL(project.base, test.info().project.use.baseURL as string).href)
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('code').filter({ hasText: 'pnpm add' })).toBeVisible()
  await page.locator('.menu-fallback summary').click()
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible()
  await context.close()
})
test('all pages pass automated accessibility checks in both themes', async ({ page }) => {
  test.setTimeout(120000)
  const axe = await readFile(
    new URL('../node_modules/axe-core/axe.min.js', import.meta.url),
    'utf8'
  )
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of paths) {
    await page.goto(path || './')
    await page.addScriptTag({ content: axe })
    for (const theme of ['dark', 'light']) {
      await page.evaluate(async theme => {
        document.documentElement.dataset.theme = theme
        await document.fonts.ready
        await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {})))
      }, theme)
      const violations = await page.evaluate(async () => {
        const result = await (window as any).axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] },
        })
        return result.violations.map((item: any) => ({
          id: item.id,
          nodes: item.nodes.map((n: any) => n.target),
        }))
      })
      expect(violations, `${path} ${theme}`).toEqual([])
    }
  }
})

test('highlighting has the same computed palette across all three routes', async ({ page }) => {
  for (const theme of ['dark', 'light']) {
    let reference: unknown
    for (const path of ['', 'examples/', 'docs/getting-started/']) {
      await page.goto(path || './')
      await page.evaluate(theme => {
        document.documentElement.dataset.theme = theme
      }, theme)
      if (path === 'examples/')
        await page.getByText('Explore the code', { exact: true }).first().click()
      const code = path
        ? page.locator('[data-code-files] pre[data-language=html]:visible').first()
        : page.locator('#how pre[data-language=html]:visible').first()
      const colors = await code.evaluate(codeColors)
      for (const token of Object.values(colors)) expect(token.actual).toBe(token.expected)
      if (reference) expect(colors).toEqual(reference)
      else reference = colors
    }
  }
})
test('ToC follows the clicked section and anchors retain the 2.5rem header gap', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 500 })
  await page.goto('docs/getting-started/')
  const nav = page.locator('.desktop-toc').getByRole('navigation', { name: 'On this page' })
  const target = nav.getByRole('link', { name: 'Quick start', exact: true })
  await target.click()
  await expect(target).toHaveAttribute('aria-current', 'location')
  const spacing = await page.locator('#quick-start').evaluate(el => ({
    gap:
      el.getBoundingClientRect().top -
      document.querySelector('package-site-docs-header')!.getBoundingClientRect().bottom,
    expected: parseFloat(getComputedStyle(document.documentElement).fontSize) * 2.5,
  }))
  expect(Math.abs(spacing.gap - spacing.expected)).toBeLessThan(2)
})

test('selects are styled controls and the package skill downloads its source', async ({ page }) => {
  await page.goto('examples/')
  const select = page.locator('#phone select')
  const style = await select.evaluate(el => ({
    cursor: getComputedStyle(el).cursor,
    appearance: getComputedStyle(el).appearance,
    padding: parseFloat(getComputedStyle(el).paddingRight),
  }))
  expect(style).toMatchObject({ cursor: 'pointer', appearance: 'none' })
  expect(style.padding).toBeGreaterThan(30)
  await expect(page.locator('#phone .select-field svg')).toBeVisible()
  for (const link of [
    page.locator('footer a[download="SKILL.md"]'),
    page.locator('.resources a[download="SKILL.md"]'),
  ]) {
    const href = (await link.getAttribute('href'))!
    expect(href).toBe(`${project.base}skills/formatter/SKILL.md`)
    const response = await page.request.get(href)
    expect(await response.text()).toBe(
      readFileSync(new URL('../skills/formatter/SKILL.md', import.meta.url), 'utf8')
    )
  }
})
