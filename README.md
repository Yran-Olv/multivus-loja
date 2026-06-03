# MULTIVUS — Loja de informática

Plataforma web para **e-commerce**, **assistência técnica**, **blog**, **portfólio de softwares** e **painel administrativo**, construída com **Next.js 16**, **React 19**, **TypeScript** e **PostgreSQL**.

Repositório: [github.com/Yran-Olv/multivus-loja](https://github.com/Yran-Olv/multivus-loja)

---

## Capturas de tela

> Imagens em [`docs/img/`](docs/img/). Se não carregarem no navegador, use os links abaixo.

### Loja (página inicial)

<a href="docs/img/home.png" target="_blank">
  <img
    src="https://raw.githubusercontent.com/Yran-Olv/multivus-loja/main/docs/img/home.png"
    alt="Página inicial da loja MULTIVUS"
    width="920"
  />
</a>

### Painel administrativo

<a href="docs/img/paineladm.png" target="_blank">
  <img
    src="https://raw.githubusercontent.com/Yran-Olv/multivus-loja/main/docs/img/paineladm.png"
    alt="Painel administrativo MULTIVUS"
    width="920"
  />
</a>

### Área do cliente

<a href="docs/img/areacliente.png" target="_blank">
  <img
    src="https://raw.githubusercontent.com/Yran-Olv/multivus-loja/main/docs/img/areacliente.png"
    alt="Área do cliente - login, cadastro e pedidos"
    width="920"
  />
</a>

---

## O que o sistema faz

| Área | Recursos |
|------|----------|
| **Loja** | Catálogo, carrinho, checkout, pedidos, avaliações, **área do cliente** (cadastro com endereço, edição de perfil) |
| **Serviços** | Páginas públicas, solicitação de assistência, ícones por ramo |
| **Conteúdo** | Blog, softwares, formulário de contato |
| **Admin** | Dashboard, produtos, pedidos, mensagens, blog, configurações |
| **Pagamentos** | **Pix via Efí (Gerencianet)** no checkout |
| **Integrações** | WhatsApp (notificações), webhook Efí |

---

## Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, shadcn/ui  
- **Backend:** API Routes, Server Actions, JWT (`jose`), validação (`zod`)  
- **Banco:** PostgreSQL + Sequelize (migrations/seeds)  
- **Produção (VPS):** Docker (app), PostgreSQL + Nginx + Certbot no **host**

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
```

Crie `.env` na raiz (veja [.env.example](.env.example) e [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md)):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multivus_db
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=chave_secreta_com_pelo_menos_32_caracteres
NODE_ENV=development
FRONTEND_DOMAIN=http://localhost:3000
```

```bash
npm run db:create    # se necessário
npm run db:migrate
npm run db:seed
npm run dev
```

- Site: http://localhost:3000  
- Admin: http://localhost:3000/admin/login — usuário `admin`, senha `admin123` (altere em produção)

---

## Produção (VPS)

A aplicação roda em **containers Docker**; **PostgreSQL**, **Nginx** e **SSL** ficam no servidor.

| Componente | Onde |
|------------|------|
| Next.js (portas 3255 / 3256) | Docker |
| PostgreSQL | Host |
| Nginx + Certbot | Host |

### Dois comandos

**Primeira instalação** (interativo — domínio, banco, Nginx):

```bash
cd /var/www/multivus-loja
bash scripts/install.sh
```

**Atualização** (git pull, build, migrate, containers, permissões de upload):

```bash
cd /var/www/multivus-loja
bash scripts/update.sh
```

Ver portas em uso: `bash scripts/install.sh --ports-only`

Detalhes: [docs/DOCKER.md](docs/DOCKER.md)

### SSL e domínio (Cloudflare)

Se o site retornar **525**, ajuste SSL entre Cloudflare e a VPS: [docs/CLOUDFLARE-SSL.md](docs/CLOUDFLARE-SSL.md)

Exemplo após instalar Nginx:

```bash
sudo certbot --nginx -d multivus.shop -d api.multivus.shop
```

O `update.sh` **não remove** blocos HTTPS já configurados pelo Certbot.

### Pagamentos Efí (Pix)

1. Conta e app na [Efí](https://sejaefi.com.br) (API Pix + certificado `.p12`)  
2. Arquivo em `certs/efi/` na VPS (montado em `/app/certs/efi` no container)  
3. Admin → **Configurações → Efí Pix** — use caminho `/app/certs/efi/seu-arquivo.p12`  
4. Guia completo: [docs/EFI-PAGAMENTOS.md](docs/EFI-PAGAMENTOS.md)

### Upload de imagens (admin)

Arquivos em `public/uploads/` no host; o container grava como usuário `nextjs`. O `update.sh` ajusta permissões automaticamente.

---

## Estrutura (resumo)

```
multivus-loja/
├── app/              # Rotas Next.js (loja, admin, API)
├── components/       # UI React
├── lib/              # DB, Efí, WhatsApp, segurança
├── database/         # Migrations e seeds Sequelize
├── public/uploads/   # Imagens enviadas pelo admin
├── certs/efi/        # Certificados .p12 (não versionados)
├── nginx/            # Templates Nginx
├── scripts/
│   ├── install.sh    # Instalação inicial
│   └── update.sh     # Atualização em produção
└── docs/             # Documentação
```

Mais detalhes: [docs/ESTRUTURA.md](docs/ESTRUTURA.md)

---

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [docs/DOCKER.md](docs/DOCKER.md) | Docker, install/update, uploads |
| [docs/CLOUDFLARE-SSL.md](docs/CLOUDFLARE-SSL.md) | Erro 525, Certbot, Cloudflare |
| [docs/EFI-PAGAMENTOS.md](docs/EFI-PAGAMENTOS.md) | Pix Efí, certificado, webhook |
| [docs/PAINEL-ADMIN.md](docs/PAINEL-ADMIN.md) | Painel administrativo |
| [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md) | Variáveis de ambiente |
| [docs/BANCO-DADOS.md](docs/BANCO-DADOS.md) | Migrations e seeds |
| [docs/API.md](docs/API.md) | Endpoints da API |
| [docs/WHATSAPP.md](docs/WHATSAPP.md) | WhatsApp |
| [docs/SEGURANCA.md](docs/SEGURANCA.md) | Segurança |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Problemas comuns |

Menu legado (opcional): `bash scripts/multivus.sh`

---

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após build |
| `npm run db:migrate` | Migrations |
| `npm run db:seed` | Seeds |

---

## Commits

O repositório usa hook em `.githooks/` para não incluir trailers automáticos da IDE. Após clonar:

```bash
git config core.hooksPath .githooks
```

(O `install.sh` configura isso na instalação.)

---

## Licença

Projeto proprietário. Todos os direitos reservados.
