# Firebase Storage CORS Configuration

Это руководство объясняет, как исправить ошибку CORS при загрузке файлов в Firebase Storage.

## Проблема

При загрузке файлов с `localhost:3000` в Firebase Storage может возникнуть ошибка:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check
```

## Решение

### Вариант 1: Автоматическая настройка (рекомендуется)

Запустите скрипт (он установит все необходимое и настроит CORS):

```bash
./setup-firebase-cors.sh
```

Скрипт автоматически:
- Установит Google Cloud SDK (если не установлен)
- Аутентифицирует вас в Google Cloud
- Применит CORS конфигурацию

### Вариант 2: Ручная настройка через gsutil

#### Шаг 1: Установите Google Cloud SDK

**macOS (используя Homebrew):**
```bash
brew install --cask google-cloud-sdk
```

**Или скачайте с:**
https://cloud.google.com/sdk/docs/install

#### Шаг 2: Аутентифицируйтесь

```bash
export PATH=/opt/homebrew/share/google-cloud-sdk/bin:"$PATH"
gcloud auth login
```

#### Шаг 3: Установите проект

```bash
gcloud config set project racket-pong
```

#### Шаг 4: Примените CORS конфигурацию

```bash
gsutil cors set cors.json gs://racket-pong.firebasestorage.app
```

Если бакет с таким именем не существует, попробуйте:
```bash
gsutil cors set cors.json gs://racket-pong.appspot.com
```

#### Шаг 5: Проверьте конфигурацию

```bash
gsutil cors get gs://racket-pong.firebasestorage.app
```

### Вариант 3: Через Firebase Console (если бакет еще не создан)

Если бакет Firebase Storage еще не был создан (не использовался), он будет создан автоматически при первой загрузке файла. После этого:

1. Запустите скрипт `./setup-firebase-cors.sh` снова
2. Или используйте вариант 2 выше

## Важно

- Бакет Firebase Storage создается автоматически при первом использовании Firebase Storage
- Если вы видите ошибку "bucket does not exist", попробуйте загрузить файл один раз через приложение, затем запустите скрипт настройки CORS
- Файл `cors.json` включает следующие домены:
  - `localhost:3000` - ваш dev сервер
  - `localhost:3001` - альтернативный порт
  - `localhost:5173` - порт Vite по умолчанию
  - `https://racket-pong.firebaseapp.com` - production домен

## Проверка

После настройки CORS, попробуйте загрузить файл снова. Ошибка CORS должна исчезнуть.

Если проблема сохраняется:
1. Убедитесь, что бакет существует (попробуйте загрузить файл один раз)
2. Проверьте, что CORS конфигурация применена: `gsutil cors get gs://racket-pong.firebasestorage.app`
3. Убедитесь, что вы используете правильное имя бакета
