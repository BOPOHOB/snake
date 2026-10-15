#!/usr/bin/env bash
# Деплой Nokia 3310 Snake 2 на snake3310.io.
# Сборка → артефакт в /opt/snake → systemd + nginx (symlink).
# Nginx-конфиг на сервере не перезаписывается, если уже есть (certbot).
#
# Использование (из корня репозитория):
#   ./deploy.sh
#
# Переопределение:
#   DEPLOY_HOST=bopohob@snake3310.io DEPLOY_DIR=/opt/snake ./deploy.sh

set -euo pipefail

REMOTE="${DEPLOY_HOST:-bopohob@snake3310.io}"
REMOTE_DIR="${DEPLOY_DIR:-/opt/snake}"
SERVICE=snake
NGINX_SITE=snake3310.io
APP_PORT=8788
ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${ROOT}/src/back/.env"

cd "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE} (YANDEX_* / GOOGLE_*). Aborting." >&2
  exit 1
fi

# Читаем секреты без перетирания REMOTE/HOST деплоя
YANDEX_CLIENT_ID="$(grep -E '^YANDEX_CLIENT_ID=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
YANDEX_CLIENT_SECRET="$(grep -E '^YANDEX_CLIENT_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
GOOGLE_CLIENT_ID="$(grep -E '^GOOGLE_CLIENT_ID=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
GOOGLE_CLIENT_SECRET="$(grep -E '^GOOGLE_CLIENT_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2-)"

: "${YANDEX_CLIENT_ID:?YANDEX_CLIENT_ID missing in src/back/.env}"
: "${YANDEX_CLIENT_SECRET:?YANDEX_CLIENT_SECRET missing in src/back/.env}"
: "${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID missing in src/back/.env}"
: "${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET missing in src/back/.env}"

echo "==> Building frontend (client + SSR)…"
npm run build

echo "==> Preparing ${REMOTE}:${REMOTE_DIR}…"
ssh "$REMOTE" "mkdir -p '${REMOTE_DIR}/dist' '${REMOTE_DIR}/src/back'"

echo "==> Uploading artifacts…"
rsync -az --delete dist/ "${REMOTE}:${REMOTE_DIR}/dist/"
rsync -az --delete \
  --exclude='.env' \
  --exclude='.gitignore' \
  src/back/ "${REMOTE}:${REMOTE_DIR}/src/back/"
# src/front нужен бекенду в рантайме: og/image.ts импортирует paint/assets/restore/resultToStamp.
rsync -az --delete src/front/ "${REMOTE}:${REMOTE_DIR}/src/front/"
scp snake.service schema.sql "${REMOTE}:${REMOTE_DIR}/"

# Nginx: только если на сервере ещё нет (чтобы не затереть правки certbot)
if ssh "$REMOTE" "test -f '${REMOTE_DIR}/${NGINX_SITE}'"; then
  echo "==> Nginx config ${REMOTE_DIR}/${NGINX_SITE} already present — leave as is"
else
  echo "==> Uploading initial nginx config ${NGINX_SITE}…"
  scp "${NGINX_SITE}" "${REMOTE}:${REMOTE_DIR}/${NGINX_SITE}"
fi

echo "==> Writing production .env…"
ssh "$REMOTE" "cat > '${REMOTE_DIR}/.env'" <<EOF
HOST=127.0.0.1
PORT=${APP_PORT}
DENO_ENV=production
DB_PATH=${REMOTE_DIR}/db.db
FRONTEND_ORIGIN=https://snake3310.io
OAUTH_REDIRECT_URI=https://snake3310.io/
COOKIE_SECURE=true
YANDEX_CLIENT_ID=${YANDEX_CLIENT_ID}
YANDEX_CLIENT_SECRET=${YANDEX_CLIENT_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
EOF
ssh "$REMOTE" "chmod 600 '${REMOTE_DIR}/.env'"

# SQLite: один раз схема, существующую БД не трогаем
if ! ssh "$REMOTE" "test -f '${REMOTE_DIR}/db.db'"; then
  echo "==> Seeding empty SQLite from schema.sql…"
  SEED_DB="$(mktemp -t snake-seed.XXXXXX.db)"
  sqlite3 "$SEED_DB" < "${ROOT}/schema.sql"
  scp "$SEED_DB" "${REMOTE}:${REMOTE_DIR}/db.db"
  rm -f "$SEED_DB"
fi

echo "==> Installing service + nginx symlink, restart…"
ssh "$REMOTE" bash -s -- "$REMOTE_DIR" "$SERVICE" "$NGINX_SITE" "$APP_PORT" <<'EOF'
set -euo pipefail
REMOTE_DIR=$1
SERVICE=$2
NGINX_SITE=$3
PORT=$4

export PATH="$HOME/.deno/bin:/usr/local/bin:$PATH"
command -v deno >/dev/null || { echo "Deno not found in PATH"; exit 1; }

cd "${REMOTE_DIR}/src/back"
deno install

# systemd unit → файл в /opt/snake (обновляется деплоем)
sudo ln -sfn "${REMOTE_DIR}/${SERVICE}.service" "/etc/systemd/system/${SERVICE}.service"

# nginx site → файл в /opt/snake (не перезаписываем содержимое деплоем)
sudo ln -sfn "${REMOTE_DIR}/${NGINX_SITE}" "/etc/nginx/sites-enabled/${NGINX_SITE}"

sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE}.service"
sudo systemctl restart "${SERVICE}.service"

sudo nginx -t
sudo systemctl reload nginx

# Первый раз — сертификат (certbot правит тот же файл в /opt/snake)
if [[ ! -d "/etc/letsencrypt/live/snake3310.io" ]]; then
  echo "==> Requesting Let's Encrypt cert for snake3310.io…"
  sudo certbot --nginx -d snake3310.io --non-interactive --agree-tos --redirect \
    --register-unsafely-without-email || {
      echo "WARN: certbot failed — HTTP proxy is up; run certbot manually later." >&2
    }
  sudo nginx -t && sudo systemctl reload nginx
fi

sleep 1
curl -fsS "http://127.0.0.1:${PORT}/api/health"
echo
curl -fsS -o /dev/null -w "SSR / -> %{http_code}\n" "http://127.0.0.1:${PORT}/"
systemctl is-active "${SERVICE}.service"
EOF

echo "==> Done. Site: https://snake3310.io"
echo "    OAuth redirect URI: https://snake3310.io/"
