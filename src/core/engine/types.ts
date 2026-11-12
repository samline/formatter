/*
 * Portions of this engine are adapted from cleave-zen 0.0.17
 * (https://github.com/nosir/cleave-zen), Copyright (c) 2023 Max Huang,
 * released under the MIT License. See LICENSE.md for the full notice.
 */

export type DelimiterType = string
export type BlocksType = number[]

export type DateUnit = 'Y' | 'y' | 'm' | 'd'
export type DatePatternType = DateUnit[]

export type TimeUnit = 'h' | 'm' | 's'
export type TimePatternType = TimeUnit[]
export type TimeFormatType = '12' | '24'

export type NumeralThousandsGroupStyle = 'thousand' | 'lakh' | 'wan' | 'none'

export type CreditCardType =
  | 'uatp'
  | 'amex'
  | 'diners'
  | 'discover'
  | 'mastercard'
  | 'dankort'
  | 'instapayment'
  | 'jcb15'
  | 'jcb'
  | 'maestro'
  | 'visa'
  | 'mir'
  | 'unionpay'
  | 'general'

export interface FormatGeneralOptions {
  blocks: BlocksType
  delimiterLazyShow?: boolean
  delimiter?: DelimiterType
  delimiters?: DelimiterType[]
  prefix?: string
  numericOnly?: boolean
  uppercase?: boolean
  lowercase?: boolean
}

export interface FormatNumeralOptions {
  delimiter?: DelimiterType
  numeralThousandsGroupStyle?: NumeralThousandsGroupStyle
  numeralIntegerScale?: number
  numeralDecimalMark?: string
  numeralDecimalScale?: number
  /**
   * Pad the decimal part of `formatted` with zeros up to
   * `numeralDecimalScale` (`1,234.5` → `1,234.50`). Defaults to `false`.
   * Intended for display or blur, not for every keystroke.
   */
  numeralDecimalPadding?: boolean
  numeralPositiveOnly?: boolean
  tailPrefix?: boolean
  stripLeadingZeroes?: boolean
  signBeforePrefix?: boolean
  prefix?: string
}

export interface FormatDateOptions {
  delimiterLazyShow?: boolean
  delimiter?: DelimiterType
  datePattern?: DatePatternType
  dateMin?: string
  dateMax?: string
}

export interface FormatTimeOptions {
  delimiterLazyShow?: boolean
  delimiter?: DelimiterType
  timePattern?: TimePatternType
  timeFormat?: TimeFormatType
}

export interface FormatCreditCardOptions {
  delimiter?: string
  strictMode?: boolean
  delimiterLazyShow?: boolean
}
