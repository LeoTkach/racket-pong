#!/bin/bash

# Quick Setup Script - Быстрая настройка системы гостевых игроков
# Выполняет все необходимые команды

set -e  # Остановить при ошибке

echo "🚀 Быстрая настройка системы гостевых игроков"
echo "=============================================="
echo ""

# Определить директорию проекта
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "📁 Директория проекта: $PROJECT_DIR"
echo ""

# Шаг 1: Установка зависимостей
echo "📦 Шаг 1/2: Установка nodemailer..."
cd "$PROJECT_DIR/backend"
npm install nodemailer --save

if [ $? -eq 0 ]; then
  echo "✅ Nodemailer установлен"
else
  echo "❌ Ошибка установки nodemailer"
  exit 1
fi
echo ""

# Шаг 2: Миграция базы данных
echo "🗄️  Шаг 2/2: Применение миграции базы данных..."
node scripts/database/apply-guest-players-migration.js

if [ $? -eq 0 ]; then
  echo "✅ Миграция выполнена успешно"
else
  echo "❌ Ошибка миграции базы данных"
  exit 1
fi
echo ""

# Проверка настройки email
echo "📧 Проверка настройки email..."
if [ -f "$PROJECT_DIR/backend/.env" ]; then
  if grep -q "EMAIL_USER=" "$PROJECT_DIR/backend/.env" && grep -q "EMAIL_PASSWORD=" "$PROJECT_DIR/backend/.env"; then
    echo "✅ Email настроен в .env"
  else
    echo "⚠️  Email НЕ настроен"
    echo ""
    echo "Для включения email уведомлений, добавьте в backend/.env:"
    echo ""
    echo "EMAIL_USER=ваш-email@gmail.com"
    echo "EMAIL_PASSWORD=ваш-app-password"
    echo "EMAIL_HOST=smtp.gmail.com"
    echo "EMAIL_PORT=587"
    echo ""
    echo "Подробнее: backend/EMAIL_SETUP.md"
  fi
else
  echo "⚠️  Файл .env не найден"
  echo "Создайте backend/.env для настройки email"
fi
echo ""

# Итоги
echo "✨ Настройка завершена!"
echo ""
echo "📚 Что делать дальше:"
echo "1. Перезапустите backend сервер"
echo "2. Перезапустите frontend сервер"
echo "3. Прочитайте GUEST_PLAYER_SYSTEM.md для инструкций"
echo "4. (Опционально) Настройте email в backend/.env"
echo ""
echo "🎉 Система готова к использованию!"
