/**
 * Phone support is opt-in so the core does not bundle libphonenumber-js.
 * `registerPhone()` from `@samline/formatter/phone` stores the formatter
 * here; every entrypoint shares this module through a common chunk.
 */
export type PhoneFormatter = (value: string, country: string, delimiter: string) => string

let phoneFormatter: PhoneFormatter | undefined

export const PHONE_NOT_REGISTERED_MESSAGE =
  "Phone formatting is not enabled. Import { registerPhone } from '@samline/formatter/phone' and call registerPhone() once, or load dist/browser/formatter.phone.global.js."

/** @internal Used by `registerPhone()`; not part of the documented API. */
export const setPhoneFormatter = (formatter: PhoneFormatter | undefined): void => {
  phoneFormatter = formatter
}

/** @internal */
export const getPhoneFormatter = (): PhoneFormatter | undefined => phoneFormatter

/** Whether `registerPhone()` has enabled `format(value, 'phone')`. */
export const isPhoneRegistered = (): boolean => phoneFormatter !== undefined
