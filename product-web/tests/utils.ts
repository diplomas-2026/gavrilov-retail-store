import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Page, expect } from '@playwright/test';

type UserRecord = {
  email: string;
  password: string;
  role?: string;
};

export function readUsers(): Record<string, UserRecord> {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const usersPath = path.resolve(currentDir, '../../product-api/users.txt');
  if (!fs.existsSync(usersPath)) {
    throw new Error(`Не найден файл пользователей: ${usersPath}. Сначала запустите API.`);
  }

  const lines = fs.readFileSync(usersPath, 'utf-8').split('\n').map((line) => line.trim()).filter(Boolean);
  const map: Record<string, UserRecord> = {};

  for (const line of lines) {
    const parts = line.split(';').map((part) => part.trim());
    const record: Record<string, string> = {};
    for (const part of parts) {
      const [key, value] = part.split('=').map((item) => item.trim());
      if (key && value) {
        record[key] = value;
      }
    }
    if (record.role) {
      map[record.role] = {
        email: record.email,
        password: record.password,
        role: record.role
      };
    }
  }

  return map;
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByTestId('login-submit').click();
  await page.waitForFunction(() => Boolean(window.localStorage.getItem('token')));
  await page.waitForLoadState('networkidle');
  if (!(await page.getByTestId('logout-button').isVisible())) {
    await page.reload();
  }
  await expect(page.getByTestId('logout-button')).toBeVisible();
}

export async function logoutIfNeeded(page: Page) {
  const button = page.getByTestId('logout-button');
  if (await button.isVisible()) {
    await button.click();
    await expect(page.getByTestId('login-page')).toBeVisible();
  }
}

export async function saveScreenshot(page: Page, filename: string) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const target = path.resolve(currentDir, '../artifacts/screenshots', filename);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  await page.screenshot({ path: target, fullPage: true });
}
