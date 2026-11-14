import { registerPhone } from '../phone/index.js'

/*
 * Browser build with phone support. Loading this script registers the
 * phone formatter before exposing the same named exports as the core build
 * (`checks`, `format`, `intl`, `regex`, `version`) on `window.Formatter`.
 */
registerPhone()

export { checks, format, intl, regex, version } from './global.js'
export type { FormatterGlobal } from './global.js'
