#!/usr/bin/env bash
set -euo pipefail

SERVER=""
SSH_USER=""
DEST_DIR="/opt/table-tennis/backend"
ENV_FILE_PATH="/opt/table-tennis/backend/.env"
UPLOADS_DIR="/var/data/uploads"

if [ -z "$SERVER" ] || [ -z "$SSH_USER" ]; then
  echo "SERVER or SSH_USER not set" >&2
  exit 1
fi

rsync -az --delete --exclude node_modules --exclude .env --exclude .env.local ./backend/ "$SSH_USER@$SERVER:$DEST_DIR/"

ssh "$SSH_USER@$SERVER" "sudo mkdir -p $UPLOADS_DIR && sudo chown -R \$(id -un):\$(id -gn) $UPLOADS_DIR"

ssh "$SSH_USER@$SERVER" "cd $DEST_DIR && npm install && pm2 startOrReload ecosystem.config.js && pm2 save"