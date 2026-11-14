import { afterEach, describe, expect, it } from 'vitest'
import { format, isPhoneRegistered, type FormatOptions } from '../../src'
import { setPhoneFormatter } from '../../src/core/phone-registry'
import { formatPhone, registerPhone } from '../../src/phone'

describe('3.0.0: phone support is opt-in', () => {
  afterEach(() => setPhoneFormatter(undefined))

  it('throws a TypeError that explains how to enable phones', () => {
    setPhoneFormatter(undefined)
    expect(isPhoneRegistered()).toBe(false)
    expect(() => format('5512345678', 'phone')).toThrow(TypeError)
    expect(() => format('5512345678', 'phone')).toThrow(/registerPhone\(\)/)
    // An empty value is still a configuration error, so it fails early too.
    expect(() => format('', 'phone')).toThrow(/registerPhone\(\)/)
  })

  it('keeps every other format working without phone support', () => {
    setPhoneFormatter(undefined)
    expect(format('1234567', 'numeral').formatted).toBe('1,234,567')
  })

  it('behaves exactly as 2.x once registered', () => {
    registerPhone()
    registerPhone() // idempotent
    expect(isPhoneRegistered()).toBe(true)
    expect(format('5512345678', 'phone')).toEqual({
      formatted: '55 1234 5678',
      raw: '5512345678',
      type: 'phone',
    })
    expect(format('2025551234', 'phone', { country: 'US', delimiter: '-' }).formatted).toBe(
      '(202)-555-1234'
    )
    expect(formatPhone('5512345678', 'MX', '-')).toBe('55-1234-5678')
  })
})

describe('3.0.0: numeralDecimalPadding through format()', () => {
  const pad = { numeralDecimalPadding: true } as const

  it('pads formatted and keeps raw unpadded and dot-decimal', () => {
    expect(format('1234567.5', 'numeral', pad)).toEqual({
      formatted: '1,234,567.50',
      raw: '1234567.5',
      type: 'numeral',
    })
    expect(format('1234', 'numeral', pad)).toMatchObject({ formatted: '1,234.00', raw: '1234' })
    expect(format('-1234.5', 'numeral', pad)).toMatchObject({
      formatted: '-1,234.50',
      raw: '-1234.5',
    })
    expect(format('1200', 'numeral', pad)).toMatchObject({ formatted: '1,200.00', raw: '1200' })
    expect(format('0.5', 'numeral', pad)).toMatchObject({ formatted: '0.50', raw: '0.5' })
  })

  it('supports prefix, tail prefix and custom decimal marks', () => {
    expect(format('1234.5', 'numeral', { ...pad, prefix: '$' })).toMatchObject({
      formatted: '$1,234.50',
      raw: '1234.5',
    })
    expect(format('1234.5', 'numeral', { ...pad, prefix: ' MXN', tailPrefix: true })).toMatchObject(
      {
        formatted: '1,234.50 MXN',
        raw: '1234.5',
      }
    )
    expect(
      format('1234,5', 'numeral', { ...pad, numeralDecimalMark: ',', delimiter: '.' })
    ).toMatchObject({ formatted: '1.234,50', raw: '1234.5' })
  })

  it('keeps raw stable when the padded value is formatted again', () => {
    for (const value of ['1234.5', '1234', '0.05', '-7.10', '1234.']) {
      const first = format(value, 'numeral', pad)
      const second = format(first.formatted, 'numeral', pad)
      expect(second).toEqual(first)
    }
  })

  it('leaves the default output unchanged', () => {
    expect(format('1234.5', 'numeral')).toMatchObject({ formatted: '1,234.5', raw: '1234.5' })
    expect(format('1234.50', 'numeral')).toMatchObject({ formatted: '1,234.50', raw: '1234.50' })
  })
})

describe('3.0.0: engine audit through format()', () => {
  it('keeps the sign in raw when a prefix with M sits after it', () => {
    expect(format('-5', 'numeral', { prefix: 'MXN ', signBeforePrefix: true })).toMatchObject({
      formatted: '-MXN 5',
      raw: '-5',
    })
  })

  it('formats comma-decimal numerals without an explicit delimiter', () => {
    expect(format('1234,5', 'numeral', { numeralDecimalMark: ',' })).toMatchObject({
      formatted: '1.234,5',
      raw: '1234.5',
    })
  })

  it('matches affixes with the same casing the mask displays', () => {
    // lowercase wins over uppercase in both the mask and affix matching.
    const options: FormatOptions = {
      blocks: [8],
      prefix: 'ab',
      prefixMode: 'passthrough',
      uppercase: true,
      lowercase: true,
    }
    expect(format('AB12', 'general', options)).toMatchObject({ formatted: 'ab12' })
  })
})

describe('3.0.0: rawDecimalPadding', () => {
  it('pads raw to numeralDecimalScale, with or without padded display', () => {
    const raw = { rawDecimalPadding: true } as const
    expect(format('1234.5', 'numeral', raw)).toMatchObject({ formatted: '1,234.5', raw: '1234.50' })
    expect(format('1234', 'numeral', raw)).toMatchObject({ formatted: '1,234', raw: '1234.00' })
    expect(format('1234.5', 'numeral', { ...raw, numeralDecimalPadding: true })).toMatchObject({
      formatted: '1,234.50',
      raw: '1234.50',
    })
    expect(format('-0.5', 'numeral', raw).raw).toBe('-0.50')
    expect(format('.5', 'numeral', raw).raw).toBe('0.50')
    expect(format('1.5', 'numeral', { ...raw, numeralDecimalScale: 4 }).raw).toBe('1.5000')
    expect(format('12.5', 'numeral', { ...raw, numeralDecimalScale: 0 }).raw).toBe('12')
    expect(format('-', 'numeral', raw).raw).toBe('-')
  })

  it('works with prefixes and comma decimal marks', () => {
    expect(
      format('1234,5', 'numeral', { numeralDecimalMark: ',', prefix: '$', rawDecimalPadding: true })
    ).toMatchObject({
      formatted: '$1.234,5',
      raw: '1234.50',
    })
  })

  it('keeps raw stable when the value is formatted again', () => {
    for (const options of [
      { rawDecimalPadding: true },
      { rawDecimalPadding: true, numeralDecimalPadding: true },
    ]) {
      for (const value of ['1234.5', '1234', '0.05', '-7.1', '1234.']) {
        const first = format(value, 'numeral', options)
        expect(format(first.formatted, 'numeral', options)).toEqual(first)
      }
    }
  })
})
