// Validation patterns exposed as public API for form consumers that pair
// formatting with validation. Each entry bundles the regex with a ready-to-use
// error message so consumers do not have to keep them in sync.

export const regex = {
  phone: {
    // 10 digit phone numbers, allowing for optional country code and delimiters
    pattern: /^(?:\D*\d){10}\D*$/,
    errorMessage: 'Please enter a valid 10-digit phone number.'
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
    errorMessage: 'Please enter a valid email address.'
  },
  rfc: {
    // Mexican RFC format (simplified)
    pattern: /^([A-ZÑ&]{3,4})\d{6}([A-Z0-9]{0,3})$/i,
    errorMessage: 'Please enter a valid RFC.'
  },
  numeral: {
    // Numbers with optional thousand separators and decimal points
    pattern: /\d{1,3}(,\d{3})*(\.\d+)?/,
    errorMessage: 'Please enter a valid number.'
  },
  onlyNumbers: {
    pattern: /^\d+$/,
    errorMessage: 'Please enter only numbers.'
  },
  creditCard: {
    // 15 or 16 digits, allowing spaces or delimiters
    pattern: /^(?:\D*\d){15,16}\D*$/,
    errorMessage: 'Please enter a valid card number.'
  },
  expirationDate: {
    // MM/YY format
    pattern: /^(0[1-9]|1[0-2])\/\d{2}$/,
    errorMessage: 'Please enter a valid expiration date.'
  },
  cardCvc: {
    // 3 or 4 digit card security codes
    pattern: /^\d{3,4}$/,
    errorMessage: 'Please enter a valid CVC.'
  },
  onlyLetters: {
    // Letters only (including accented characters and spaces)
    pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
    errorMessage: 'Please enter only letters.'
  },
  onlyAlphanumeric: {
    // Letters and numbers (including accented characters and spaces)
    pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s]+$/,
    errorMessage: 'Please enter only letters and numbers.'
  }
} as const

export type RegexKey = keyof typeof regex