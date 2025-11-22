# Команды для настройки системы гостевых игроков

## Шаг 1: Установка зависимостей

```bash
# Перейти в папку backend
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3/backend

# Установить nodemailer для отправки email
npm install nodemailer
```

## Шаг 2: Применить миграцию базы данных

```bash
# Выполнить из папки backend
node scripts/database/apply-guest-players-migration.js
```

## Шаг 3: (Опционально) Настроить email

```bash
# Открыть файл .env для редактирования
nano .env

# Или использовать ваш редактор
code .env
```

**Добавить в файл backend/.env:**
```env
# Email Configuration
EMAIL_USER=ваш-email@gmail.com
EMAIL_PASSWORD=ваш-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### Для Gmail:
1. Включить двухфакторную аутентификацию
2. Сгенерировать App Password: https://myaccount.google.com/security
3. Использовать App Password (не обычный пароль)

## Шаг 4: Перезапустить серверы

```bash
# Остановить backend (если запущен)
# Нажать Ctrl+C в терминале где запущен backend

# Запустить backend заново
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3/backend
npm start
# Или
npm run dev
```

```bash
# В новом терминале - frontend
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3/frontend
npm run dev
```

## Альтернатива: Автоматическая установка

```bash
# Перейти в корень проекта
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3

# Запустить скрипт автоматической установки
./setup-guest-system.sh
```

## Проверка установки

```bash
# Проверить таблицы в базе данных
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3/backend

# Создать временный скрипт для проверки
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
pool.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='guest_tournament_players'\")
  .then(res => {
    if (res.rows.length > 0) {
      console.log('✅ Таблица guest_tournament_players создана');
    } else {
      console.log('❌ Таблица не найдена');
    }
    pool.end();
  })
  .catch(err => {
    console.error('Ошибка:', err);
    pool.end();
  });
"
```

## Тестирование

```bash
# (Опционально) Протестировать отправку email
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3/backend

# Создать тестовый скрипт
cat > test-email.js << 'EOF'
require('dotenv').config();
const emailService = require('./server/services/emailService');

async function test() {
  const result = await emailService.sendTournamentRegistrationConfirmation({
    email: 'test@example.com',
    playerName: 'Test Player',
    tournamentName: 'Test Tournament',
    tournamentDate: 'December 1, 2024 at 10:00 AM',
    tournamentLocation: 'Test Arena, New York, USA',
  });
  console.log('Результат:', result);
}

test();
EOF

# Запустить тест
node test-email.js

# Удалить тестовый файл
rm test-email.js
```

## Быстрая команда (всё сразу)

```bash
#!/bin/bash

# Перейти в проект
cd "/Users/leonidtkach/Table Tennis Tournament Website 3"

# Установить зависимости
cd backend
npm install nodemailer

# Применить миграцию
node scripts/database/apply-guest-players-migration.js

# Готово!
echo "✅ Установка завершена!"
echo "📧 Настройте email в backend/.env (опционально)"
echo "🔄 Перезапустите серверы"
```

## Возможные проблемы

### Ошибка базы данных
```bash
# Проверить подключение к базе
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3/backend
node -e "console.log('DATABASE_URL:', process.env.DATABASE_URL)" 

# Проверить что PostgreSQL запущен
pg_isready
```

### Ошибка npm install
```bash
# Очистить кэш и переустановить
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3/backend
rm -rf node_modules package-lock.json
npm install
npm install nodemailer
```

### Email не отправляется
```bash
# Проверить настройки
cd /Users/leonidtkach/Table\ Tennis\ Tournament\ Website\ 3/backend
cat .env | grep EMAIL
```

## Готовые команды для копирования

**Минимальная установка (без email):**
```bash
cd "/Users/leonidtkach/Table Tennis Tournament Website 3/backend" && npm install nodemailer && node scripts/database/apply-guest-players-migration.js
```

**Полная установка:**
```bash
cd "/Users/leonidtkach/Table Tennis Tournament Website 3" && ./setup-guest-system.sh
```
