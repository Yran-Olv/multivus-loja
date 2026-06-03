#!/usr/bin/env bash
# Helpers para rodar comandos como root ou como usuário postgres.

run_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

# psql como usuário postgres (heredocs: psql_as_postgres -v ON_ERROR_STOP=1 <<'SQL')
psql_as_postgres() {
  if [ "$(id -u)" -eq 0 ]; then
    if command -v runuser >/dev/null 2>&1; then
      runuser -u postgres -- psql "$@"
    else
      sudo -u postgres psql "$@"
    fi
  else
    sudo -u postgres psql "$@"
  fi
}
