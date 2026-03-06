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

API: `http://localhost:8081`
Swagger: `http://localhost:8081/swagger-ui`

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

## CI/CD (GitHub Actions)

Автодеплой настроен через workflow `.github/workflows/deploy.yml`.

Триггеры:
- `push` в ветку `main`
- ручной запуск `workflow_dispatch`

Для работы нужно добавить Secrets в GitHub репозитории:
- `DEPLOY_HOST` — IP или домен сервера (например, `45.128.205.5`)
- `DEPLOY_USER` — SSH-пользователь (например, `root`)
- `DEPLOY_SSH_KEY` — приватный SSH-ключ для входа на сервер
- `DEPLOY_WEB_DIR` — путь для frontend сборки (например, `/var/www/diplomas/gavrilov-retail-store`)
- `DEPLOY_APP_DIR` — путь к git-репозиторию на сервере (например, `/opt/gavrilov-retail-store`)

Что делает деплой:
1. Собирает frontend (`npm ci && npm run build`) в `product-web/build/`.
2. Загружает содержимое `build/` на сервер в `DEPLOY_WEB_DIR`.
3. На сервере делает `git pull` в `DEPLOY_APP_DIR` и перезапускает API командой `docker compose up -d --build`.

