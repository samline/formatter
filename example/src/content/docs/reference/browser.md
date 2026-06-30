---
title: Browser
description: Using @samline/formatter directly in the browser without a bundler.
sidebar:
  order: 5
---

@samline/formatter ships a pre-built **IIFE bundle** that works in plain HTML pages, Shopify themes, WordPress templates, or any project without a bundler.

## Browser bundle

The browser bundle exposes a global `window.Formatter` object:

```html
<script src="https://cdn.jsdelivr.net/npm/@samline/formatter/dist/formatter.iife.min.js"></script>
<script>
  const result = window.Formatter.format('5512345678', 'phone')
  // => { formatted: '55 1234 5678', raw: '5512345678', type: 'phone' }
</script>
```

## `Formatter` global interface

```ts
interface FormatterGlobal {
  /** Format any value using the core formatter. */
  format: (value: unknown, formatType: FormatType, options?: FormatOptions) => FormatterResult
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

<script>
  const phoneInput = document.getElementById('phone')
  const phoneRaw = document.getElementById('phone-raw')

  phoneInput.addEventListener('input', (e) => {
    const result = window.Formatter.format(e.target.value, 'phone', {
      country: 'MX'
    })
    // Update visible field with formatted value
    e.target.value = result.formatted
    // Update hidden field with raw value for form submission
    phoneRaw.value = result.raw
  })
</script>
```

## CDN options

| CDN | URL |
| --- | --- |
| jsDelivr | `https://cdn.jsdelivr.net/npm/@samline/formatter/dist/formatter.iife.min.js` |
| unpkg | `https://unpkg.com/@samline/formatter/dist/formatter.iife.min.js` |

Replace `iife.min.js` with `iife.js` for the unminified version during development.
