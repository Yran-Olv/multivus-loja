# multivus-loja

Loja e site da **Multivus Informática**: e-commerce, assistência técnica, blog, portfólio de softwares com links de ativação e painel administrativo. Integra com o **Multivus-Whaticket** para catálogo, Pix automático no WhatsApp e notificações.

- **Site:** [multivus.shop](https://multivus.shop)  
- **Repositório:** [github.com/Yran-Olv/multivus-loja](https://github.com/Yran-Olv/multivus-loja)  
- **Whaticket:** [Multivus-Whaticket](https://github.com/Yran-Olv/Multivus-Whaticket)

---

## O que o sistema faz

| Área | Recursos |
|------|----------|
| **Loja** | Catálogo, carrinho, checkout Pix, pedidos, área do cliente |
| **Serviços** | Páginas públicas, solicitação de assistência, preço “sob orçamento” |
| **Softwares** | Vitrine, links de ativação em lote, URLs curtas `/r/{code}` |
| **Conteúdo** | Blog, contato, sobre |
| **Admin** | Dashboard, produtos, serviços, softwares, pedidos, blog, configurações |
| **Pagamentos** | **Pix via Efí (Gerencianet)** — checkout e webhook |
| **Integrações** | Sync catálogo → Whaticket, credenciais Efí para Pix no fluxo WhatsApp, WhatsApp (notificações) |

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS, shadcn/ui |
| Banco | PostgreSQL + Sequelize (migrations/seeds) |
| Auth admin | JWT (`jose`) |
| Produção | Docker (app) + PostgreSQL, Nginx e Certbot no **host** |

---

## Estrutura do repositório

```
multivus-loja/
├── app/                    # Rotas Next.js (loja, admin, API)
├── components/             # UI React
├── lib/                    # DB, Efí, WhatsApp, catalog-sync, segurança
├── database/               # Migrations e seeds Sequelize
├── public/uploads/         # Imagens do admin (volume Docker)
├── certs/efi/              # Certificados .p12 Efí (não versionados)
├── nginx/                  # Templates Nginx
├── scripts/
│   ├── install.sh          # Instalação inicial na VPS
│   └── update.sh           # Atualização (pull, build, migrate, containers)
└── docs/                   # Documentação detalhada
```

Mais detalhes: [docs/ESTRUTURA.md](docs/ESTRUTURA.md)

---

## Desenvolvimento local

### Pré-requisitos

- Node.js 20+  
- PostgreSQL 12+  
- npm  

### Passos

```bash
git clone https://github.com/Yran-Olv/multivus-loja.git
cd multivus-loja
npm install
cp .env.example .env
```

Edite `.env` (referência: [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md)):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multivus_db
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=chave_secreta_com_pelo_menos_32_caracteres
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
FRONTEND_DOMAIN=http://localhost:3000
```

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

| URL | Descrição |
|-----|-----------|
| http://localhost:3000 | Loja |
| http://localhost:3000/admin/login | Admin — usuário `admin`, senha `admin123` (altere em produção) |

---

## Produção (VPS)

| Componente | Onde roda |
|------------|-----------|
| Next.js (portas **3255** / **3256**) | Docker (`multivus-frontend`, `multivus-backend`) |
| PostgreSQL | Host (`127.0.0.1:5432`) |
| Nginx + SSL | Host |

Caminho típico na VPS Multivus: `/home/deploy/multivus-loja-release`

### Instalação inicial

```bash
cd /home/deploy/multivus-loja-release
bash scripts/install.sh
```

### Atualização (após `git pull`)

```bash
cd /home/deploy/multivus-loja-release
bash scripts/update.sh
```

O `update.sh` faz: build Docker, migrations, recreate containers, permissões de `public/uploads` e `certs/efi`, espelhamento de uploads para Nginx legado.

Ver portas em uso: `bash scripts/install.sh --ports-only`

Documentação: [docs/DOCKER.md](docs/DOCKER.md) · [docs/DEPLOY.md](docs/DEPLOY.md)

### SSL / Cloudflare

Erro **525** (SSL entre Cloudflare e VPS): [docs/CLOUDFLARE-SSL.md](docs/CLOUDFLARE-SSL.md)

---

## Pagamentos Efí (Pix)

1. Conta [Efí](https://sejaefi.com.br) com API Pix + certificado `.p12`  
2. Admin → **Configurações → Efí Pix** (`/admin/configuracoes/efi`)  
3. Envie o certificado pelo painel ou coloque em `certs/efi/` na VPS  
4. Cadastre o webhook no painel Efí: `https://multivus.shop/api/efi/webhook`  
5. Guia completo: [docs/EFI-PAGAMENTOS.md](docs/EFI-PAGAMENTOS.md)

O volume Docker `certs/efi` é **gravável** — upload pelo admin salva em `/app/certs/efi/` no container.

---

## Integração com Multivus-Whaticket

### Sync de catálogo

1. Admin → **Configurações → Catálogo** — gere a chave de sync  
2. No `.env` (ou painel), configure:

```env
CATALOG_SYNC_API_KEY=sua_chave
WHATICKET_API_URL=https://api.multivus.com.br
NEXT_PUBLIC_SITE_URL=https://multivus.shop
```

3. No Whaticket → **Catálogo de produtos** → configure a mesma chave e URL da loja  

Ao salvar produto, serviço ou software na loja, a API notifica o Whaticket (`POST /company-products/loja-sync/webhook`).

Export manual (teste):

```bash
curl -H "X-Catalog-Sync-Key: SUA_CHAVE" https://multivus.shop/api/catalog/export
```

### Tipos exportados

| Tipo na loja | Uso no Whaticket |
|--------------|------------------|
| Produtos | Venda com Pix no fluxo catálogo |
| Serviços | Orçamento (sem Pix automático) |
| Softwares | Venda + pool de links de ativação |

Credenciais Efí também são expostas ao Whaticket via `GET /api/catalog/efi-config` (mesma chave de sync).

---

## Upload de imagens

Arquivos em `public/uploads/` no host. O `update.sh` ajusta permissões (`nextjs`, uid 1001). Em algumas VPS, uploads são espelhados em `/var/www/multivus-loja/public/uploads/` para Nginx legado.

---

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após build |
| `npm run db:migrate` | Migrations Sequelize |
| `npm run db:seed` | Seed admin + dados opcionais |

---

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/README.md](docs/README.md) | Índice completo |
| [docs/DOCKER.md](docs/DOCKER.md) | Docker, install/update, uploads, certs |
| [docs/EFI-PAGAMENTOS.md](docs/EFI-PAGAMENTOS.md) | Pix, certificado, webhook |
| [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md) | Variáveis de ambiente |
| [docs/PAINEL-ADMIN.md](docs/PAINEL-ADMIN.md) | Painel administrativo |
| [docs/API.md](docs/API.md) | Endpoints |
| [docs/WHATSAPP.md](docs/WHATSAPP.md) | WhatsApp |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Problemas comuns |
| [docs/SEGURANCA.md](docs/SEGURANCA.md) | Segurança |

Menu interativo legado: `bash scripts/multivus.sh`

---

## Git hooks (opcional)

Hooks em `.githooks/` evitam trailers indesejados em commits. Após clonar:

```bash
git config core.hooksPath .githooks
```

O `install.sh` pode configurar isso na VPS.

---

## Licença

Projeto proprietário. Todos os direitos reservados.
