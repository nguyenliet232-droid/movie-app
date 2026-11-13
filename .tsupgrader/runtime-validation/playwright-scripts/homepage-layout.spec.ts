import { test, expect } from '@playwright/test';

test.use({ channel: 'msedge' });

test('homepage-layout', async ({ page }) => {
  await page.route("**/*", async route => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin === "http://127.0.0.1:5173") {
      await route.continue();
    } else {
      await route.abort("blockedbyclient");
    }
  });
  await page.goto('http://127.0.0.1:5173');
  await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Movie App - Trang chủ' })).toBeVisible();
});
