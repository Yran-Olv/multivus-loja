#!/usr/bin/env bash
# Cria usuário e banco PostgreSQL no host (lê .env). Não mexe em Nginx.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# shellcheck source=lib/run-as-root.sh
source "$SCRIPT_DIR/lib/run-as-root.sh"

if [ "$(id -u)" -ne 0 ] && ! sudo -n true 2>/dev/null; then
  echo "Execute com sudo: sudo bash scripts/setup-postgres-only.sh"
  exit 1
fi

[ -f .env ] || { echo "❌ Arquivo .env não encontrado."; exit 1; }
set -a && source .env && set +a

DB_USER="${DB_USER:-multivus}"
DB_PASSWORD="${DB_PASSWORD:?DB_PASSWORD não definido no .env}"
DB_NAME="${DB_NAME:-multivus_db}"

if [[ ! "$DB_NAME" =~ ^[a-zA-Z0-9_]+$ ]] || [[ ! "$DB_USER" =~ ^[a-zA-Z0-9_]+$ ]]; then
  echo "❌ DB_NAME e DB_USER: apenas letras, números e _"
  exit 1
fi

echo "🗄️  Criando/atualizando PostgreSQL: banco=${DB_NAME} usuário=${DB_USER}"

psql_as_postgres -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  ELSE
    ALTER ROLE ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

psql_as_postgres -v ON_ERROR_STOP=1 -d "$DB_NAME" <<SQL
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};
SQL

echo "✅ PostgreSQL pronto."
