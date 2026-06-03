#!/usr/bin/env bash
# Atualização completa — um comando (git pull, build, migrate, restart).
# Uso: cd /var/www/multivus-loja && bash scripts/update.sh
#
# Na instalação inicial: SKIP_GIT_PULL=1 bash scripts/update.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

# shellcheck source=lib/compose-prod.sh
source "$SCRIPT_DIR/lib/compose-prod.sh"
# shellcheck source=lib/deploy-pg.sh
source "$SCRIPT_DIR/lib/deploy-pg.sh"

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

strip_host() {
  echo "$1" | sed -E 's|^https?://||; s|/.*$||; s|:.*$||'
}

ensure_uploads_dir() {
  local dir="${1:-public/uploads}"
  mkdir -p "$dir" certs/efi
  chmod 775 "$dir" 2>/dev/null || true
  if [ "$(id -u)" -eq 0 ]; then
    chown -R 1001:1001 "$dir" 2>/dev/null || true
  else
    sudo chown -R 1001:1001 "$dir" 2>/dev/null || true
  fi
  echo "📁 Uploads (host): $(pwd)/$dir"
}

fix_uploads_in_container() {
  local cid
  cid="$(compose_prod ps -q frontend 2>/dev/null | head -1)"
  [ -n "$cid" ] || return 0
  if docker exec -u root "$cid" sh -c 'mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads && chmod 775 /app/public/uploads'; then
    echo "📁 Uploads (container): permissões OK"
  fi
}

certbot_nginx_domains() {
  local fe be
  fe="$(strip_host "${FRONTEND_DOMAIN:-}")"
  be="$(strip_host "${BACKEND_DOMAIN:-}")"
  [ -n "$fe" ] && echo -n " -d ${fe}"
  [ -n "$be" ] && [ "$be" != "$fe" ] && echo -n " -d ${be}"
}

# Resumo quando domínio retorna 525 (SSL Cloudflare ↔ VPS)
diagnose_site_ssl() {
  local host="${1:-$(strip_host "${FRONTEND_DOMAIN:-multivus.shop}")}"
  local site="${2:-}"
  local certbot_args
  certbot_args="$(certbot_nginx_domains)"

  echo -e "${BLUE}── Diagnóstico (SSL / domínio) ──${NC}"
  if curl -sf -o /dev/null --connect-timeout 5 -k -H "Host: ${host}" "https://127.0.0.1/" 2>/dev/null; then
    echo -e "   ${GREEN}✅ HTTPS na VPS (porta 443)${NC}"
  else
    local https_note="porta 443 sem resposta"
    if ss -tln 2>/dev/null | grep -q ':443 '; then
      https_note="443 ativa mas sem certificado válido"
    fi
    echo -e "   ${RED}❌ HTTPS na origem (${https_note}) → Cloudflare 525${NC}"
    echo -e "      ${GREEN}sudo certbot --nginx${certbot_args}${NC}"
    echo -e "      ${GREEN}sudo nginx -t && sudo systemctl reload nginx${NC}"
  fi
  if [ -f /etc/nginx/sites-enabled/multivus-loja-frontend ]; then
    if grep -qE 'listen[[:space:]]+443|ssl_certificate' /etc/nginx/sites-enabled/multivus-loja-frontend 2>/dev/null; then
      echo -e "   ${GREEN}✅ Nginx com bloco HTTPS${NC}"
    else
      echo -e "   ${RED}❌ Nginx só HTTP — rode certbot de novo${NC}"
    fi
  fi
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^multivus-frontend$'; then
    if docker exec -u nextjs multivus-frontend sh -c 'touch /app/public/uploads/.w && rm -f /app/public/uploads/.w' 2>/dev/null; then
      echo -e "   ${GREEN}✅ Upload (nextjs) OK${NC}"
    else
      echo -e "   ${YELLOW}⚠️  Upload: docker exec -u root multivus-frontend chown -R nextjs:nodejs /app/public/uploads${NC}"
    fi
  fi
  echo -e "   Ou Cloudflare → SSL/TLS → ${YELLOW}Flexible${NC} (sem certbot na VPS)"
  echo ""
}

echo -e "${BLUE}══════════════════════════════════════════════${NC}"
echo -e "${BLUE}  MULTIVUS — Atualização${NC}"
echo -e "${BLUE}══════════════════════════════════════════════${NC}"
echo ""

[ -f .env ] || { echo -e "${RED}❌ .env não encontrado — rode: bash scripts/install.sh${NC}"; exit 1; }
set -a && source .env && set +a
command -v docker >/dev/null || { echo -e "${RED}❌ Docker não encontrado${NC}"; exit 1; }

compose_prod_guard_override

export NEXT_PUBLIC_DOMAIN="${NEXT_PUBLIC_DOMAIN:-${FRONTEND_DOMAIN:-}}"
export NEXT_PUBLIC_BACKEND_DOMAIN="${NEXT_PUBLIC_BACKEND_DOMAIN:-${BACKEND_DOMAIN:-}}"

set_env_default() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "${key}=${val}" >> .env
  fi
}

if [ "${SKIP_GIT_PULL:-0}" != "1" ]; then
  [ -d .git ] || { echo -e "${RED}❌ Não é repositório git${NC}"; exit 1; }
  echo -e "${BLUE}🔄 Git (origin)...${NC}"
  git fetch origin
  BRANCH="${BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
  REMOTE_REF="origin/${BRANCH}"
  if ! git rev-parse "$REMOTE_REF" >/dev/null 2>&1; then
    echo -e "${RED}❌ Branch remota não encontrada: ${REMOTE_REF}${NC}"
    exit 1
  fi
  LOCAL_SHA="$(git rev-parse HEAD)"
  REMOTE_SHA="$(git rev-parse "$REMOTE_REF")"
  if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
    if git merge-base --is-ancestor "$LOCAL_SHA" "$REMOTE_SHA" 2>/dev/null; then
      echo "   Atualizando para ${REMOTE_SHA:0:7}..."
    else
      echo -e "${YELLOW}   ⚠️  Histórico divergiu — alinhando com ${REMOTE_REF} (descarta commits só na VPS)${NC}"
    fi
    git reset --hard "$REMOTE_REF"
  fi
  echo -e "   ${GREEN}✅ $(git rev-parse --short HEAD) = ${REMOTE_REF}${NC}"
  echo ""
fi

echo -e "${BLUE}⚙️  Pool PostgreSQL no .env...${NC}"
set_env_default "DB_POOL_MAX" "3"
set_env_default "DB_SEQUELIZE_POOL_MAX" "2"
set -a && source .env && set +a
echo ""

deploy_pg_prepare
echo ""

echo -e "${BLUE}🔨 Build Docker...${NC}"
compose_prod build
echo ""

echo -e "${BLUE}🗄️  Migrations e seeds...${NC}"
if ! compose_prod --profile tools run --rm migrate; then
  echo -e "${RED}❌ Migration falhou — liberando conexões e tentando de novo...${NC}"
  deploy_pg_prepare
  compose_prod --profile tools run --rm migrate
fi
echo ""

echo -e "${BLUE}🚀 Subindo containers...${NC}"
compose_prod up -d --force-recreate --remove-orphans
echo ""

echo -e "${BLUE}📁 Permissões de upload (public/uploads)...${NC}"
ensure_uploads_dir "public/uploads"
fix_uploads_in_container compose_prod
echo ""

if [ -f nginx/generated/multivus-loja-frontend.conf ] || [ -f nginx/local/multivus-loja.frontend.conf ]; then
  echo -e "${BLUE}🔧 Nginx no host...${NC}"
  if sudo -n true 2>/dev/null || [ "$(id -u)" -eq 0 ]; then
    sudo SKIP_APT=1 bash "$SCRIPT_DIR/setup-host-services.sh" 2>/dev/null || true
  fi
  echo ""
fi

echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Atualização concluída — $(git rev-parse --short HEAD 2>/dev/null || echo '?')${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo ""
compose_prod ps
echo ""

FRONTEND_PORT="${FRONTEND_PORT:-3255}"
sleep 3
if curl -sf -o /dev/null --connect-timeout 10 "http://127.0.0.1:${FRONTEND_PORT}/home"; then
  echo -e "${GREEN}   Health: http://127.0.0.1:${FRONTEND_PORT}/home OK${NC}"
else
  echo -e "${YELLOW}   ⚠️  App iniciando — logs: docker compose logs -f frontend${NC}"
fi

SITE="${NEXT_PUBLIC_SITE_URL:-${FRONTEND_DOMAIN:-}}"
[ -n "$SITE" ] && echo -e "   Site: ${GREEN}${SITE}${NC}"

if [ -n "$SITE" ]; then
  CF_CODE="$(curl -sI -o /dev/null -w "%{http_code}" --connect-timeout 15 "${SITE%/}/" 2>/dev/null)"
  CF_CODE="${CF_CODE:-err}"
  if [ "$CF_CODE" = "525" ]; then
    CERTBOT_CMD="sudo certbot --nginx$(certbot_nginx_domains)"
    echo ""
    echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}  ⚠️  Domínio com erro 525 (Cloudflare ↔ VPS)${NC}"
    echo -e "${YELLOW}══════════════════════════════════════════════${NC}"
    echo -e "  App Docker OK; falta HTTPS no Nginx (porta 443)."
    echo ""
    echo -e "  ${GREEN}Corrigir na VPS (copie e cole):${NC}"
    echo -e "    ${CERTBOT_CMD}"
    echo -e "    sudo nginx -t && sudo systemctl reload nginx"
    echo ""
    echo -e "  Depois: Cloudflare → SSL/TLS → ${GREEN}Full (strict)${NC}"
    echo -e "  Alternativa rápida: Cloudflare → ${GREEN}Flexible${NC} (sem certbot)"
    echo -e "  Ver: docs/CLOUDFLARE-SSL.md"
    echo ""
    diagnose_site_ssl "$(strip_host "${FRONTEND_DOMAIN:-}")" "$SITE"
  elif [ "$CF_CODE" = "200" ] || [ "$CF_CODE" = "301" ] || [ "$CF_CODE" = "302" ] || [ "$CF_CODE" = "307" ]; then
    echo -e "   Domínio público: ${GREEN}HTTP ${CF_CODE}${NC}"
  fi
fi
echo ""
