import { test, expect } from '@playwright/test';
import { loginAs, readUsers, saveScreenshot } from './utils';

test('customer: каталог -> корзина -> заказ', async ({ page }) => {
  const users = readUsers();
  const customer = users.CUSTOMER;

  await loginAs(page, customer.email, customer.password);
  await page.goto('/');
  await expect(page.getByTestId('product-grid')).toBeVisible();

  const firstAddButton = page.locator('[data-testid^="add-to-cart-"]').first();
  await firstAddButton.click();

  await page.goto('/cart');
  await expect(page.getByTestId('cart-page')).toBeVisible();
  await saveScreenshot(page, '03-cart-page.png');

  await page.getByTestId('go-checkout').click();
  await expect(page.getByTestId('checkout-page')).toBeVisible();
  await page.fill('input[placeholder="г. Самара, ул. ..., д. ..."]', 'г. Самара, ул. Победы, 10');
  await saveScreenshot(page, '04-checkout-page.png');

  await page.getByTestId('submit-order').click();
  await page.waitForURL('**/profile/orders');
  await expect(page.getByTestId('my-orders-page')).toBeVisible();
  await saveScreenshot(page, '05-customer-orders-page.png');
});
