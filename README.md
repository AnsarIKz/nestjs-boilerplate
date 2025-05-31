Nestjs, Prisma ORM, PostgreSQL, Fastify, Bun, JWT auth, Mailer, Storage, Logger, Swagger.

## Особенности

- **NestJS 11** - Последняя версия фреймворка NestJS
- **Fastify** - Высокопроизводительный веб-фреймворк для Node.js
- **PostgreSQL** - Мощная объектно-реляционная база данных
- **Prisma ORM** - Современный ORM для TypeScript и Node.js
- **JWT Аутентификация** - Полная система аутентификации с refresh токенами
  - Регистрация пользователей с верификацией email
  - Login/Logout
  - Обновление токенов (Refresh tokens)
  - Сброс пароля
  - Защита маршрутов
  - Разграничение прав на основе ролей
- **Swagger/OpenAPI** - Автоматическая документация API
- **Поддержка Bun** - Оптимизировано для работы с рантаймом Bun
- **Конфигурация** - Управление переменными окружения с валидацией через Joi
- **Логирование** - Встроенное логирование NestJS
- **Тестирование** - Готовая конфигурация Jest для unit и e2e тестов
- **ESLint & Prettier** - Контроль качества кода и форматирование
- **Husky & CommitLint** - Git хуки и валидация commit сообщений
- **Интернационализация** - Многоязычность с помощью nestjs-i18n
- **SWC** - Ускоренная компиляция TypeScript

## Требования

- Node.js >= 20.0.0
- Bun >= 1.2.9 (рекомендуется, но npm/yarn также работают)
- PostgreSQL

## Начало работы

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/yourusername/nestjs-boilerplate.git

# Переход в директорию проекта
cd nestjs-boilerplate

# Установка зависимостей
bun install
```

### Конфигурация

1. Скопируйте пример файла окружения:

```bash
cp .env.example .env
```

2. Обновите файл `.env` с вашими данными для подключения к PostgreSQL:

```
DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase?schema=public"
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
```

### UP Database

```bash
# Запуск PostgreSQL в Docker
docker-compose up -d

# Ожидание готовности базы данных (опционально)
docker-compose logs -f postgres
```

### Настройка базы данных

```bash
# Генерация Prisma клиента
bun prisma:generate

# Применение миграций
bun prisma:migrate

# (Опционально) Заполнение базы начальными данными
bun prisma:seed
```

### Запуск приложения

```bash
# Режим разработки
bun dev

# Продакшн режим
bun build
bun start:prod
```

## Структура проекта

```
.
├── prisma/                  # Схема Prisma и миграции
├── src/
│   ├── auth/                # Модуль аутентификации
│   │   ├── strategies/      # Passport стратегии (JWT, Local)
│   │   ├── guards/          # Guards для защиты маршрутов
│   │   ├── decorators/      # Декораторы для аутентификации
│   │   ├── dto/             # Объекты передачи данных
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   └── auth.middleware.ts
│   ├── users/               # Модуль пользователей
│   │   ├── services/        # Сервисы для работы с пользователями
│   │   ├── controllers/     # Контроллеры API для пользователей
│   │   ├── dto/             # Объекты передачи данных
│   │   └── users.module.ts
│   ├── common/              # Общие утилиты, фильтры, пайпы
│   ├── config/              # Модуль конфигурации
│   ├── mailer/              # Сервис для отправки email
│   ├── app.module.ts        # Главный модуль приложения
│   └── main.ts              # Точка входа приложения
├── test/                    # E2E тесты
├── .env.example             # Пример переменных окружения
├── .eslintrc.js             # Конфигурация ESLint
├── .prettierrc              # Конфигурация Prettier
├── jest.config.js           # Конфигурация Jest
├── nest-cli.json            # Конфигурация NestJS CLI
├── package.json             # Зависимости и скрипты
└── tsconfig.json            # Конфигурация TypeScript
```

## Система аутентификации

Boilerplate включает полноценную систему аутентификации:

### Процесс регистрации

1. Пользователь отправляет email для регистрации (`POST /auth/register`)
2. Система генерирует код верификации и отправляет его на email
3. Пользователь подтверждает email, отправляя код и данные профиля (`POST /auth/verify-email`)
4. После успешной верификации создается аккаунт и возвращаются токены доступа

### Процесс авторизации

1. Логин: пользователь получает access_token и refresh_token (`POST /auth/login`)
2. Access token используется для доступа к защищенным маршрутам (JWT стратегия)
3. После истечения срока действия access token, refresh token используется для получения нового access token (`POST /auth/refresh-token`)
4. Выход: все refresh токены отзываются при выходе из системы (`POST /auth/logout`)

### Сброс пароля

1. Пользователь запрашивает сброс пароля (`POST /auth/forgot-password`)
2. Система отправляет код подтверждения на email
3. Пользователь подтверждает сброс, отправляя код и новый пароль (`POST /auth/confirm-forgot-password`)

### Безопасность

- Пароли хешируются с использованием bcrypt
- JWT токены имеют ограниченный срок действия
- Refresh токены хранятся в базе данных и могут быть отозваны
- Доступна защита от перебора с ограничением количества попыток
- Многоуровневая система ролей (USER, ADMIN)

## API Endpoints

### Аутентификация

- `POST /auth/register` - Запрос на регистрацию
- `POST /auth/verify-email` - Верификация email и создание пользователя
- `POST /auth/login` - Авторизация пользователя
- `POST /auth/refresh-token` - Обновление access токена
- `POST /auth/logout` - Выход из системы
- `POST /auth/forgot-password` - Запрос на сброс пароля
- `POST /auth/confirm-forgot-password` - Подтверждение сброса пароля
- `POST /auth/resend-verification` - Повторная отправка кода верификации
- `POST /auth/change-password` - Изменение пароля (требует авторизации)
- `GET /auth/session` - Получение информации о текущей сессии

### Пользователи

- `GET /users` - Получение списка пользователей (требует авторизации)
- `GET /users/:id` - Получение информации о конкретном пользователе
- `PATCH /users/:id` - Обновление данных пользователя
- `DELETE /users/:id` - Удаление пользователя

## Документация API

Swagger документация автоматически генерируется и доступна по адресу `/api` при запуске приложения.

Для экспорта спецификации OpenAPI в YAML формате:

```bash
bun openapi:export
```

## Тестирование

```bash
# Запуск unit тестов
bun test

# Запуск e2e тестов
bun test:e2e

# Запуск тестов с покрытием
bun test:cov
```

## Инструменты разработки

### Prisma Studio

Prisma Studio - визуальный редактор базы данных для вашей схемы Prisma:

```bash
bun prisma:studio
```

### Линтинг и форматирование

```bash
# Запуск ESLint
bun lint

# Исправление проблем ESLint
bun lint:fix

# Форматирование кода Prettier
bun format
```

## Деплой

Приложение оптимизировано для деплоя на различных платформах:

- Docker контейнер
- Облачные платформы (AWS, GCP, Azure)
- PaaS провайдеры (Heroku, Render, Railway)

## Расширение функционала

Boilerplate спроектирован модульно, что позволяет легко добавлять новые возможности:

- Добавление новых модулей в директорию `src/modules/`
- Расширение схемы Prisma в `prisma/schema.prisma`
- Добавление новых маршрутов API в соответствующие контроллеры

## Поддержка и вклад в проект

Вклады приветствуются! Не стесняйтесь создавать issue или pull request.

## Лицензия

Этот проект распространяется под лицензией MIT - подробности см. в файле LICENSE.
