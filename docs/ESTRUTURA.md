# 📁 Estrutura do Projeto - MULTIVUS

Este documento descreve a organização de arquivos e pastas do projeto MULTIVUS.

---

## 📂 Estrutura de Diretórios

```
multivus-loja/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Homepage
│   ├── layout.tsx                # Layout raiz
│   ├── globals.css               # Estilos globais
│   │
│   ├── admin/                    # Painel administrativo
│   │   ├── login/                # Página de login
│   │   ├── dashboard/            # Dashboard
│   │   ├── produtos/             # Gestão de produtos
│   │   │   ├── page.tsx          # Listagem
│   │   │   ├── novo/             # Criar produto
│   │   │   └── [id]/             # Editar produto
│   │   ├── softwares/            # Gestão de softwares
│   │   ├── servicos/             # Gestão de serviços
│   │   ├── solicitacoes/         # Gestão de solicitações
│   │   ├── mensagens/            # Gestão de mensagens
│   │   ├── pedidos/              # Gestão de pedidos
│   │   └── blog/                 # Gestão de blog
│   │
│   ├── produtos/                 # Páginas públicas de produtos
│   │   ├── page.tsx              # Listagem
│   │   └── [id]/                 # Detalhes do produto
│   │
│   ├── servicos/                 # Páginas públicas de serviços
│   │   ├── page.tsx              # Listagem
│   │   └── solicitar-servico/    # Formulário de solicitação
│   │
│   ├── softwares/                # Páginas públicas de softwares
│   │   ├── page.tsx              # Listagem
│   │   └── [id]/                 # Detalhes do software
│   │
│   ├── blog/                     # Blog público
│   │   ├── page.tsx              # Listagem de posts
│   │   └── [slug]/               # Post individual
│   │
│   ├── carrinho/                 # Carrinho de compras
│   ├── checkout/                 # Checkout
│   ├── cliente/                  # Área do cliente
│   ├── contato/                  # Página de contato
│   │
│   └── api/                      # API Routes
│       ├── auth/                 # Autenticação
│       │   ├── login/            # POST /api/auth/login
│       │   ├── logout/           # POST /api/auth/logout
│       │   └── me/               # GET /api/auth/me
│       ├── blog/                 # API do blog
│       ├── contact/              # API de contato
│       ├── orders/               # API de pedidos
│       ├── reviews/              # API de avaliações
│       ├── service-requests/     # API de solicitações
│       ├── stripe/               # API do Stripe
│       └── upload/               # API de upload
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes UI (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── admin-sidebar.tsx        # Sidebar do admin
│   ├── cart-button.tsx          # Botão do carrinho
│   ├── chat-widget.tsx          # Widget de chat
│   ├── product-grid.tsx         # Grid de produtos
│   ├── product-form.tsx          # Formulário de produto
│   ├── software-form.tsx        # Formulário de software
│   └── ...
│
├── contexts/                     # Contexts React
│   └── CartContext.tsx           # Context do carrinho
│
├── lib/                          # Utilitários e helpers
│   ├── db.ts                     # Conexão com banco
│   ├── auth.ts                   # Autenticação
│   ├── middleware.ts             # Middleware de auth
│   ├── validation.ts             # Validação (Zod)
│   ├── rate-limit.ts             # Rate limiting
│   ├── email.ts                  # Envio de emails
│   ├── metadata.ts               # Metadata SEO
│   └── ...
│
├── database/                     # Banco de dados
│   ├── config/                   # Configuração Sequelize
│   ├── migrations/               # Migrations
│   └── seeds/                    # Seeds
│
├── public/                       # Arquivos estáticos
│   └── uploads/                  # Uploads de imagens
│
├── scripts/                      # Scripts de deploy e manutenção
│   ├── deploy.sh                 # Script único de deploy
│   ├── backup-database.sh        # Backup do banco
│   └── ...
│
├── docs/                         # Documentação
│   ├── DEPLOY.md                 # Guia de deploy
│   ├── CONFIGURACAO.md           # Configuração
│   ├── INSTALACAO.md             # Instalação
│   └── ...
│
├── middleware.ts                 # Middleware Next.js
├── .sequelizerc                  # Config Sequelize
├── package.json                  # Dependências
├── tsconfig.json                 # Config TypeScript
├── tailwind.config.ts            # Config Tailwind
├── next.config.mjs               # Config Next.js
└── ecosystem.config.js           # Config PM2
```

---

## 📝 Descrição das Pastas Principais

### `/app`
Contém todas as rotas e páginas do Next.js usando App Router. Cada pasta representa uma rota.

### `/components`
Componentes React reutilizáveis. A pasta `ui/` contém componentes base do shadcn/ui.

### `/lib`
Funções utilitárias, helpers e configurações compartilhadas.

### `/database`
Migrations e seeds do Sequelize para gerenciar o banco de dados.

### `/public`
Arquivos estáticos servidos diretamente (imagens, favicons, etc.).

### `/scripts`
Scripts bash para deploy, backup e manutenção do sistema.

### `/docs`
Documentação completa do projeto.

---

## 🔍 Convenções de Nomenclatura

### Arquivos e Pastas
- **Componentes**: PascalCase (ex: `ProductGrid.tsx`)
- **Utilitários**: camelCase (ex: `db.ts`, `auth.ts`)
- **Rotas**: kebab-case (ex: `service-requests/`)
- **Scripts**: kebab-case (ex: `backup-database.sh`)

### Componentes React
- Componentes de página: `page.tsx`
- Componentes de layout: `layout.tsx`
- Componentes reutilizáveis: `NomeDoComponente.tsx`

### API Routes
- Rotas seguem estrutura de pastas
- `route.ts` ou `route.js` contém handlers HTTP

---

## 📚 Arquivos de Configuração

### `package.json`
Define dependências e scripts npm do projeto.

### `tsconfig.json`
Configuração do TypeScript (tipagem, paths, etc.).

### `tailwind.config.ts`
Configuração do Tailwind CSS (cores, temas, etc.).

### `next.config.mjs`
Configuração do Next.js (rewrites, redirects, etc.).

### `.env`
Variáveis de ambiente (não commitado no Git).

### `ecosystem.config.js`
Configuração do PM2 para produção.

---

Para mais informações sobre instalação, consulte [INSTALACAO.md](INSTALACAO.md).
