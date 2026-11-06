import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost/'
      }
    },
    include: ['test/**/*.test.ts'],
    // Built-output smoke tests run separately through `npm run test:dist`.
    exclude: ['test/build/**', '**/node_modules/**']
  }
})