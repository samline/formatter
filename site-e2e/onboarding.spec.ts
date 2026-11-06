import { test, expect } from '@playwright/test'

test('compact Home initialization links to the actual complete starter files', async ({ page }) => {
  await page.goto('./')
  const card = page.locator('#how article').last()
  expect(await card.locator('code').textContent()).not.toContain('<!doctype')
  await card.getByRole('link', { name: 'Copy complete working files' }).click()
  const viewer = page.locator('[data-code-files]:visible').first()
  await expect(viewer).toBeVisible()
  await viewer.getByRole('tab', { name: 'Complete file', exact: true }).click()
  await expect(viewer.getByRole('tabpanel', { name: 'Complete file', exact: true })).toContainText(
    '<!doctype html>'
  )
})
