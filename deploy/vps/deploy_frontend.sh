#!/usr/bin/env bash
set -euo pipefail

SERVER=""
SSH_USER=""
DEST_DIR="/var/www/table-tennis"

if [ -z "$SERVER" ] || [ -z "$SSH_USER" ]; then
  echo "SERVER or SSH_USER not set" >&2
  exit 1
fi

cd frontend
pnpm run build
rsync -az --delete build/ "$SSH_USER@$SERVER:$DEST_DIR/build/"