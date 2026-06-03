#!/usr/bin/env bash
# Mostra uso de conexões PostgreSQL e libera slots idle (emergência 525 / migrate).
# Uso na VPS: bash scripts/pg-connection-status.sh
#            bash scripts/pg-connection-status.sh --kill-idle
set -euo pipefail

cd "$(dirname "$0")/.."
KILL_IDLE=0
KILL_ALL_APP=0
for arg in "$@"; do
  case "$arg" in
    --kill-idle) KILL_IDLE=1 ;;
    --kill-all-app) KILL_ALL_APP=1 ;;
  esac
done
[ "$KILL_ALL_APP" = "1" ] && KILL_IDLE=1

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DB_NAME="${DB_NAME:-multivus_db}"
DB_USER="${DB_USER:-multivus}"

echo "=== PostgreSQL — conexões (banco: ${DB_NAME}, app: ${DB_USER}) ==="
echo ""

if ! command -v psql >/dev/null; then
  echo "❌ psql não encontrado. Instale: sudo apt install postgresql-client"
  exit 1
fi

run_psql() {
  if [ "$(id -u)" -eq 0 ]; then
    sudo -u postgres psql -v ON_ERROR_STOP=1 "$@"
  else
    sudo -u postgres psql -v ON_ERROR_STOP=1 "$@"
  fi
}

run_psql -c "SHOW max_connections;"
echo ""
run_psql -c "
SELECT usename, state, count(*) AS total
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY usename, state
ORDER BY total DESC;
"
echo ""
run_psql -c "
SELECT count(*) AS conexoes_em_${DB_NAME}
FROM pg_stat_activity
WHERE datname = '${DB_NAME}';
"

if [ "$KILL_ALL_APP" = "1" ]; then
  echo ""
  echo "Encerrando TODAS as conexões de ${DB_USER} em ${DB_NAME}..."
  run_psql -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${DB_NAME}'
  AND usename = '${DB_USER}'
  AND pid <> pg_backend_pid();
"
  echo "✅ Conexões do app encerradas."
elif [ "$KILL_IDLE" = "1" ]; then
  echo ""
  echo "Encerrando conexões idle de ${DB_USER} em ${DB_NAME}..."
  run_psql -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${DB_NAME}'
  AND usename = '${DB_USER}'
  AND state = 'idle'
  AND pid <> pg_backend_pid();
"
  echo "✅ Idle encerradas."
else
  echo ""
  echo "Para liberar: bash scripts/pg-connection-status.sh --kill-idle"
  echo "Emergência (migrate): bash scripts/pg-connection-status.sh --kill-all-app"
fi
