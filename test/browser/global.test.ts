import { describe, it, expect } from 'vitest'
import * as Formatter from '../../src/browser/global'
import { regex } from '../../src/core/regex'
import packageJson from '../../package.json'

describe('browser global entry', () => {
  it('exposes format, regex and version as named exports', () => {
    expect(Formatter.version).toBe(packageJson.version)
    expect(typeof Formatter.format).toBe('function')
    expect(Formatter.regex).toBe(regex)
  })

  it('has no default export that would shadow the IIFE namespace', () => {
    expect('default' in Formatter).toBe(false)
  })

  it('forwards format calls to the core formatter', () => {
    const result = Formatter.format('5512345678', 'phone')
    expect(result.formatted).toBe('55 1234 5678')
    expect(result.raw).toBe('5512345678')
    expect(result.type).toBe('phone')
  })

  it('throws TypeError on invalid formatType', () => {
    // @ts-expect-error — testing runtime guard
    expect(() => Formatter.format('hello', 'bogus')).toThrow(TypeError)
  })
})
