import { readFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { createContext, runInContext } from 'node:vm'
import { describe, it, expect } from 'vitest'
import packageJson from '../../package.json'

const root = fileURLToPath(new URL('../../', import.meta.url))
const dist = (path: string): string => `${root}dist/${path}`

describe('built package', () => {
  it('has been built', () => {
    expect(existsSync(dist('index.js')), 'run `npm run build` first').toBe(true)
  })

  it('registers a usable window.Formatter from the IIFE as a classic script', () => {
    const source = readFileSync(dist('browser/global.global.js'), 'utf8')
    // A classic script shares one global object with `window`, so the
    // IIFE's top-level `var Formatter` and `window.Formatter` are the same.
    const context: Record<string, unknown> = {}
    context.window = context
    createContext(context)
    runInContext(source, context)
    const global = context.Formatter as Record<string, unknown>

    expect(Object.keys(global).sort()).toEqual(['format', 'regex', 'version'])
    expect(global.version).toBe(packageJson.version)
    const format = global.format as (value: string, type: string) => { formatted: string; raw: string }
    expect(format('5512345678', 'phone')).toMatchObject({ formatted: '55 1234 5678', raw: '5512345678' })
  })

  it('exposes the same public names from ESM and CommonJS', async () => {
    const esm = await import(dist('index.js'))
    const cjs = createRequire(import.meta.url)(dist('index.cjs'))
    expect(Object.keys(esm).sort()).toEqual(Object.keys(cjs).sort())
    for (const name of ['format', 'regex', 'isFormatType', 'FORMAT_TYPES', 'formatPhone', 'getRawValue']) {
      expect(esm).toHaveProperty(name)
    }
    expect(esm.format('1234567', 'numeral').formatted).toBe('1,234,567')
  })

  it('exposes the vanilla subpath', async () => {
    const vanilla = await import(dist('vanilla/index.js'))
    expect(typeof vanilla.format).toBe('function')
  })
})
