# Быстрый запуск бэкенда

## ✅ Правильная команда (БЕЗ точки в конце):

```bash
cd "/Users/leonidtkach/Table Tennis Tournament Website 3/backend"
npm run server
```

## ❌ Неправильно (с точкой):

```bash
npm run server.  # ❌ Ошибка: Missing script: "server."
```

## 🛑 Если порт занят (EADDRINUSE):

Если видите ошибку `EADDRINUSE: address already in use :::3003`, значит бэкенд уже запущен.

### Вариант 1: Остановить через скрипт
```bash
cd "/Users/leonidtkach/Table Tennis Tournament Website 3/backend"
./stop-server.sh
```

### Вариант 2: Остановить вручную
```bash
# Найти процесс на порту 3003
lsof -ti:3003

# Остановить процесс
lsof -ti:3003 | xargs kill -9
```

### Вариант 3: Найти и остановить процесс
```bash
# Найти процесс
ps aux | grep "node server/index.js"

# Остановить процесс (замените PID на номер процесса)
kill -9 <PID>
```

## 📊 Что вы увидите после запуска:

```
[Auth Router] Loading auth routes...
[Auth Router] Change password route registered at /change-password (PUT and POST)
[Notifications Router] Loading notifications routes...
[Notifications Router] Routes loaded successfully
🚀 Server running on port 3003
📊 API available at http://localhost:3003/api
Connected to PostgreSQL database
```

## 🛑 Остановка:

Нажмите `Ctrl+C` в терминале, где запущен бэкенд.

## 🔄 Полный перезапуск:

```bash
cd "/Users/leonidtkach/Table Tennis Tournament Website 3/backend"
./stop-server.sh
npm run server
```

## 📝 Проверка, что бэкенд запущен:

Откройте другой терминал и выполните:
```bash
curl http://localhost:3003/api/health
```

Должен вернуться: `{"status":"OK","message":"Table Tennis Tournament API is running"}`

## 🔍 Проверка, что порт свободен:

```bash
lsof -ti:3003
```

Если команда ничего не выводит, порт свободен.
Если выводит номер процесса, порт занят.
