#!/usr/bin/env bash
# Compose de produção (sem porta 80 no container).

compose_prod() {
  docker compose -f docker-compose.yml -f docker-compose.prod.yml "$@"
}

# Remove override local que conflita com Nginx na porta 80
compose_prod_guard_override() {
  for f in docker-compose.override.yml docker-compose.override.yaml; do
    if [ -f "$f" ] && grep -qE '(:80:|0\.0\.0\.0:80)' "$f" 2>/dev/null; then
      echo "⚠️  Renomeando $f → ${f}.disabled (porta 80 é do Nginx no host)"
      mv "$f" "${f}.disabled"
    fi
  done
}
