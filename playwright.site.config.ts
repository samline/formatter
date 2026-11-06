import { defineConfig } from '@playwright/test'
import { project } from './shared/lib/project.mjs'

// A dedicated production-preview port, never a development server. Override it
// when another site's suite already listens on the default: Astro would
// otherwise move to the next free port and Playwright would wait on this one.
const port = Number(process.env.PACKAGE_SITE_TEST_PORT ?? 4358)
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('PACKAGE_SITE_TEST_PORT must be an unprivileged TCP port')
const origin = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './site-e2e',
  workers: 1,
  timeout: 60000,
  use: { baseURL: origin + project.base, browserName: 'chromium' },
  webServer: {
    command: `npm run preview --workspace landing -- --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: origin + project.base,
    reuseExistingServer: !process.env.CI,
  },
})
