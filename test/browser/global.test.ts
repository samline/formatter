import { describe, it, expect } from 'vitest'
import Formatter from '../../src/browser/global'
import { regex } from '../../src/core/regex'

describe('browser global bundle', () => {
  it('exposes the Formatter global with format, regex, and version', () => {
    expect(Formatter.version).toBe('1.1.1')
    expect(typeof Formatter.format).toBe('function')
    expect(Formatter.regex).toBe(regex)
  })

  it('attaches itself to window.Formatter', () => {
    expect(window.Formatter).toBeDefined()
    expect(window.Formatter?.format).toBe(Formatter.format)
    expect(window.Formatter?.regex).toBe(Formatter.regex)
  })

  it('forwards format calls to the core formatter', () => {
    const result = window.Formatter?.format('5512345678', 'phone')
    expect(result?.formatted).toBe('55 1234 5678')
    expect(result?.raw).toBe('5512345678')
    expect(result?.type).toBe('phone')
  })

  it('exposes validation regex', () => {
    expect(window.Formatter?.regex.email.pattern.test('foo@bar.com')).toBe(true)
  })

  it('throws TypeError on invalid formatType', () => {
    // @ts-expect-error — testing runtime guard
    expect(() => window.Formatter?.format('hello', 'bogus')).toThrow(TypeError)
  })
})