# Testing Tournament Reset Scripts

## Автоматический сброс тестового турнира

После внесения изменений в логику турниров/матчей всегда запускайте скрипт сброса тестового турнира:

```bash
# Из папки backend
pnpm db:reset-test-tournament

# Или напрямую
node scripts/database/reset-test-tournament.js
```

Этот скрипт:
- ✅ Сбрасывает все результаты матчей турнира ID 4 ("John Doe")
- ✅ Удаляет все счета матчей
- ✅ Очищает победителей и статусы матчей
- ✅ Очищает слоты игроков в следующих раундах (Semifinals, Final)
- ✅ Сохраняет структуру матчей первого раунда (Quarterfinals)
- ✅ Устанавливает статус турнира в 'upcoming'

## Другие скрипты

### Сброс конкретного турнира
```bash
node scripts/database/reset-tournament-results.js <tournament_id>
```

### Изменение статуса турнира
```bash
node scripts/database/update-tournament-status.js <tournament_id> <new_status>
# Статусы: upcoming, ongoing, completed
```

## Важно

После изменений в логике **всегда** запускайте `db:reset-test-tournament` перед тестированием, чтобы:
- Убедиться, что изменения работают с чистым состоянием
- Избежать проблем с устаревшими данными
- Протестировать полный цикл от начала до конца





