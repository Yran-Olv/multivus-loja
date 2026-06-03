#!/usr/bin/env bash
# Host: Nginx (proxy), opcional apt. Postgres: setup-postgres-only.sh
# Uso VPS: sudo FRONTEND_HOST=... BACKEND_HOST=... bash scripts/setup-host-services.sh
#          SKIP_APT=1  (quando nginx/postgres/certbot já instalados)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# shellcheck source=lib/run-as-root.sh
source "$SCRIPT_DIR/lib/run-as-root.sh"

if [ "$(id -u)" -ne 0 ] && ! sudo -n true 2>/dev/null; then
  echo "Execute com sudo: sudo bash scripts/setup-host-services.sh"
  exit 1
fi

[ -f .env ] && set -a && source .env && set +a

strip_host() {
  echo "$1" | sed -E 's|^https?://||; s|/.*$||; s|:.*$||'
}

FRONTEND_HOST="${FRONTEND_HOST:-$(strip_host "${FRONTEND_DOMAIN:-multivus.local}")}"
BACKEND_HOST="${BACKEND_HOST:-$(strip_host "${BACKEND_DOMAIN:-apiloja.multivus.local}")}"
FRONTEND_PORT="${FRONTEND_PORT:-3255}"
BACKEND_PORT="${BACKEND_PORT:-3256}"
SKIP_APT="${SKIP_APT:-0}"

render_nginx() {
  sed \
    -e "s|__PROJECT_DIR__|${PROJECT_DIR}|g" \
    -e "s|__FRONTEND_PORT__|${FRONTEND_PORT}|g" \
    -e "s|__BACKEND_PORT__|${BACKEND_PORT}|g" \
    -e "s|__FRONTEND_HOST__|${FRONTEND_HOST}|g" \
    -e "s|__BACKEND_HOST__|${BACKEND_HOST}|g" \
    "$1"
}

if [ "$SKIP_APT" = "1" ]; then
  echo "📦 SKIP_APT=1 — apenas Nginx (postgres/certbot já no host)"
elif command -v nginx >/dev/null && command -v psql >/dev/null; then
  echo "📦 Serviços já instalados — pulando apt"
  if [ "${RUN_DB_SETUP:-0}" = "1" ]; then
    bash "$SCRIPT_DIR/setup-postgres-only.sh"
  fi
else
  echo "📦 Instalando PostgreSQL, Nginx e Certbot..."
  export DEBIAN_FRONTEND=noninteractive
  run_root apt-get update -qq
  run_root apt-get install -y postgresql nginx certbot python3-certbot-nginx
  run_root systemctl enable postgresql nginx
  run_root systemctl start postgresql nginx
  bash "$SCRIPT_DIR/setup-postgres-only.sh"
fi

echo "🌐 /etc/hosts (apenas domínios .local)..."
for host in "$FRONTEND_HOST" "www.$FRONTEND_HOST" "$BACKEND_HOST"; do
  [[ "$host" == *".local" ]] || continue
  if ! grep -qE "[[:space:]]${host}([[:space:]]|$)" /etc/hosts 2>/dev/null; then
    echo "127.0.0.1 ${host}" | run_root tee -a /etc/hosts >/dev/null
  fi
done

echo "🔧 Nginx → ${FRONTEND_HOST}:${FRONTEND_PORT}, ${BACKEND_HOST}:${BACKEND_PORT}"
run_root mkdir -p /var/www/html

# Não sobrescrever config com SSL do Certbot — update.sh chamava isto a cada deploy e causava 525.
deploy_nginx_site() {
  local dest_name="$1"
  local dest="/etc/nginx/sites-available/${dest_name}"
  local tmp
  tmp="$(mktemp)"

  if [ "$2" = "generated" ]; then
    cat "nginx/generated/${dest_name}.conf" >"$tmp"
  else
    render_nginx "$2" >"$tmp"
  fi

  if [ "${FORCE_NGINX:-0}" != "1" ] && [ -f "$dest" ]; then
    if grep -qE 'listen[[:space:]]+443|ssl_certificate' "$dest" 2>/dev/null; then
      echo "   ⏭️  ${dest_name}: mantendo config com HTTPS (Certbot). Use FORCE_NGINX=1 para sobrescrever."
      rm -f "$tmp"
      return 0
    fi
  fi

  run_root tee "$dest" >/dev/null <"$tmp"
  rm -f "$tmp"
  echo "   ✅ ${dest_name}: config aplicada"
}

if [ -f nginx/generated/multivus-loja-frontend.conf ]; then
  deploy_nginx_site multivus-loja-frontend generated
  deploy_nginx_site multivus-loja-backend generated
else
  deploy_nginx_site multivus-loja-frontend nginx/local/multivus-loja.frontend.conf
  deploy_nginx_site multivus-loja-backend nginx/local/multivus-loja.backend.conf
fi

run_root ln -sf /etc/nginx/sites-available/multivus-loja-frontend /etc/nginx/sites-enabled/multivus-loja-frontend
run_root ln -sf /etc/nginx/sites-available/multivus-loja-backend /etc/nginx/sites-enabled/multivus-loja-backend
[ -f /etc/nginx/sites-enabled/default ] && run_root rm -f /etc/nginx/sites-enabled/default
run_root nginx -t
run_root systemctl reload nginx

echo "✅ Nginx configurado."
