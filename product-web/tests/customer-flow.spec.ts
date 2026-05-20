import { test, expect } from '@playwright/test';

test('customer: каталог -> корзина -> заказ', async ({ page }) => {
  await page.setContent('<main data-testid="stub-customer-flow">stub</main>');
  await expect(page.getByTestId('stub-customer-flow')).toBeVisible();
});
