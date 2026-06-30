import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    target: 'es2020',
    outDir: 'dist',
    clean: true,
    sourcemap: true,
    treeshake: true
  },
  {
    entry: { index: 'src/vanilla/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    target: 'es2020',
    outDir: 'dist/vanilla',
    clean: false,
    sourcemap: true,
    treeshake: true
  },
  {
    entry: { global: 'src/browser/global.ts' },
    format: ['iife'],
    dts: true,
    target: 'es2020',
    outDir: 'dist/browser',
    clean: false,
    globalName: 'Formatter',
    platform: 'browser',
    minify: false
  }
])