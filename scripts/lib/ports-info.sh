#!/usr/bin/env bash
# Funções para listar e validar portas (host + Docker)

ports_info_colors() {
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  NC='\033[0m'
}

# Retorna 0 se a porta está em uso (host ou Docker)
port_in_use() {
  local port="$1"
  [[ "$port" =~ ^[0-9]+$ ]] || return 1

  if command -v ss >/dev/null 2>&1; then
    while read -r addr; do
      local lp="${addr##*:}"
      lp="${lp%%%*}"
      [ "$lp" = "$port" ] && return 0
    done < <(ss -tlnH 2>/dev/null | awk '{print $4}')
  fi

  if command -v lsof >/dev/null 2>&1; then
    if lsof -Pi ":$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
      return 0
    fi
  fi

  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    # Porta publicada no host (docker-proxy)
    if docker ps --format '{{.Ports}}' 2>/dev/null | grep -qE "(0\.0\.0\.0|127\.0\.0\.1|\[::\]|^)${port}:|->.*:${port}/"; then
      return 0
    fi
  fi

  return 1
}

# Quem está usando a porta (texto curto)
port_usage_detail() {
  local port="$1"
  local line=""

  if command -v ss >/dev/null 2>&1; then
    line="$(ss -tlnp 2>/dev/null | grep -E ":${port}\s" | head -1)"
    if [ -n "$line" ]; then
      echo "$line" | sed -n 's/.*users:((\"\([^\"]*\)\".*/\1/p'
      [ -n "$(echo "$line" | sed -n 's/.*users:((\"\([^\"]*\)\".*/\1/p')" ] && return
      echo "$line" | awk '{print $4}'
      return
    fi
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -Pi ":$port" -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $1, $2}'
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null | grep ":${port}->" | head -1 | awk '{print "docker:"$1}'
  fi
}

show_ports_in_use() {
  ports_info_colors
  echo ""
  echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Portas TCP em escuta no HOST (VPS/sistema)${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"

  if command -v ss >/dev/null 2>&1; then
    printf "  %-8s %-40s %s\n" "PORTA" "ENDEREÇO" "PROCESSO"
    echo "  ─────────────────────────────────────────────────────────"
    ss -tlnp 2>/dev/null | tail -n +2 | while read -r line; do
      addr="$(echo "$line" | awk '{print $4}')"
      port="${addr##*:}"
      port="${port%%%*}"
      proc="$(echo "$line" | sed -n 's/.*users:((\"\([^\"]*\)\".*/\1/p' | head -1)"
      if [[ "$port" =~ ^[0-9]+$ ]]; then
        printf "  %-8s %-40s %s\n" "$port" "$addr" "$proc"
      fi
    done | sort -t' ' -k1 -n | awk '!seen[$1]++'
  elif command -v lsof >/dev/null 2>&1; then
    lsof -iTCP -sTCP:LISTEN -P -n 2>/dev/null | awk 'NR>1 {printf "  %-8s %s\n", $9, $1}'
  else
    echo -e "  ${YELLOW}(instale ss ou lsof para listar portas)${NC}"
  fi

  echo ""
  echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Containers Docker e portas publicadas${NC}"
  echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"

  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    local count
    count="$(docker ps -q 2>/dev/null | wc -l)"
    if [ "$count" -eq 0 ]; then
      echo "  (nenhum container em execução)"
    else
      docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}' 2>/dev/null
    fi
  else
    echo -e "  ${YELLOW}Docker não está instalado ou o daemon não está rodando${NC}"
  fi
  echo ""
}

validate_port_number() {
  local port="$1"
  [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 1024 ] && [ "$port" -le 65535 ]
}

prompt_free_port() {
  local var_name="$1"
  local label="$2"
  local default="$3"
  local other_port="${4:-}"

  ports_info_colors

  while true; do
    show_ports_in_use
    read -r -p "🔌 $label (padrão: $default): " chosen
    chosen="${chosen:-$default}"

    if ! validate_port_number "$chosen"; then
      echo -e "${RED}❌ Porta inválida. Use um número entre 1024 e 65535.${NC}"
      continue
    fi

    if [ -n "$other_port" ] && [ "$chosen" = "$other_port" ]; then
      echo -e "${RED}❌ Deve ser diferente da outra porta da aplicação ($other_port).${NC}"
      continue
    fi

    if port_in_use "$chosen"; then
      local detail
      detail="$(port_usage_detail "$chosen")"
      echo -e "${RED}❌ Porta $chosen já está em uso${NC}${detail:+ ($detail)}"
      read -r -p "   Usar outra porta? (S/n): " retry
      if [[ "${retry,,}" == "n" ]]; then
        printf -v "$var_name" '%s' "$chosen"
        echo -e "${YELLOW}⚠️  Continuando mesmo com a porta em uso — pode haver conflito.${NC}"
        return 0
      fi
      continue
    fi

    printf -v "$var_name" '%s' "$chosen"
    echo -e "${GREEN}✅ Porta $chosen disponível${NC}"
    return 0
  done
}

strip_url_scheme() {
  echo "$1" | sed -E 's|^https?://||; s|/.*$||; s|:.*$||'
}
