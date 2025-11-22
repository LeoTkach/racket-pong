#!/bin/bash
echo "🛑 Останавливаем бэкенд..."
lsof -ti:3003 | xargs kill 2>/dev/null || echo "   Процесс не найден"
sleep 1
echo "🚀 Запускаем бэкенд..."
cd "$(dirname "$0")"
npm run server
