import { rm } from 'node:fs/promises'
import { defineConfig, type Options } from 'tsup'

const builds: Options[] = [
  {
    // One build for every module entry so they share chunks. Phone support
    // registers into a module-level registry that must be a single instance
    // across `.`, `./vanilla` and `./phone` (in ESM and in CommonJS).
    entry: {
      index: 'src/index.ts',
      'vanilla/index': 'src/vanilla/index.ts',
      'phone/index': 'src/phone/index.ts',
      'intl/index': 'src/intl/index.ts',
      'date/index': 'src/date/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    target: 'es2020',
    outDir: 'dist',
    clean: false,
    sourcemap: true,
    splitting: true,
    treeshake: true,
  },
  {
    entry: { formatter: 'src/browser/global.ts' },
    format: ['iife'],
    dts: true,
    target: 'es2020',
    outDir: 'dist/browser',
    clean: false,
    globalName: 'Formatter',
    platform: 'browser',
    minify: true,
    sourcemap: true,
  },
  {
    // Same global API plus phone support (bundles libphonenumber-js metadata).
    entry: { 'formatter.phone': 'src/browser/phone.ts' },
    format: ['iife'],
    dts: true,
    target: 'es2020',
    outDir: 'dist/browser',
    clean: false,
    globalName: 'Formatter',
    platform: 'browser',
    minify: true,
    sourcemap: true,
  },
  {
    // Add-on for pages without a build step: load after formatter.global.js
    // (or formatter.phone.global.js) and it adds `window.Formatter.date`.
    entry: { 'formatter.date': 'src/browser/date.ts' },
    format: ['iife'],
    dts: true,
    target: 'es2020',
    outDir: 'dist/browser',
    clean: false,
    platform: 'browser',
    minify: true,
    sourcemap: true,
  },
]

export default defineConfig(async () => {
  // tsup builds the entries concurrently. Clean once before any entry writes
  // to dist so the module build cannot erase the browser declarations.
  await rm('dist', { recursive: true, force: true })
  return builds
})
