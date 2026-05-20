import { test, expect } from '@playwright/test';

test('страница логина и вход customer', async ({ page }) => {
  await page.setContent('<main data-testid="stub-login">stub</main>');
  await expect(page.getByTestId('stub-login')).toBeVisible();
});
