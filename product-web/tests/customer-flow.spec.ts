import { test, expect } from '@playwright/test';
import { loginAs, readUsers, saveScreenshot } from './utils';

test('customer: каталог -> корзина -> заказ', async ({ page }) => {
  const users = readUsers();
  const customer = users.CUSTOMER;

  await loginAs(page, customer.email, customer.password);
  await page.goto('/');
  await expect(page.getByTestId('product-grid')).toBeVisible();

  await page.goto('/pickup-points');
  await expect(page.getByTestId('pickup-points-page')).toBeVisible();
  await expect(page.getByTestId('pickup-points-map')).toBeVisible();
  await saveScreenshot(page, '02a-pickup-points-page.png');

  await page.goto('/cart');
  await expect(page.getByTestId('cart-page')).toBeVisible();
  await expect(page.getByTestId('go-catalog-empty-cart')).toBeVisible();
  await saveScreenshot(page, '03a-cart-empty-state.png');

  await page.goto('/');
  await expect(page.getByTestId('product-grid')).toBeVisible();
  const firstAddButton = page.locator('[data-testid^="add-to-cart-"]').first();
  await firstAddButton.click();

  await page.goto('/cart');
  await expect(page.getByTestId('cart-page')).toBeVisible();
  await saveScreenshot(page, '03-cart-page.png');

  await page.getByTestId('go-checkout').click();
  await expect(page.getByTestId('checkout-page')).toBeVisible();
  await saveScreenshot(page, '04a-checkout-courier-state.png');
  await page.selectOption('select', 'PICKUP');
  await expect(page.getByTestId('pickup-point-select')).toBeVisible();
  await expect(page.getByTestId('pickup-point-card')).toBeVisible();
  await saveScreenshot(page, '04-checkout-page.png');

  await page.getByTestId('submit-order').click();
  await page.waitForURL('**/profile/orders');
  await expect(page.getByTestId('my-orders-page')).toBeVisible();
  await saveScreenshot(page, '05a-customer-orders-list-page.png');
  await page.locator('.order-card').first().click();
  await page.waitForURL('**/profile/orders/*');
  await expect(page.getByTestId('order-details-page')).toBeVisible();
  await expect(page.getByTestId('customer-orders-list')).toBeVisible();
  await saveScreenshot(page, '05-customer-orders-page.png');
});
