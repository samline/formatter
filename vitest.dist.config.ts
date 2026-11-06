import { defineConfig } from 'vitest/config'

// Smoke tests against the built `dist/` output. Run after `npm run build`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/build/**/*.test.ts']
  }
})
