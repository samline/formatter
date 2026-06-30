import { AsYouType, type CountryCode } from 'libphonenumber-js'

/**
 * Format a phone number string using `libphonenumber-js`'s `AsYouType`.
 *
 * Non-digit characters are stripped before formatting (the leading `+` is
 * preserved so international numbers keep their country prefix). After
 * formatting, spaces produced by `AsYouType` are swapped for `delimiter` when
 * a custom delimiter is provided.
 *
 * @param value - The raw input (digits, `+`, spaces, dashes, parentheses, etc.).
 * @param country - ISO 3166-1 alpha-2 country code (e.g. `'MX'`, `'US'`).
 * @param delimiter - Character used to separate groups in the output.
 * @returns The formatted phone string, or `''` when `value` is empty.
 */
export const formatPhone = (
  value: string,
  country: string = 'MX',
  delimiter: string = ' '
): string => {
  if (!value) return ''

  // Preserve '+' so international numbers keep their prefix.
  const digits = value.replace(/[^\d+]/g, '')
  const formatter = new AsYouType(country as CountryCode)
  const formatted = formatter.input(digits)

  if (delimiter !== ' ') {
    return formatted.replace(/ /g, delimiter)
  }

  return formatted
}