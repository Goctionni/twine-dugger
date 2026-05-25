import { expect, test } from '@playwright/test';

test('Twine Dugger panel smoke test', async ({ page }) => {
  await page.goto('/index.html');

  await expect(page.getByRole('heading', { name: 'Twine Dugger' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'State' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
});
