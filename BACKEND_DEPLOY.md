# Backend Deploy на Render.com

## Быстрый деплой:

### 1. Зарегистрируйтесь на Render.com
- Перейдите на https://render.com
- Зарегистрируйтесь через GitHub

### 2. Создайте новый Web Service
1. Нажмите **"New +"** → **"Web Service"**
2. Подключите GitHub репозиторий (или загрузите код)
3. Настройки:
   - **Name**: `racket-pong-api`
   - **Region**: Oregon (US West)
   - **Branch**: main (или ваша ветка)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Instance Type**: Free

### 3. Настройте Environment Variables

Добавьте следующие переменные окружения:

```
NODE_ENV=production
PORT=10000

# Database (ваша PostgreSQL база)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=table_tennis_tournament
DB_USER=leonidtkach
DB_PASSWORD=19082004lt

# Email (опционально)
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

### 4. Добавьте PostgreSQL базу данных

**Вариант A: Render PostgreSQL (рекомендуется)**
1. Создайте новый PostgreSQL на Render
2. Скопируйте External Database URL
3. Используйте его в `DATABASE_URL` или разбейте на отдельные переменные

**Вариант B: Внешняя база**
- Используйте Supabase, Neon.tech, или Railway
- Получите connection string
- Добавьте в environment variables

### 5. Деплой
1. Нажмите **"Create Web Service"**
2. Render автоматически задеплоит backend
3. Получите URL (например: `https://racket-pong-api.onrender.com`)

### 6. Обновите Frontend

Измените `.env.production` в frontend:

```env
VITE_API_URL=https://racket-pong-api.onrender.com/api
```

Затем редеплойте frontend:
```bash
cd frontend
npm run build
netlify deploy --prod
```

## Автоматический деплой через GitHub

### 1. Создайте GitHub репозиторий
```bash
cd "/Users/leonidtkach/Table Tennis Tournament Website 3"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/racket-pong.git
git push -u origin main
```

### 2. Подключите к Render
1. В Render выберите "Connect Repository"
2. Выберите ваш репозиторий
3. При каждом push в GitHub автоматически произойдет деплой

## Troubleshooting

### Ошибка подключения к базе данных
- Проверьте DB_HOST, DB_PORT, DB_USER, DB_PASSWORD
- Убедитесь что PostgreSQL база доступна извне
- Проверьте SSL настройки

### 500 Internal Server Error
- Проверьте логи в Render Dashboard
- Убедитесь что все environment variables заданы

### Render засыпает (free plan)
- Free plan засыпает после 15 минут неактивности
- Первый запрос после сна займет ~30 секунд
- Рассмотрите платный план ($7/мес) для постоянной работы

## Альтернативы Render:

### Railway.app
- $5 кредитов бесплатно
- Автоматический деплой из GitHub
- Встроенная PostgreSQL

### Fly.io
- Бесплатный tier
- Глобальное распространение
- Хорошая производительность

### Heroku
- Больше не бесплатен
- $5-7/месяц минимум
