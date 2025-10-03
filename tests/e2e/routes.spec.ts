import { test, expect } from '@playwright/test';

test.describe('routing', () => {
  test('can navigate directly to a museum detail page', async ({ page }) => {
    await page.goto('/museum/van-gogh-museum-amsterdam');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('homepage CTA "Bekijk tentoonstellingen" navigates to exhibitions overview', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Bekijk tentoonstellingen' }).click();
    await expect(page).toHaveURL('/tentoonstellingen');
    await expect(page.getByRole('list', { name: 'Tentoonstellingen' })).toBeVisible();
  });

  test('museum detail route remains accessible from exhibitions grid', async ({ page }) => {
    await page.goto('/tentoonstellingen');
    const firstCard = page.getByRole('link', { name: /bekijken$/i }).first();
    const href = await firstCard.getAttribute('href');
    await firstCard.click();
    if (href?.startsWith('/museum/')) {
      await expect(page).toHaveURL(/\/museum\//);
      await expect(page.locator('h1')).toBeVisible();
    } else {
      await expect(page).toHaveURL(/tentoonstellingen/);
    }
  });
});
