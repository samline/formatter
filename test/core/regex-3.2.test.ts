import { isIPv4, isIPv6 } from 'node:net'
import { describe, expect, it } from 'vitest'
import { format } from '../../src/core/formatter'
import { regex } from '../../src/core/regex'

type Case = [string, boolean]
const check = (entry: { pattern: RegExp }, cases: Case[]): void => {
  for (const [value, expected] of cases)
    expect([value, entry.pattern.test(value)]).toEqual([value, expected])
}

describe('regex 3.2 fixes', () => {
  it('phone and card accept separators only, never letters', () => {
    check(regex.phone, [
      ['(55) 1234-5678', true],
      ['55.1234.5678', true],
      ['+52 55 1234 5678', false],
      ['abc5512345678', false],
      ['55-1234-5678x', false],
    ])
    expect(regex.phone({ length: 12 }).pattern.test('+52 55 1234 5678')).toBe(true)
    check(regex.creditCard, [
      ['4111 1111 1111 1111', true],
      ['4111-1111-1111-1111', true],
      ['3056 930902 5904', true],
      ['card 4111 1111 1111 1111 ok', false],
    ])
    expect(regex.creditCard.errorMessage).toBe('Please enter a valid card number (12-19 digits).')
  })

  it('email rejects malformed local parts and domains', () => {
    check(regex.email, [
      ['ana.perez+tag@mail.example.mx', true],
      ["o'brien@example.com", true],
      ['user@xn--80ak6aa92e.com', true],
      ['ana@peña.mx', true],
      ['a@.com', false],
      ['a..b@c.com', false],
      ['.a@c.com', false],
      ['a.@c.com', false],
      ['a@b..com', false],
      ['a@-b.com', false],
      ['<a>@b.com', false],
      ['a,b@c.com', false],
      ['a@b.c', false],
      [`${'a'.repeat(65)}@b.com`, false],
    ])
  })

  it('RFC and CURP check dates, homoclave, sex and state', () => {
    check(regex.rfc, [
      ['GODE561231GR8', true],
      ['ABC680524P76', true],
      ['XAXX010101000', true],
      ['gode561231gr8', true],
      ['GODE5613129Q2', false],
      ['GODE561232GR8', false],
      ['GODE561231', false],
      ['GODE561231GRB', false],
    ])
    check(regex.curp, [
      ['GODE561231HDFRRN09', true],
      ['PEXJ800101MNERRN0A', false],
      ['PEXJ800101MNERRNA1', true],
      ['GODE561331HDFRRN09', false],
      ['GODE561231ZDFRRN09', false],
      ['GODE561231HQQRRN09', false],
      ['GBDE561231HDFRRN09', false],
      ['GODE561231HDFRAN09', false],
    ])
  })

  it('cp, clabe and nss', () => {
    check(regex.cp, [
      ['06600', true],
      ['01000', true],
      ['00123', false],
    ])
    check(regex.clabe, [
      ['002010077777777771', true],
      ['00201007777777777', false],
    ])
    check(regex.nss, [
      ['12345678901', true],
      ['1234567890', false],
    ])
  })

  it('letters accept every script and reject blank or multi-line values', () => {
    check(regex.onlyLetters, [
      ['Güemes', true],
      ['François Ñúñez', true],
      ['Ελένη', true],
      ['   ', false],
      ['line\nbreak', false],
      ['tab\there', false],
    ])
    check(regex.onlyAlphanumeric, [
      ['Calle 5 Ote', true],
      ['   ', false],
    ])
    check(regex.personName, [
      ['María José', true],
      ["O'Connor", true],
      ['D’Artagnan', true],
      ['Pérez-Gómez', true],
      ['Ma. Fernanda', true],
      ['J. R. R. Tolkien', true],
      ['Juan  Pérez', false],
      [' Juan', false],
      ['Juan3', false],
      ['--', false],
    ])
  })

  it('url needs a real host; domain has no protocol', () => {
    check(regex.url, [
      ['https://ejemplo.mx/ruta?q=1#top', true],
      ['http://localhost:3000', true],
      ['http://192.168.0.1:8080/x', true],
      ['http://[::1]:3000', true],
      ['ftp://user@files.example.com', true],
      ['https://münchen.de', true],
      ['http://', false],
      ['https://.', false],
      ['https://example', false],
      ['https://exa mple.com', false],
    ])
    expect(regex.url({ protocol: 'all' }).pattern.test('ftp://x.com')).toBe(true)
    expect(regex.url({ protocol: 'https' }).pattern.test('http://x.com')).toBe(false)
    check(regex.domain, [
      ['example.com', true],
      ['sub.dominio.com.mx', true],
      ['https://example.com', false],
      ['example', false],
      ['-bad.com', false],
    ])
  })

  it('IP patterns agree with node:net', () => {
    const samples = [
      '::',
      '::1',
      '2001:db8::1',
      'fe80::',
      '1:2:3:4:5:6:7::',
      '::ffff:192.168.0.1',
      '64:ff9b::192.0.2.1',
      '1:2:3:4:5:6:1.2.3.4',
      '1:2:3:4:5:6:7:8',
      '1:2:3:4:5:6:7:8:9',
      ':::1',
      '1::2::3',
      '12345::1',
      '::ffff:256.1.1.1',
      'g::1',
    ]
    for (const value of samples)
      expect([value, regex.ipv6.pattern.test(value)]).toEqual([value, isIPv6(value)])
    for (const value of [
      '192.168.0.1',
      '0.0.0.0',
      '255.255.255.255',
      '01.02.03.004',
      '256.1.1.1',
      '1.1.1',
    ])
      expect([value, regex.ipv4.pattern.test(value)]).toEqual([value, isIPv4(value)])
  })

  it('uuid accepts versions 1–8 and can pin one', () => {
    check(regex.uuid, [
      ['550e8400-e29b-41d4-a716-446655440000', true],
      ['0190a6a4-5b2c-7c3e-8f1a-2b3c4d5e6f70', true],
      ['0190a6a4-5b2c-0c3e-8f1a-2b3c4d5e6f70', false],
      ['0190a6a4-5b2c-7c3e-cf1a-2b3c4d5e6f70', false],
    ])
    expect(regex.uuid({ version: 4 }).pattern.test('0190a6a4-5b2c-7c3e-8f1a-2b3c4d5e6f70')).toBe(
      false
    )
    expect(regex.uuid({ version: 7 }).errorMessage).toBe('Please enter a valid UUID v7.')
    expect(() => regex.uuid({ version: 9 })).toThrow(RangeError)
  })

  it('colors, hashtags and mentions', () => {
    check(regex.hexColor, [
      ['#FFF', true],
      ['#FFF8', true],
      ['#11223344', true],
      ['#12345', false],
    ])
    check(regex.hashtag, [
      ['#méxico', true],
      ['#año2026', true],
      ['#123', false],
      ['#a-b', false],
    ])
    check(regex.mention, [
      ['@juan.perez', true],
      ['@2pac', true],
      ['@a..b', false],
      ['@.a', false],
      [`@${'a'.repeat(31)}`, false],
    ])
  })

  it('dates are real calendar dates', () => {
    check(regex.date, [
      ['2028-02-29', true],
      ['2000-02-29', true],
      ['1900-02-29', false],
      ['2026-02-29', false],
      ['2026-02-30', false],
      ['2026-04-31', false],
      ['2026-12-31', true],
    ])
    const dmy = regex.date({ datePattern: ['d', 'm', 'Y'] })
    check(dmy, [
      ['29/02/2028', true],
      ['31/04/2026', false],
      ['2026-12-31', false],
    ])
    expect(dmy.errorMessage).toBe('Please enter a valid date (DD/MM/YYYY).')
    check(regex.date({ datePattern: ['m', 'd', 'y'], delimiter: '-' }), [
      ['02-29-28', true],
      ['02-29-27', false],
    ])
    check(regex.isoDateTime, [
      ['2026-11-13T09:30', true],
      ['2026-11-13T09:30:15.250Z', true],
      ['2026-11-13 09:30:15-06:00', true],
      ['2026-02-30T09:30', false],
      ['2026-11-13T24:00', false],
    ])
  })

  it('times', () => {
    check(regex.time24, [
      ['23:59', true],
      ['23:59:59', true],
      ['24:00', false],
    ])
    check(regex.time12, [
      ['9:30 pm', true],
      ['09:30:15 AM', true],
      ['9:30 p. m.', true],
      ['13:00 pm', false],
      ['9:30', false],
    ])
    check(regex.time(), [
      ['23:59:59', true],
      ['23:59', false],
    ])
    check(regex.time({ timePattern: ['h', 'm'], timeFormat: '12' }), [
      ['12:00', true],
      ['00:00', false],
    ])
  })

  it('parametric patterns accept what the masks write', () => {
    const numeralOptions = [
      {},
      { delimiter: '.', numeralDecimalMark: ',' },
      { numeralThousandsGroupStyle: 'lakh' as const },
      { numeralThousandsGroupStyle: 'wan' as const },
      { numeralThousandsGroupStyle: 'none' as const },
      { prefix: '$ ' },
      { prefix: ' MXN', tailPrefix: true },
      { prefix: '$', signBeforePrefix: true },
      { numeralDecimalScale: 0 },
      { numeralPositiveOnly: true },
    ]
    for (const options of numeralOptions) {
      for (const raw of ['0', '7', '-1234567.89', '1234', '98765432.1']) {
        const { formatted } = format(raw, 'numeral', options)
        expect([options, formatted, regex.numeral(options).pattern.test(formatted)]).toEqual([
          options,
          formatted,
          true,
        ])
      }
    }
    expect(regex.numeral({ delimiter: '.', numeralDecimalMark: ',' }).pattern.test('1,234.5')).toBe(
      false
    )
    expect(regex.numeral({ numeralDecimalScale: 2 }).pattern.test('1.234')).toBe(false)

    const dateOptions = { datePattern: ['m', 'd', 'Y'] as ['m', 'd', 'Y'], delimiter: '-' }
    expect(
      regex.date(dateOptions).pattern.test(format('12/31/2026', 'date', dateOptions).formatted)
    ).toBe(true)
    expect(regex.time().pattern.test(format('235959', 'time').formatted)).toBe(true)
  })

  it('MAC, semver and Base64', () => {
    check(regex.macAddress, [
      ['00:1B:44:11:3A:B7', true],
      ['00-1B-44-11-3A-B7', true],
      ['001b.4411.3ab7', true],
      ['00:1B-44:11-3A:B7', false],
    ])
    check(regex.semver, [
      ['1.2.3', true],
      ['1.2.3-rc.1', true],
      ['1.2.3+build.5', true],
      ['1.2.3-alpha.1+sha.abc', true],
      ['1.2.3-01', false],
      ['1.2.3-a..b', false],
      ['1.2.3-.', false],
      ['01.2.3', false],
    ])
    check(regex.base64, [
      ['SGVsbG8=', true],
      ['', false],
      ['SGVsbG8', false],
    ])
    check(regex.base64url, [
      ['eyJhbGciOiJIUzI1NiJ9', true],
      ['SGVsbG8', true],
      ['a+b/', false],
      ['', false],
    ])
  })

  it('latitude and longitude', () => {
    check(regex.latitude, [
      ['19.4326', true],
      ['-90', true],
      ['90.0', true],
      ['90.1', false],
      ['91', false],
    ])
    check(regex.longitude, [
      ['-99.1332', true],
      ['180', true],
      ['180.5', false],
      ['181', false],
    ])
  })

  it('password rules understand non-ASCII letters and any symbol', () => {
    expect(regex.password().pattern.test('contraseÑa1')).toBe(true)
    expect(regex.password({ special: true }).pattern.test('Passw0rd~')).toBe(true)
    expect(regex.password({ special: true }).pattern.test('Passw0rd€')).toBe(true)
    expect(regex.password({ special: true }).pattern.test('Passw0rd')).toBe(false)
  })

  it('no pattern backtracks catastrophically on long input', () => {
    const inputs = [
      `${'a.'.repeat(5000)}!`,
      `a@${'a.'.repeat(5000)}!`,
      `http://${'a.'.repeat(5000)}!`,
      `${'1:'.repeat(3000)}g`,
      `${"a'".repeat(5000)}1`,
    ]
    const patterns = Object.values(regex).flatMap(entry =>
      'pattern' in entry && entry.pattern ? [entry.pattern] : []
    )
    const start = performance.now()
    for (const pattern of patterns) for (const input of inputs) pattern.test(input)
    expect(performance.now() - start).toBeLessThan(500)
  })
})
