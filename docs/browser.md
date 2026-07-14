# Browser

The `@samline/formatter/browser` entrypoint is a pre-bundled IIFE that
registers `window.Formatter` for direct `<script>` usage in environments
without a bundler:

- Shopify themes
- WordPress templates
- Plain HTML pages

## When to use it

- You cannot install npm dependencies.
- You need to drop the package into a CMS template.
- You want a single global to call from inline `<script>` blocks.

## CDN usage

```html
<script src="https://unpkg.com/@samline/formatter@1.1.2/dist/browser/global.global.js"></script>
```

> Pin the version in production. Replace `1.1.2` with the version you ship.

## API

The global exposes `format`, `regex`, and `version`:

```html
<script src="https://unpkg.com/@samline/formatter@1.1.2/dist/browser/global.global.js"></script>
<script>
  // Format a phone number
  const result = window.Formatter.format('5512345678', 'phone')
  console.log(result.formatted) // '55 1234 5678'
  console.log(result.raw)       // '5512345678'

  // Validate an email
  const isValid = window.Formatter.regex.email.pattern.test('foo@bar.com')
  console.log(isValid) // true

  // Library version
  console.log(window.Formatter.version) // '1.1.2'
</script>
```

## Wiring to a form

```html
<input id="phone" type="text" inputmode="tel" autocomplete="tel">
<input id="phone_raw" type="hidden" name="phone_raw">

<script src="https://unpkg.com/@samline/formatter@1.1.2/dist/browser/global.global.js"></script>
<script>
  const input = document.getElementById('phone')
  const hidden = document.getElementById('phone_raw')

  input.addEventListener('input', () => {
    const { formatted, raw } = window.Formatter.format(input.value, 'phone')
    input.value = formatted
    hidden.value = raw
  })
</script>
```

## Caveats

- The IIFE bundle ships **two third-party libraries bundled in** (`cleave-zen`
  and `libphonenumber-js`). The browser bundle is around 250 KB unminified.
  If size matters and you can install npm packages, prefer the root entrypoint
  through your bundler so tree-shaking and code-splitting kick in.
- `version` is hardcoded at build time. If you bump the package version,
  update the pinned URL in your HTML accordingly.