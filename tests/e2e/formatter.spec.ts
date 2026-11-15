import { expect, test } from './fixtures'

test('the core bundle exposes window.Formatter without phones or a default export', async ({
  load,
}) => {
  const page = await load('<main></main>', 'formatter')
  const shape = await page.evaluate(() => {
    const api = (window as any).Formatter
    return {
      format: typeof api.format,
      hasDefault: 'default' in api,
      numeral: api.format('1234567.891', 'numeral').formatted,
    }
  })
  expect(shape).toEqual({ format: 'function', hasDefault: false, numeral: '1,234,567.89' })
})

test('the phone bundle registers phones and the date add-on extends the global', async ({
  load,
}) => {
  const page = await load('<main></main>', 'formatter.phone', 'formatter.date')
  const result = await page.evaluate(() => {
    const api = (window as any).Formatter
    return {
      phone: api.format('5512345678', 'phone', { phoneRegionCode: 'MX' }).raw,
      date: typeof api.date?.formatDatePattern,
    }
  })
  expect(result.phone).toBe('5512345678')
  expect(result.date).toBe('function')
})

test('formatting a live input keeps the raw value stable as the user types', async ({ load }) => {
  const page = await load('<input aria-label="Card">', 'formatter')
  await page.evaluate(() => {
    const input = document.querySelector('input')!
    input.addEventListener('input', () => {
      const result = (window as any).Formatter.format(input.value, 'creditCard')
      input.value = result.formatted
      input.dataset.raw = result.raw
    })
  })
  await page.getByLabel('Card').pressSequentially('4111111111111111')
  await expect(page.getByLabel('Card')).toHaveValue('4111 1111 1111 1111')
  await expect(page.getByLabel('Card')).toHaveAttribute('data-raw', '4111111111111111')
})
