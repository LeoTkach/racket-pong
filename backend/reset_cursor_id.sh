#!/bin/bash

echo "=========================================="
echo "   Cursor ID Reset Script (macOS)"
echo "=========================================="

# 1. Закрываем Cursor
echo "🔴 Закрываем процесс Cursor..."
pkill -f Cursor

# Путь к конфигу
CONFIG_DIR="$HOME/Library/Application Support/Cursor/User/globalStorage"
CONFIG_FILE="$CONFIG_DIR/storage.json"
BACKUP_FILE="$CONFIG_DIR/storage.json.backup"

# Проверяем, существует ли файл
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Файл конфигурации не найден! Сначала запустите Cursor хотя бы один раз."
    exit 1
fi

# 2. Снимаем защиту от записи (если она была)
echo "🔓 Снимаем блокировку файла (может потребоваться пароль)..."
if [ -f "$CONFIG_FILE" ]; then
    sudo chflags noimmutable "$CONFIG_FILE"
fi

# 3. Делаем бэкап
echo "💾 Создаем резервную копию..."
cp "$CONFIG_FILE" "$BACKUP_FILE"

# 4. Генерируем новые ID через Python (для безопасности JSON)
echo "🎲 Генерируем новые ID..."

python3 -c "
import json
import uuid
import os
import hashlib
import random

file_path = os.path.expanduser('$CONFIG_FILE')

try:
    with open(file_path, 'r') as f:
        data = json.load(f)

    # Генерация случайных ID
    def generate_id():
        return hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest()

    data['telemetry.machineId'] = generate_id()
    data['telemetry.macMachineId'] = generate_id()
    data['telemetry.devDeviceId'] = str(uuid.uuid4())
    data['telemetry.sqmId'] = '{' + str(uuid.uuid4()).upper() + '}'

    with open(file_path, 'w') as f:
        json.dump(data, f, indent=4)
    
    print('✅ ID успешно заменены внутри JSON.')

except Exception as e:
    print(f'❌ Ошибка Python: {e}')
    exit(1)
"

# 5. Ставим защиту от записи (Read Only)
# Это критически важно, чтобы Cursor не вернул старые ID при запуске
echo "🔒 Блокируем файл от изменений..."
sudo chflags immutable "$CONFIG_FILE"

echo "=========================================="
echo "✅ Готово! Теперь:"
echo "1. Запустите Cursor."
echo "2. Создайте НОВЫЙ аккаунт (не входите в старый)."
echo "=========================================="
