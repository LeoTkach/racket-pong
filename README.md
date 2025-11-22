# Table Tennis Tournament Website

Монorepo проект для управления турнирами по настольному теннису.

## Структура проекта

```
/
├── frontend/          # React + Vite фронтенд приложение
│   ├── src/          # Исходный код
│   ├── public/       # Статические файлы
│   └── package.json  # Зависимости фронтенда
│
├── backend/          # Express.js бэкенд приложение
│   ├── server/      # Express сервер
│   ├── database/    # SQL скрипты
│   ├── scripts/     # Утилиты и скрипты
│   └── package.json # Зависимости бэкенда
│
└── docs/            # Документация (если нужна)
```

## Установка

```bash
# Установка всех зависимостей
pnpm install
```

## Разработка

```bash
# Запуск только фронтенда (порт 3000)
pnpm dev

# Запуск только бэкенда (порт 3003)
pnpm dev:backend

# Запуск всего вместе
pnpm dev:full
```

## Сборка

```bash
# Сборка фронтенда
pnpm build
```

## База данных

```bash
# Настройка БД
pnpm db:setup

# Добавление достижений
pnpm db:add-achievements
```

## Переменные окружения

Создайте файл `backend/.env` на основе `backend/.env.example`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_tennis_tournament
DB_USER=your_username
DB_PASSWORD=your_password
PORT=3003
```
