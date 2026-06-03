#!/usr/bin/env bash
# Instalação interativa — Docker (app) + PostgreSQL, Nginx e Certbot no host
# Uso: bash scripts/install.sh
#      bash scripts/install.sh --ports-only
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "${1:-}" = "--ports-only" ]; then
  # shellcheck source=lib/ports-info.sh
  source "$SCRIPT_DIR/lib/ports-info.sh"
  show_ports_in_use
  exit 0
fi

PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=lib/ports-info.sh
source "$SCRIPT_DIR/lib/ports-info.sh"

cd "$PROJECT_DIR"

if [ -d .githooks ] && git rev-parse --git-dir >/dev/null 2>&1; then
  git config core.hooksPath .githooks
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

validate_domain() {
  local d="$1"
  [[ "$d" =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ ]] && [[ "$d" == *.* ]]
}

write_env_file() {
  local scheme="${1:-http}"
  cat > .env <<EOF
# Gerado por scripts/install.sh em $(date -Iseconds)
NODE_ENV=production

FRONTEND_PORT=${FRONTEND_PORT}
BACKEND_PORT=${BACKEND_PORT}

FRONTEND_DOMAIN=${scheme}://${FRONTEND_HOST}
BACKEND_DOMAIN=${scheme}://${BACKEND_HOST}
NEXT_PUBLIC_DOMAIN=${scheme}://${FRONTEND_HOST}
NEXT_PUBLIC_BACKEND_DOMAIN=${scheme}://${BACKEND_HOST}
NEXT_PUBLIC_SITE_URL=${scheme}://${FRONTEND_HOST}

DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_POOL_MAX=3
DB_SEQUELIZE_POOL_MAX=2

JWT_SECRET=${JWT_SECRET}

ALLOWED_ORIGINS=${scheme}://${FRONTEND_HOST},${scheme}://www.${FRONTEND_HOST},${scheme}://${BACKEND_HOST}
EOF
  chmod 600 .env
}

render_nginx_config() {
  local src="$1"
  local dest="$2"
  sed \
    -e "s|__PROJECT_DIR__|${PROJECT_DIR}|g" \
    -e "s|__FRONTEND_PORT__|${FRONTEND_PORT}|g" \
    -e "s|__BACKEND_PORT__|${BACKEND_PORT}|g" \
    -e "s|__FRONTEND_HOST__|${FRONTEND_HOST}|g" \
    -e "s|__BACKEND_HOST__|${BACKEND_HOST}|g" \
    "$src" > "$dest"
}

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  MULTIVUS — Instalação (Docker + host)${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo "  • App: Docker (frontend + backend)"
echo "  • PostgreSQL, Nginx, Certbot: no host"
echo ""

command -v docker >/dev/null || { echo -e "${RED}❌ Docker não encontrado${NC}"; exit 1; }

show_ports_in_use

echo -e "${CYAN}Tipo de ambiente:${NC}"
echo "  1) Local (domínios .local, /etc/hosts)"
echo "  2) VPS / produção (domínio real, Nginx :80)"
read -r -p "Escolha [1/2] (padrão: 1): " ENV_TYPE
ENV_TYPE="${ENV_TYPE:-1}"

USE_LOCAL_HOSTS=0
URL_SCHEME="http"
if [ "$ENV_TYPE" = "1" ]; then
  USE_LOCAL_HOSTS=1
  FRONTEND_HOST_DEFAULT="multivus.local"
  BACKEND_HOST_DEFAULT="apiloja.multivus.local"
else
  FRONTEND_HOST_DEFAULT=""
  BACKEND_HOST_DEFAULT=""
  read -r -p "Usar HTTPS nos links da aplicação? (s/N): " USE_HTTPS
  if [[ "${USE_HTTPS,,}" == "s" ]]; then
    URL_SCHEME="https"
  fi
fi

while true; do
  read -r -p "🌐 Domínio da loja (frontend)${FRONTEND_HOST_DEFAULT:+ [$FRONTEND_HOST_DEFAULT]}: " FRONTEND_HOST
  FRONTEND_HOST="${FRONTEND_HOST:-$FRONTEND_HOST_DEFAULT}"
  FRONTEND_HOST="$(strip_url_scheme "$FRONTEND_HOST")"
  if validate_domain "$FRONTEND_HOST"; then break; fi
  echo -e "${RED}❌ Domínio inválido (ex: multivus.shop)${NC}"
done

read -r -p "🌐 Domínio da API (backend) [Enter = apiloja.${FRONTEND_HOST#*.}]: " BACKEND_HOST
if [ -z "$BACKEND_HOST" ]; then
  if [[ "$FRONTEND_HOST" == *.* ]]; then
    BACKEND_HOST="apiloja.${FRONTEND_HOST#*.}"
  else
    BACKEND_HOST="apiloja.$FRONTEND_HOST"
  fi
fi
BACKEND_HOST="$(strip_url_scheme "$BACKEND_HOST")"

prompt_free_port FRONTEND_PORT "Porta do container FRONTEND (Nginx fará proxy)" "3255"
prompt_free_port BACKEND_PORT "Porta do container BACKEND (API)" "3256" "$FRONTEND_PORT"

echo ""
read -r -p "🗄️  Nome do banco PostgreSQL [multivus_db]: " DB_NAME
DB_NAME="$(echo "${DB_NAME:-multivus_db}" | tr -d '[:space:]')"
read -r -p "👤 Usuário PostgreSQL [multivus]: " DB_USER
DB_USER="$(echo "${DB_USER:-multivus}" | tr -d '[:space:]')"
if [[ ! "$DB_NAME" =~ ^[a-zA-Z0-9_]+$ ]] || [[ ! "$DB_USER" =~ ^[a-zA-Z0-9_]+$ ]]; then
  echo -e "${RED}❌ Nome do banco e usuário: apenas letras, números e _${NC}"
  exit 1
fi
if [ ! -f .env ] || [ "${REGEN_DB_PASS:-}" = "1" ]; then
  DB_PASSWORD="$(openssl rand -hex 16)"
  echo -e "${GREEN}   Senha do banco gerada (salva no .env)${NC}"
else
  read -r -sp "🔐 Senha PostgreSQL [Enter = gerar nova]: " DB_PASSWORD
  echo ""
  DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -hex 16)}"
fi

JWT_SECRET="$(openssl rand -base64 32 | tr -d '\n')"

write_env_file "$URL_SCHEME"

mkdir -p nginx/generated public/uploads logs
render_nginx_config nginx/local/multivus-loja.frontend.conf nginx/generated/multivus-loja-frontend.conf
render_nginx_config nginx/local/multivus-loja.backend.conf nginx/generated/multivus-loja-backend.conf

echo ""
echo -e "${BLUE}📋 Resumo${NC}"
echo "   Loja:  ${URL_SCHEME}://${FRONTEND_HOST} → 127.0.0.1:${FRONTEND_PORT}"
echo "   API:   ${URL_SCHEME}://${BACKEND_HOST} → 127.0.0.1:${BACKEND_PORT}"
echo "   Banco: ${DB_NAME} (${DB_USER})"
echo ""

if [ "$USE_LOCAL_HOSTS" -eq 1 ]; then
  read -r -p "Mapear localhost:80 para a loja (docker-compose.local.yml)? (s/N): " MAP80
  if [[ "${MAP80,,}" != "s" ]]; then
    rm -f docker-compose.override.yml 2>/dev/null || true
  fi
fi

DB_READY=0
CONFIGURE_HOST=0

if [ "$ENV_TYPE" = "2" ]; then
  read -r -p "Configurar Nginx no host? (S/n): " DO_NGINX
  DO_NGINX="${DO_NGINX:-S}"
else
  read -r -p "Instalar PostgreSQL + Nginx no host? (sudo) (S/n): " DO_NGINX
  DO_NGINX="${DO_NGINX:-S}"
fi

if [[ "${DO_NGINX,,}" != "n" ]]; then
  export FRONTEND_HOST BACKEND_HOST FRONTEND_PORT BACKEND_PORT
  if sudo SKIP_APT=1 bash "$SCRIPT_DIR/setup-host-services.sh"; then
    CONFIGURE_HOST=1
    DB_READY=1
  else
    echo -e "${RED}❌ Falha ao configurar host${NC}"
    exit 1
  fi
else
  read -r -p "Criar banco PostgreSQL agora? (S/n): " DO_DB
  DO_DB="${DO_DB:-S}"
  if [[ "${DO_DB,,}" != "n" ]] && sudo bash "$SCRIPT_DIR/setup-postgres-only.sh"; then
    DB_READY=1
  fi
  if [ "$DB_READY" -eq 0 ]; then
    read -r -p "Banco já existe com a senha do .env? (s/N): " DB_MANUAL
    [[ "${DB_MANUAL,,}" == "s" ]] && DB_READY=1
  fi
fi

if [ "$USE_LOCAL_HOSTS" -eq 1 ] && [ "$CONFIGURE_HOST" -eq 0 ]; then
  echo -e "${YELLOW}Adicione ao /etc/hosts:${NC} 127.0.0.1 $FRONTEND_HOST $BACKEND_HOST"
fi

if [ "$DB_READY" -eq 0 ]; then
  echo -e "${RED}❌ Configure o banco antes de continuar: sudo bash scripts/setup-postgres-only.sh${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}🐳 Build, migrate e containers (scripts/update.sh)...${NC}"
export NEXT_PUBLIC_DOMAIN="${URL_SCHEME}://${FRONTEND_HOST}"
export NEXT_PUBLIC_BACKEND_DOMAIN="${URL_SCHEME}://${BACKEND_HOST}"
SKIP_GIT_PULL=1 bash "$SCRIPT_DIR/update.sh"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Instalação concluída${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "   Loja:  ${GREEN}${URL_SCHEME}://${FRONTEND_HOST}${NC}"
echo -e "   Admin: ${URL_SCHEME}://${FRONTEND_HOST}/admin/login  (admin / admin123)"
echo -e "   Atualizar depois: ${CYAN}bash scripts/update.sh${NC}"
echo -e "   Portas: ${CYAN}bash scripts/install.sh --ports-only${NC}"

if [ "$ENV_TYPE" = "2" ] && [ "$CONFIGURE_HOST" -eq 1 ]; then
  read -r -p "Configurar SSL com Certbot agora? (s/N): " DO_SSL
  if [[ "${DO_SSL,,}" == "s" ]]; then
    sudo certbot --nginx -d "$FRONTEND_HOST" -d "$BACKEND_HOST" 2>/dev/null || \
      sudo certbot --nginx -d "$FRONTEND_HOST" || true
    echo -e "${YELLOW}Cloudflare: use Full (strict) após certificado, ou Flexible sem certbot — docs/CLOUDFLARE-SSL.md${NC}"
  fi
fi
