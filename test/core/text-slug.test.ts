import { describe, expect, it } from 'vitest'

import { format, getRawValue } from '../../src'

describe("'text' type", () => {
  it('applies every case mode', () => {
    expect(format('the lord of the rings', 'text', { case: 'title' }).formatted).toBe(
      'The Lord Of The Rings'
    )
    expect(
      format('el señor de los anillos', 'text', { case: 'title', smallWords: ['de', 'los'] })
        .formatted
    ).toBe('El Señor de los Anillos')
    expect(format('HELLO world', 'text', { case: 'sentence' }).formatted).toBe('Hello world')
    expect(format('hello World', 'text', { case: 'capitalize' }).formatted).toBe('Hello World')
    expect(format('Hola', 'text', { case: 'upper' }).formatted).toBe('HOLA')
    expect(format('Hola', 'text', { case: 'lower' }).formatted).toBe('hola')
    expect(format('istanbul', 'text', { case: 'upper', locale: 'tr' }).formatted).toBe('İSTANBUL')
  })

  it('keeps the legacy flags and returns raw equal to the display value', () => {
    expect(format('abc', 'text', { uppercase: true })).toEqual({
      formatted: 'ABC',
      raw: 'ABC',
      type: 'text',
    })
    expect(format('Same', 'text').formatted).toBe('Same')
    expect(format('', 'text', { case: 'title' })).toEqual({ formatted: '', raw: '', type: 'text' })
  })
})

describe("'slug' type", () => {
  it('keeps a trailing separator while typing and trims raw', () => {
    expect(format('Mi Página ', 'slug')).toEqual({
      formatted: 'mi-pagina-',
      raw: 'mi-pagina',
      type: 'slug',
    })
    expect(format('¡Hola, Ñandú!', 'slug')).toEqual({
      formatted: 'hola-nandu-',
      raw: 'hola-nandu',
      type: 'slug',
    })
  })

  it('supports the separator, replacements, maxLength and locale', () => {
    expect(format('Pan & Café', 'slug', { delimiter: '_', replacements: { '&': 'y' } })).toEqual({
      formatted: 'pan_y_cafe',
      raw: 'pan_y_cafe',
      type: 'slug',
    })
    expect(format('the quick brown fox', 'slug', { maxLength: 12 }).raw).toBe('the-quick')
    expect(format('ISTANBUL', 'slug', { locale: 'tr' }).raw).toBe('istanbul')
    expect(getRawValue('mi-pagina-', 'slug')).toBe('mi-pagina')
  })

  it('is stable when reformatting its own output', () => {
    const first = format('Hello World', 'slug')
    expect(format(first.formatted, 'slug')).toEqual(first)
  })
})

describe("'general' case modes", () => {
  it('title-cases masked input', () => {
    expect(
      format('abcdef', 'general', { blocks: [3, 3], delimiter: ' ', case: 'capitalize' }).formatted
    ).toBe('Abc def')
  })
})
