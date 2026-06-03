#!/usr/bin/env bash
# Remove produtos/serviços/softwares de demonstração (produção).
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" != "--yes" ]; then
  echo "Remove do banco os itens de exemplo (produtos, serviços, softwares)."
  echo "Usuário admin e outros cadastros reais NÃO são removidos."
  echo ""
  read -r -p "Continuar? (s/SIM): " confirm
  confirm="$(echo "$confirm" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')"
  case "$confirm" in
    s|sim|yes|y) ;;
    *) echo "Cancelado."; exit 0 ;;
  esac
fi

[ -f .env ] || { echo "❌ .env não encontrado"; exit 1; }
set -a && source .env && set +a

DB_HOST="${DB_HOST:-127.0.0.1}"
if [ "$DB_HOST" = "host.docker.internal" ] || [ "$DB_HOST" = "localhost" ]; then
  DB_HOST="127.0.0.1"
fi

export PGPASSWORD="${DB_PASSWORD:?DB_PASSWORD ausente no .env}"

echo "🗑️  Removendo catálogo demo em ${DB_NAME}..."
psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "${DB_USER}" -d "${DB_NAME}" \
  -v ON_ERROR_STOP=1 -f scripts/sql/purge-demo-catalog.sql

echo "✅ Catálogo demo removido."
