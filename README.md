# Магазин ИП Гаврилова Т.В.

Монорепозиторий full-stack проекта:

- `product-api` — Spring Boot 3 + JWT + Flyway + PostgreSQL
- `product-web` — React + Vite + Playwright

## Функциональность

- Каталог товаров с категориями и поиском
- Карточка товара
- Корзина и оформление заказа
- Личный кабинет покупателя (мои заказы)
- Админ-панель для управления товарами, категориями, заказами
- Управление пользователями и ролями (только ADMIN)

## Роли

- `ADMIN`
- `MANAGER`
- `CUSTOMER`

## Локальный запуск API (через Docker)

```bash
docker compose up -d --build
```

API: `http://localhost:8080`
Swagger: `http://localhost:8080/swagger-ui`

## Локальный запуск Web

```bash
cd product-web
npm install
npm run dev
```

Web: `http://localhost:5173`

## Тестовые пользователи

После старта API файл создается автоматически:

`product-api/users.txt`

Формат строки:

`email=<email>; password=<password>; role=<ROLE>`

## Seed-данные

Seed-файлы:

- `product-api/seed-data/categories.json`
- `product-api/seed-data/products.json`

Загрузка выполняется автоматически при старте API и является идемпотентной.

## Тестирование

### Backend

```bash
cd product-api
mvn -Dmaven.repo.local=.m2 test
```

### E2E + скриншоты

```bash
cd product-web
npx playwright install chromium
npx playwright test
```

Скриншоты сохраняются в:

`product-web/artifacts/screenshots/`
