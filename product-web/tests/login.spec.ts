import { test, expect } from '@playwright/test';
import { readUsers, loginAs, saveScreenshot } from './utils';

test('страница логина и вход customer', async ({ page }) => {
  const users = readUsers();
  const customer = users.CUSTOMER;

  await page.goto('/login');
  await expect(page.getByTestId('login-page')).toBeVisible();
  await saveScreenshot(page, '01-login-page.png');

  await loginAs(page, customer.email, customer.password);
  await expect(page.getByTestId('home-page')).toBeVisible();
  await saveScreenshot(page, '02-home-page-customer.png');
});
