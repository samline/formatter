/*
 * Portions of this engine are adapted from cleave-zen 0.0.17
 * (https://github.com/nosir/cleave-zen), Copyright (c) 2023 Max Huang,
 * released under the MIT License. See LICENSE.md for the full notice.
 */

import type { BlocksType, CreditCardType, DelimiterType, FormatCreditCardOptions } from './types.js'
import { getFormattedValue, getMaxLength, headStr, stripNonNumeric } from './utils.js'

const DEFAULT_CREDIT_CARD_DELIMITER = ' '
const GENERAL_BLOCKS: BlocksType = [4, 4, 4, 4]

/** Brand rules in priority order: the first matching prefix wins. */
const CREDIT_CARD_RULES: ReadonlyArray<
  readonly [Exclude<CreditCardType, 'general'>, RegExp, BlocksType]
> = [
  // starts with 1; 15 digits, not starts with 1800 (jcb card)
  ['uatp', /^(?!1800)1\d{0,14}/, [4, 5, 6]],
  // starts with 34/37; 15 digits
  ['amex', /^3[47]\d{0,13}/, [4, 6, 5]],
  // starts with 6011/65/644-649; 16 digits
  ['discover', /^(?:6011|65\d{0,2}|64[4-9]\d?)\d{0,12}/, [4, 4, 4, 4]],
  // starts with 300-305/309 or 36/38/39; 14 digits
  ['diners', /^3(?:0([0-5]|9)|[689]\d?)\d{0,11}/, [4, 6, 4]],
  // starts with 51-55/2221–2720; 16 digits. Upstream also matched 2220 and
  // 2721–2799; partial prefixes (222, 27, 272) still match while typing.
  ['mastercard', /^(?:5[1-5]|222(?:[1-9]|$)|22[3-9]|2[3-6]|27(?:[01]|20|2$|$))/, [4, 4, 4, 4]],
  // starts with 5019/4175/4571; 16 digits
  ['dankort', /^(5019|4175|4571)\d{0,12}/, [4, 4, 4, 4]],
  // starts with 637-639; 16 digits
  ['instapayment', /^63[7-9]\d{0,13}/, [4, 4, 4, 4]],
  // starts with 2131/1800; 15 digits
  ['jcb15', /^(?:2131|1800)\d{0,11}/, [4, 6, 5]],
  // starts with 35; 16 digits
  ['jcb', /^(?:35\d{0,2})\d{0,12}/, [4, 4, 4, 4]],
  // starts with 50/56-58/6304/67; 16 digits
  ['maestro', /^(?:5[0678]\d{0,2}|6304|67\d{0,2})\d{0,12}/, [4, 4, 4, 4]],
  // starts with 2200-2204; 16 digits
  ['mir', /^220[0-4]\d{0,12}/, [4, 4, 4, 4]],
  // starts with 4; 16 digits
  ['visa', /^4\d{0,15}/, [4, 4, 4, 4]],
  // starts with 62/81; 16 digits
  ['unionpay', /^(62|81)\d{0,14}/, [4, 4, 4, 4]],
]

/** `strictMode` extends the last block so the number can reach 19 digits. */
const getStrictBlocks = (blocks: BlocksType): BlocksType => blocks.concat(19 - getMaxLength(blocks))

const getCreditCardInfo = (
  value: string,
  strictMode: boolean
): { type: CreditCardType; blocks: BlocksType } => {
  for (const [type, pattern, blocks] of CREDIT_CARD_RULES) {
    if (pattern.test(value)) return { type, blocks: strictMode ? getStrictBlocks(blocks) : blocks }
  }
  return { type: 'general', blocks: strictMode ? getStrictBlocks(GENERAL_BLOCKS) : GENERAL_BLOCKS }
}

export const formatCreditCard = (value: string, options: FormatCreditCardOptions = {}): string => {
  const {
    delimiter = DEFAULT_CREDIT_CARD_DELIMITER,
    delimiterLazyShow = false,
    strictMode = false,
  } = options
  const digits = stripNonNumeric(value)
  const { blocks } = getCreditCardInfo(digits, strictMode)
  return getFormattedValue(headStr(digits, getMaxLength(blocks)), {
    blocks,
    delimiter,
    delimiterLazyShow,
  })
}

/** `delimiter` is accepted for API compatibility; non-digits are always ignored. */
export const getCreditCardType = (value: string, _delimiter?: DelimiterType): CreditCardType =>
  getCreditCardInfo(stripNonNumeric(value), false).type

export const unformatCreditCard = (value: string): string => stripNonNumeric(value)
