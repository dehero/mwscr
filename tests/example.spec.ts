import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Morrowind Screenshots');
});

test('matches screenshot', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveScreenshot();
});
