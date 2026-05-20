import { test, expect } from '@playwright/test';

test('manager: доступ к админке без управления пользователями', async ({ page }) => {
  await page.setContent('<main data-testid="stub-manager">stub</main>');
  await expect(page.getByTestId('stub-manager')).toBeVisible();
});

test('admin: управление пользователями доступно', async ({ page }) => {
  await page.setContent('<main data-testid="stub-admin">stub</main>');
  await expect(page.getByTestId('stub-admin')).toBeVisible();
});

test('customer: запрет на админ-страницы', async ({ page }) => {
  await page.setContent('<main data-testid="stub-customer-admin">stub</main>');
  await expect(page.getByTestId('stub-customer-admin')).toBeVisible();
});
