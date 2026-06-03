# Scripts MULTIVUS (Docker)

## Comandos principais

| Script | Quando usar |
|--------|-------------|
| `bash scripts/install.sh` | **Primeira instalação** (domínio, .env, Nginx, Postgres, build) |
| `bash scripts/update.sh` | **Atualizar produção** (git pull, build, migrate, restart) |

## Utilitários

| Script | Função |
|--------|--------|
| `install.sh --ports-only` | Lista portas em uso |
| `pg-connection-status.sh` | Diagnóstico / `--kill-all-app` se Postgres cheio |
| `purge-demo-catalog.sh` | Remove catálogo demo |
| `setup-host-services.sh` | Nginx no host (sudo; usado pelo install) |
| `setup-postgres-only.sh` | Cria banco/usuário (sudo) |
| `multivus.sh` | Menu (backup, SSL legado PM2, etc.) |

## VPS

```bash
cd /var/www/multivus-loja
bash scripts/update.sh
```

Documentação: [docs/DOCKER.md](../docs/DOCKER.md)
