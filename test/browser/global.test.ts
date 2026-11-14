import { describe, it, expect } from 'vitest'
import * as Formatter from '../../src/browser/global'
import { regex } from '../../src/core/regex'
import { setPhoneFormatter } from '../../src/core/phone-registry'
import packageJson from '../../package.json'

describe('browser global entry', () => {
  it('exposes format, intl, regex and version as named exports', () => {
    expect(Formatter.version).toBe(packageJson.version)
    expect(typeof Formatter.format).toBe('function')
    expect(Formatter.regex).toBe(regex)
    expect(typeof Formatter.intl.formatCurrency).toBe('function')
  })

  it('has no default export that would shadow the IIFE namespace', () => {
    expect('default' in Formatter).toBe(false)
  })

  it('does not include phone support', () => {
    setPhoneFormatter(undefined)
    expect(() => Formatter.format('5512345678', 'phone')).toThrow(/registerPhone/)
  })

  it('throws TypeError on invalid formatType', () => {
    // @ts-expect-error — testing runtime guard
    expect(() => Formatter.format('hello', 'bogus')).toThrow(TypeError)
  })
})

describe('browser phone entry', () => {
  it('registers phone support when loaded', async () => {
    const Phone = await import('../../src/browser/phone')
    const result = Phone.format('5512345678', 'phone')
    expect(result).toEqual({ formatted: '55 1234 5678', raw: '5512345678', type: 'phone' })
    expect(Object.keys(Phone).sort()).toEqual(['checks', 'format', 'intl', 'regex', 'version'])
  })
})
