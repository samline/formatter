import { describe, it, expect } from 'vitest'
import { formatPhone } from '../../src/core/phone'

describe('formatPhone', () => {
  it('returns empty string for empty input', () => {
    expect(formatPhone('')).toBe('')
  })

  it('formats a 10-digit MX number with spaces by default', () => {
    const formatted = formatPhone('5512345678')
    expect(formatted).toBe('55 1234 5678')
  })

  it('preserves a leading + for international numbers', () => {
    const formatted = formatPhone('+5215512345678', 'MX')
    expect(formatted.startsWith('+52')).toBe(true)
    expect(formatted).toMatch(/^\+52\s?\d+/)
  })

  it('strips non-digit characters before formatting', () => {
    const formatted = formatPhone('(55) 1234-5678')
    expect(formatted).toBe('55 1234 5678')
  })

  it('uses a custom delimiter', () => {
    const formatted = formatPhone('5512345678', 'MX', '-')
    expect(formatted).toBe('55-1234-5678')
    expect(formatted).not.toContain(' ')
  })

  it('formats a US number when country is US', () => {
    const formatted = formatPhone('2025551234', 'US')
    // US format typically is (202) 555-1234
    expect(formatted).toBe('(202) 555-1234')
  })

  it('returns just digits when raw input has only digits', () => {
    expect(formatPhone('123')).toBe('123')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(formatPhone('   ')).toBe('')
  })
})