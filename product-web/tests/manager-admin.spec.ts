import { test, expect } from '@playwright/test';
import { loginAs, readUsers, saveScreenshot } from './utils';

test('manager: доступ к админке без управления пользователями', async ({ page }) => {
  const users = readUsers();
  const manager = users.MANAGER;

  await loginAs(page, manager.email, manager.password);
  await page.goto('/admin');
  await expect(page.getByTestId('admin-dashboard-page')).toBeVisible();
  await saveScreenshot(page, '06-admin-dashboard-manager.png');

  await page.goto('/admin/products');
  await expect(page.getByTestId('admin-products-page')).toBeVisible();

  const unique = Date.now();
  await page.getByTestId('product-sku-input').fill(`AUTO-${unique}`);
  await page.getByTestId('product-name-input').fill(`АвтоТовар ${unique}`);
  await page.getByTestId('product-description-input').fill('Тестовый товар для E2E');
  await page.getByTestId('product-price-input').fill('299');
  await page.getByTestId('product-stock-input').fill('12');
  await page.getByTestId('product-category-select').selectOption({ index: 1 });
  await page.getByTestId('save-product').click();
  await expect(page.locator(`text=АвтоТовар ${unique}`)).toBeVisible();
  await saveScreenshot(page, '07-admin-products-page.png');

  await page.goto('/admin/categories');
  await expect(page.getByTestId('admin-categories-page')).toBeVisible();
  await saveScreenshot(page, '08-admin-categories-page.png');

  await page.goto('/admin/orders');
  await expect(page.getByTestId('admin-orders-page')).toBeVisible();
  await saveScreenshot(page, '09-admin-orders-page.png');

  await page.goto('/admin/users');
  await expect(page.getByTestId('forbidden-page')).toBeVisible();
});

test('admin: управление пользователями доступно', async ({ page }) => {
  const users = readUsers();
  const admin = users.ADMIN;

  await loginAs(page, admin.email, admin.password);
  await page.goto('/admin/users');
  await expect(page.getByTestId('admin-users-page')).toBeVisible();
  await saveScreenshot(page, '10-admin-users-page.png');
});

test('customer: запрет на админ-страницы', async ({ page }) => {
  const users = readUsers();
  const customer = users.CUSTOMER;

  await loginAs(page, customer.email, customer.password);
  await page.goto('/admin');
  await expect(page.getByTestId('forbidden-page')).toBeVisible();
});
