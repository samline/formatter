import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createContext, runInContext } from 'node:vm'
import { gzipSync } from 'node:zlib'
import { describe, it, expect } from 'vitest'
import packageJson from '../../package.json'

const root = fileURLToPath(new URL('../../', import.meta.url))
const dist = (path: string): string => `${root}dist/${path}`

describe('built package', () => {
  it('has been built', () => {
    expect(existsSync(dist('index.js')), 'run `npm run build` first').toBe(true)
  })

  const runClassicScript = (file: string): Record<string, unknown> => {
    // A classic script shares one global object with `window`, so the
    // IIFE's top-level `var Formatter` and `window.Formatter` are the same.
    const context: Record<string, unknown> = {}
    context.window = context
    createContext(context)
    runInContext(readFileSync(dist(file), 'utf8'), context)
    return context.Formatter as Record<string, unknown>
  }
  type Format = (value: string, type: string) => { formatted: string; raw: string }

  it('registers a usable window.Formatter without phone support', () => {
    const global = runClassicScript('browser/formatter.global.js')
    expect(Object.keys(global).sort()).toEqual(['checks', 'format', 'intl', 'regex', 'version'])
    expect(global.version).toBe(packageJson.version)
    const format = global.format as Format
    expect(format('1234567', 'numeral').formatted).toBe('1,234,567')
    expect(() => format('5512345678', 'phone')).toThrow(/registerPhone/)
    const intl = global.intl as { formatCurrency: (value: number, options: object) => string }
    expect(intl.formatCurrency(1234.5, { locale: 'en-US', currency: 'USD' })).toBe('$1,234.50')
  })

  it('registers phone support from the phone IIFE', () => {
    const global = runClassicScript('browser/formatter.phone.global.js')
    expect(Object.keys(global).sort()).toEqual(['checks', 'format', 'intl', 'regex', 'version'])
    const format = global.format as Format
    expect(format('5512345678', 'phone')).toMatchObject({
      formatted: '55 1234 5678',
      raw: '5512345678',
    })
  })

  it('keeps the core inside its size budget', () => {
    // Budgets documented in README and docs/reference/entrypoints.md, all
    // without libphonenumber-js: an app importing only `format` stays under
    // 17 KB minified (7 KB gzip), which proves `regex` and the check-digit
    // validators tree-shake away; every root export together stays under
    // 32 KB (12 KB gzip); the core IIFE (everything plus intl) under 36 KB.
    const dir = mkdtempSync(join(tmpdir(), 'formatter-size-'))
    const bundle = (source: string): Buffer => {
      const entry = join(dir, `${Math.random().toString(36).slice(2)}.mjs`)
      const out = `${entry}.out.js`
      writeFileSync(entry, source)
      execFileSync('bun', ['build', entry, '--minify', '--target=browser', `--outfile=${out}`], {
        stdio: 'ignore',
      })
      return readFileSync(out)
    }

    const formatOnly = bundle(
      `import { format } from ${JSON.stringify(dist('index.js'))}\nconsole.log(format)`
    )
    expect(formatOnly.byteLength).toBeLessThan(17 * 1024)
    expect(gzipSync(formatOnly).byteLength).toBeLessThan(7 * 1024)

    const checkOnly = bundle(
      `import { isValidIban } from ${JSON.stringify(dist('index.js'))}\nconsole.log(isValidIban)`
    )
    expect(checkOnly.byteLength).toBeLessThan(3 * 1024)

    const everything = bundle(
      `import * as all from ${JSON.stringify(dist('index.js'))}\nconsole.log(all)`
    )
    expect(everything.byteLength).toBeLessThan(32 * 1024)
    expect(gzipSync(everything).byteLength).toBeLessThan(12 * 1024)

    const iife = readFileSync(dist('browser/formatter.global.js'))
    expect(iife.byteLength).toBeLessThan(36 * 1024)
    expect(readFileSync(dist('browser/formatter.phone.global.js')).byteLength).toBeLessThan(
      185 * 1024
    )
  })

  it('shares one phone registry across ESM entrypoints', async () => {
    const root = await import(dist('index.js'))
    const vanilla = await import(dist('vanilla/index.js'))
    const phone = await import(dist('phone/index.js'))
    phone.registerPhone()
    expect(root.isPhoneRegistered()).toBe(true)
    expect(root.format('5512345678', 'phone').formatted).toBe('55 1234 5678')
    expect(vanilla.format('5512345678', 'phone').formatted).toBe('55 1234 5678')
  })

  it('shares one phone registry across CommonJS entrypoints', () => {
    const require = createRequire(import.meta.url)
    const root = require(dist('index.cjs'))
    const vanilla = require(dist('vanilla/index.cjs'))
    const phone = require(dist('phone/index.cjs'))
    phone.registerPhone()
    expect(root.format('5512345678', 'phone').formatted).toBe('55 1234 5678')
    expect(vanilla.format('5512345678', 'phone').formatted).toBe('55 1234 5678')
  })

  it('exposes the intl subpath in ESM and CommonJS', async () => {
    const esm = await import(dist('intl/index.js'))
    const cjs = createRequire(import.meta.url)(dist('intl/index.cjs'))
    const names = [
      'formatCurrency',
      'formatDate',
      'formatNumber',
      'formatPercent',
      'formatRelativeTime',
    ]
    expect(Object.keys(esm).sort()).toEqual(names)
    expect(Object.keys(cjs).sort()).toEqual(names)
    expect(esm.formatNumber(1234.5, { locale: 'en-US', decimals: 2 })).toBe('1,234.50')
  })

  it('exposes the date subpath in ESM and CommonJS, sharing formatRelativeTime with intl', async () => {
    const esm = await import(dist('date/index.js'))
    const cjs = createRequire(import.meta.url)(dist('date/index.cjs'))
    expect(Object.keys(esm).sort()).toEqual(Object.keys(cjs).sort())
    for (const name of [
      'parseDate',
      'formatDatePattern',
      'addDate',
      'diffDate',
      'createDate',
      'formatDuration',
      'formatRelativeTime',
    ]) {
      expect(esm).toHaveProperty(name)
    }
    const intl = await import(dist('intl/index.js'))
    expect(esm.formatRelativeTime).toBe(intl.formatRelativeTime)
    const date = esm.parseDate('12/11/2026', { format: 'DD/MM/YYYY', timeZone: 'UTC' })
    expect(
      esm.formatDatePattern(esm.addDate(date, 1, 'month', { timeZone: 'UTC' }), 'YYYY-MM-DD', {
        timeZone: 'UTC',
      })
    ).toBe('2026-12-12')
    expect(cjs.diffDate('2026-12-24', '2026-12-20', 'day')).toBe(4)
  })

  it('adds window.Formatter.date from the date add-on, reusing intl.formatRelativeTime', () => {
    const context: Record<string, unknown> = {}
    context.window = context
    createContext(context)
    runInContext(readFileSync(dist('browser/formatter.global.js'), 'utf8'), context)
    runInContext(readFileSync(dist('browser/formatter.date.global.js'), 'utf8'), context)
    const global = context.Formatter as Record<
      'date' | 'intl',
      Record<string, (...args: unknown[]) => unknown>
    >
    expect(Object.keys(global).sort()).toEqual([
      'checks',
      'date',
      'format',
      'intl',
      'regex',
      'version',
    ])
    expect(global.date.formatRelativeTime).toBe(global.intl.formatRelativeTime)
    expect(global.date.formatDatePattern!('2026-11-12', 'D MMMM YYYY', { locale: 'en-US' })).toBe(
      '12 November 2026'
    )

    const alone = runClassicScript('browser/formatter.date.global.js') as Record<
      'date',
      Record<string, unknown>
    >
    expect(Object.keys(alone)).toEqual(['date'])
    expect(alone.date.formatRelativeTime).toBeUndefined()
  })

  it('keeps the date tools inside their size budget', () => {
    // Budget documented in README and docs/reference/date.md: every date
    // function together under 30 KB minified and 10 KB gzip.
    const out = join(mkdtempSync(join(tmpdir(), 'formatter-date-')), 'date.js')
    execFileSync(
      'bun',
      ['build', dist('date/index.js'), '--minify', '--target=browser', `--outfile=${out}`],
      { stdio: 'ignore' }
    )
    const date = readFileSync(out)
    expect(date.byteLength).toBeLessThan(30 * 1024)
    expect(gzipSync(date).byteLength).toBeLessThan(10 * 1024)
    const addOn = readFileSync(dist('browser/formatter.date.global.js'))
    expect(addOn.byteLength).toBeLessThan(26 * 1024)
    expect(gzipSync(addOn).byteLength).toBeLessThan(10 * 1024)
  })

  it('does not depend on cleave-zen at runtime', () => {
    expect(Object.keys(packageJson.dependencies)).toEqual(['libphonenumber-js'])
    expect(readFileSync(dist('index.js'), 'utf8')).not.toMatch(/from ["']cleave-zen["']/)
  })

  it('exposes the same public names from ESM and CommonJS', async () => {
    const esm = await import(dist('index.js'))
    const cjs = createRequire(import.meta.url)(dist('index.cjs'))
    expect(Object.keys(esm).sort()).toEqual(Object.keys(cjs).sort())
    for (const name of [
      'format',
      'regex',
      'isFormatType',
      'FORMAT_TYPES',
      'isPhoneRegistered',
      'getRawValue',
    ]) {
      expect(esm).toHaveProperty(name)
    }
    for (const name of ['formatPhone', 'registerPhone']) {
      expect(esm).not.toHaveProperty(name)
    }
    expect(esm.format('1234567', 'numeral').formatted).toBe('1,234,567')
  })

  it('exposes the vanilla subpath', async () => {
    const vanilla = await import(dist('vanilla/index.js'))
    expect(typeof vanilla.format).toBe('function')
  })

  it('publishes only the runtime, its declarations and release notes', () => {
    const [packed] = JSON.parse(
      execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
        cwd: root,
        encoding: 'utf8',
      })
    ) as [{ files: { path: string }[] }]
    const files = packed.files.map(file => file.path)
    for (const required of [
      'package.json',
      'README.md',
      'LICENSE.md',
      'CHANGELOG.md',
      'dist/index.js',
      'dist/index.cjs',
      'dist/index.d.ts',
      'dist/vanilla/index.js',
      'dist/phone/index.js',
      'dist/phone/index.cjs',
      'dist/intl/index.js',
      'dist/intl/index.cjs',
      'dist/date/index.js',
      'dist/date/index.cjs',
      'dist/date/index.d.ts',
      'dist/browser/formatter.global.js',
      'dist/browser/formatter.date.global.js',
      'dist/browser/formatter.phone.global.js',
    ])
      expect(files).toContain(required)
    expect(
      files.filter(
        file => !/^(dist\/|package\.json$|README\.md$|LICENSE\.md$|CHANGELOG\.md$)/.test(file)
      )
    ).toEqual([])
  })
})
