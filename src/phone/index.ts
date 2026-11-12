import { formatPhone } from '../core/phone.js'
import { setPhoneFormatter } from '../core/phone-registry.js'

export { formatPhone }
export { isPhoneRegistered } from '../core/phone-registry.js'

/**
 * Enable `format(value, 'phone')` for every entrypoint of the package.
 * Call it once at startup; repeated calls are harmless.
 */
export const registerPhone = (): void => {
  setPhoneFormatter(formatPhone)
}
