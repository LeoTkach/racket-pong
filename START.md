# 🚀 Инструкция по запуску проекта

## Требования
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (должна быть запущена)

## Быстрый старт

### 1. Установка зависимостей
```bash
pnpm install:all
```

### 2. Настройка базы данных
```bash
# Настройка БД (если еще не сделано)
pnpm run db:setup
```

### 3. Запуск всех сервисов
```bash
pnpm run dev:full
```

Это запустит:
- **Frontend** на http://localhost:3000
- **Backend** на http://localhost:3003

## Запуск отдельных сервисов

### Только Frontend
```bash
pnpm run dev
```

### Только Backend
```bash
pnpm run dev:backend
```

## Проверка работы

1. **База данных**: Проверка подключения
   ```bash
   cd backend
   node test-connection.js
   ```

2. **Backend API**: Откройте http://localhost:3003/api/health
   - Должен вернуть: `{"status":"OK","message":"Table Tennis Tournament API is running"}`

3. **Frontend**: Откройте http://localhost:3000
   - Должна открыться главная страница приложения

## Конфигурация

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_tennis_tournament
DB_USER=leonidtkach
DB_PASSWORD=19082004lt
PORT=3003
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3003/api
```

## Сборка для production

```bash
pnpm run build
```

Собранные файлы будут в `frontend/build/`
