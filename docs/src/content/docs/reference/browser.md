---
locale: en
sidebar:
  group: reference
  order: 5
title: 'HTML / CDN'
titleAccent: 'CDN'
description: 'Use @samline/formatter without a bundler: the two minified CDN scripts, window.Formatter and wiring it to a form.'
---

@samline/formatter ships two pre-built **IIFE bundles** that work in plain HTML pages, Shopify themes, WordPress templates, or any project without a bundler. Both define the same `window.Formatter`; they differ only in phone support.

| File                                     | Phone support         | Size (minified)           |
| ---------------------------------------- | --------------------- | ------------------------- |
| `dist/browser/formatter.global.js`       | no (`'phone'` throws) | about 25 KB (9 KB gzip)   |
| `dist/browser/formatter.phone.global.js` | registered on load    | about 165 KB (41 KB gzip) |

## Browser bundle

Load the phone build when the page formats phones:

```html
<script src="https://cdn.jsdelivr.net/npm/@samline/formatter@3.1.0/dist/browser/formatter.phone.global.js"></script>
<script>
  const result = window.Formatter.format('5512345678', 'phone')
  // => { formatted: '55 1234 5678', raw: '5512345678', type: 'phone' }
</script>
```

Every other format works with the smaller core build:

```html
<script src="https://cdn.jsdelivr.net/npm/@samline/formatter@3.1.0/dist/browser/formatter.global.js"></script>
<script>
  window.Formatter.format('1234567.891', 'numeral').formatted // '1,234,567.89'
  window.Formatter.intl.formatCurrency(1234.5, { locale: 'es-MX', currency: 'MXN' }) // '$1,234.50'
</script>
```

## `Formatter` global interface

```ts
interface FormatterGlobal {
  /** Format any value using the core formatter. */
  format: (value: unknown, formatType: FormatType, options?: FormatOptions) => FormatterResult
  /** Intl display helpers, the same functions as `@samline/formatter/intl`. */
  intl: typeof import('@samline/formatter/intl')
  /** Validation regex patterns with paired error messages. */
  regex: typeof regex
  /** Library version. */
  version: string
}
```

## Usage example

```html
<input type="text" id="phone" placeholder="55 1234 5678" />
<input type="hidden" id="phone-raw" name="phone" />

<script src="https://unpkg.com/@samline/formatter@3.1.0/dist/browser/formatter.phone.global.js"></script>
<script>
  const phoneInput = document.getElementById('phone')
  const phoneRaw = document.getElementById('phone-raw')

  phoneInput.addEventListener('input', e => {
    const result = window.Formatter.format(e.target.value, 'phone', {
      country: 'MX',
    })
    // Update visible field with formatted value
    e.target.value = result.formatted
    // Update hidden field with raw value for form submission
    phoneRaw.value = result.raw
  })
</script>
```

## CDN options

| CDN      | Core URL                                                                                 | Phone URL                                                                                      |
| -------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| jsDelivr | `https://cdn.jsdelivr.net/npm/@samline/formatter@3.1.0/dist/browser/formatter.global.js` | `https://cdn.jsdelivr.net/npm/@samline/formatter@3.1.0/dist/browser/formatter.phone.global.js` |
| unpkg    | `https://unpkg.com/@samline/formatter@3.1.0/dist/browser/formatter.global.js`            | `https://unpkg.com/@samline/formatter@3.1.0/dist/browser/formatter.phone.global.js`            |

These URLs intentionally pin the current release instead of `latest`, so you can
choose the exact package version to ship. Both scripts are minified and ship a
source map; there is no separate `.min.js` file.

> **Upgrade note.** 3.0.0 renamed `dist/browser/global.global.js`. Replace it with
> `formatter.phone.global.js` to keep phones, or with `formatter.global.js` when the page
> formats none. In 2.0.x a classic `<script>` left `window.Formatter` as `{ default }`;
> that was fixed in 2.1.0.
