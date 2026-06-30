import { describe, it, expect } from 'vitest'
import * as root from '../src'
import { regex } from '../src/core/regex'

describe('root entrypoint', () => {
  it('re-exports format from the core', () => {
    expect(typeof root.format).toBe('function')
  })

  it('re-exports regex from the core', () => {
    expect(root.regex).toBe(regex)
  })

  it('returns a consistent result through the root surface', () => {
    const result = root.format('4111111111111111', 'creditCard')
    expect(result.formatted).toBe('4111 1111 1111 1111')
    expect(result.raw).toBe('4111111111111111')
    expect(result.type).toBe('creditCard')
  })

  it('exposes FORMAT_TYPES and isFormatType', () => {
    expect(root.FORMAT_TYPES).toContain('phone')
    expect(root.isFormatType('phone')).toBe(true)
    expect(root.isFormatType('bogus')).toBe(false)
  })
})