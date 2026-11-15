import { defineConfig } from 'vitest/config'

// Smoke tests against the built `dist/` output. Run after `bun run build`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/build/**/*.test.ts'],
  },
})
