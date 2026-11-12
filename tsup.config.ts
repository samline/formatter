import { defineConfig } from 'tsup'

export default defineConfig([
  {
    // One build for every module entry so they share chunks. Phone support
    // registers into a module-level registry that must be a single instance
    // across `.`, `./vanilla` and `./phone` (in ESM and in CommonJS).
    entry: {
      index: 'src/index.ts',
      'vanilla/index': 'src/vanilla/index.ts',
      'phone/index': 'src/phone/index.ts',
      'intl/index': 'src/intl/index.ts'
    },
    format: ['esm', 'cjs'],
    dts: true,
    target: 'es2020',
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    splitting: true,
    treeshake: true
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
    sourcemap: true
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
    sourcemap: true
  }
])
