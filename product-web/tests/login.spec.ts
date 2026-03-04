import { test, expect } from '@playwright/test';
import { readUsers, loginAs, saveScreenshot } from './utils';

test('страница логина и вход customer', async ({ page }) => {
  const users = readUsers();
  const customer = users.CUSTOMER;

  await page.goto('/login');
  await expect(page.getByTestId('login-page')).toBeVisible();
  await saveScreenshot(page, '01-login-page.png');

  await page.goto('/register');
  await expect(page.getByTestId('register-page')).toBeVisible();
  await saveScreenshot(page, '01a-register-page.png');

  await page.locator('input').nth(0).fill('Тестовый Пользователь');
  await page.locator('input[type="email"]').fill(`test-${Date.now()}@example.com`);
  await page.fill('input[type="password"]', 'password123');
  await page.locator('input[type="password"]').nth(1).fill('different123');
  await page.getByTestId('register-submit').click();
  await expect(page.locator('text=Пароли не совпадают')).toBeVisible();
  await saveScreenshot(page, '01b-register-validation-state.png');

  await loginAs(page, customer.email, customer.password);
  await expect(page.getByTestId('home-page')).toBeVisible();
  await saveScreenshot(page, '02-home-page-customer.png');

  await page.goto('/not-found-page');
  await expect(page.locator('text=Страница не найдена')).toBeVisible();
  await saveScreenshot(page, '12-not-found-page.png');
});
