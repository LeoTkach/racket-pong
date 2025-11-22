# Как перезапустить бэкенд сервер

## ⚠️ ВАЖНО: После изменений в коде нужно перезапустить бэкенд!

## Шаг 1: Остановить старый процесс

В терминале, где запущен бэкенд, нажмите:
```
Ctrl+C
```

Или в другом терминале:
```bash
lsof -ti:3003 | xargs kill
```

## Шаг 2: Запустить бэкенд заново

```bash
cd "/Users/leonidtkach/Table Tennis Tournament Website 3/backend"
npm run server
```

## Проверка, что сервер перезапущен

После перезапуска в логах должны появиться:
- `🚀 Server running on port 3003`
- `📊 API available at http://localhost:3003/api`

## При изменении результата матча

Теперь в логах должно быть:
```
[🔄 CASCADE RESET] ✅ Reset slot player1 in Final match 291
[🔄 CASCADE RESET]   - Cleared player1_id, winner_id, status, end_time, scores
[🔄 CASCADE RESET]   - Preserved player2_id = 10
```

А НЕ:
```
[🔄 CASCADE RESET] ✅ Reset Final matches: [291]
[🔄 CASCADE RESET]   - Cleared winner_id, status, end_time, player1_id, player2_id, scores
```

## Быстрая команда для перезапуска

```bash
cd "/Users/leonidtkach/Table Tennis Tournament Website 3/backend" && lsof -ti:3003 | xargs kill 2>/dev/null; sleep 1; npm run server
```





