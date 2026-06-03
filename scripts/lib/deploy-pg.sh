#!/usr/bin/env bash
# Libera conexões PostgreSQL antes de migrate (VPS com frontend + backend).

deploy_pg_prepare() {
  local root="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
  local db_name="${DB_NAME:-multivus_db}"
  local db_user="${DB_USER:-multivus}"

  if ! command -v psql >/dev/null; then
    echo "⚠️  psql não encontrado — pulando limpeza de conexões"
    return 0
  fi

  echo "🐘 Preparando PostgreSQL (${db_user} @ ${db_name})..."

  if [ "${DEPLOY_STOP_APP_FOR_MIGRATE:-1}" = "1" ]; then
    echo "   Parando frontend/backend para liberar pool..."
    compose_prod stop frontend backend 2>/dev/null || true
    sleep 2
  fi

  if [ -f "$root/scripts/pg-connection-status.sh" ]; then
    bash "$root/scripts/pg-connection-status.sh" --kill-all-app || true
  else
    sudo -u postgres psql -v ON_ERROR_STOP=0 -c "
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${db_name}'
        AND usename = '${db_user}'
        AND pid <> pg_backend_pid();
    " 2>/dev/null || true
  fi

  sleep 1
}
