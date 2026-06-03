# Docker + infra no host

| Componente | Onde roda |
|------------|-----------|
| Next.js (frontend `:3255`, backend `:3256`) | **Docker** |
| PostgreSQL | **Host** |
| Nginx | **Host** |
| Certbot | **Host** |

## Dois comandos

### Instalar (primeira vez)

```bash
cd /var/www/multivus-loja
bash scripts/install.sh
```

Pergunta domínio, portas, banco, configura Nginx/Postgres no host e chama `update.sh` para build + migrate + containers.

Só listar portas em uso:

```bash
bash scripts/install.sh --ports-only
```

### Atualizar (VPS — uso diário)

```bash
cd /var/www/multivus-loja
bash scripts/update.sh
```

Faz: `git pull` → pool no `.env` → libera Postgres → **build** → **migrate** → sobe containers → Nginx → health check.

Sem flags. Sem outros scripts de deploy.

## Menu (opcional)

```bash
bash scripts/multivus.sh
```

Opções Docker: **15** instalar, **2** atualizar, **16** portas.

## Comandos úteis

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend
bash scripts/pg-connection-status.sh --kill-all-app   # Postgres sem vagas
bash scripts/purge-demo-catalog.sh
```

**Nginx + SSL:** o `update.sh` não sobrescreve mais configs que já têm HTTPS (Certbot). Se o domínio caiu com 525 após um update antigo, rode `sudo certbot --nginx -d multivus.shop` (veja [CLOUDFLARE-SSL.md](CLOUDFLARE-SSL.md)).

## Upload de imagens no admin (erro 500)

O container grava em `public/uploads` (volume no host). O processo roda como usuário **nextjs (uid 1001)**. Se a pasta no host for de `root`, o upload retorna 500.

O `update.sh` ajusta permissões no host e no container. O entrypoint do Docker (`docker-entrypoint.sh`) também corrige o volume ao subir — necessário quando o Docker usa **userns-remap** (nesse caso `chown 1001` no host não coincide com o usuário `nextjs` dentro do container).

Correção imediata (sem rebuild):

```bash
cd /var/www/multivus-loja
docker exec -u root multivus-frontend sh -c 'chown -R nextjs:nodejs /app/public/uploads && chmod 775 /app/public/uploads'
```

Depois do `git pull`, rode `bash scripts/update.sh` (rebuild da imagem com o novo entrypoint).

Correção só no host (pode não bastar com userns):

```bash
sudo mkdir -p /var/www/multivus-loja/public/uploads
sudo chown -R 1001:1001 /var/www/multivus-loja/public/uploads
sudo chmod 775 /var/www/multivus-loja/public/uploads
```

Logs: `docker compose -f docker-compose.yml -f docker-compose.prod.yml logs frontend --tail 50 | grep UPLOAD`

## SSL / Cloudflare (erro 525)

Ver [CLOUDFLARE-SSL.md](CLOUDFLARE-SSL.md).

## Arquivos internos (não rode direto)

- `scripts/lib/compose-prod.sh` — compose produção
- `scripts/lib/deploy-pg.sh` — libera conexões antes do migrate
- `scripts/setup-host-services.sh` — Nginx (chamado pelo install/update)
- `scripts/setup-postgres-only.sh` — só banco (chamado pelo install)
