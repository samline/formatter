import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/',
      },
    },
    include: ['test/**/*.test.ts'],
    // Built-output smoke tests run separately through `bun run test:package`.
    exclude: ['test/build/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text', 'json-summary'],
      thresholds: { branches: 90, functions: 95, lines: 95, statements: 95 },
    },
  },
})
