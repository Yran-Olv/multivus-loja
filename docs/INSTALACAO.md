# 📖 Instalação Detalhada - MULTIVUS

Este documento fornece um guia completo passo a passo para instalar o sistema MULTIVUS.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- ✅ **Node.js 18+** instalado
- ✅ **PostgreSQL 12+** instalado e rodando
- ✅ **npm** ou **pnpm** como gerenciador de pacotes
- ✅ Acesso ao terminal/linha de comando
- ✅ Git instalado (para clonar repositório)

---

## 🚀 Instalação Local (Desenvolvimento)

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/multivus-loja.git
cd multivus-loja
```

### Passo 2: Instalar Dependências

```bash
npm install
# ou
pnpm install
```

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto. Veja [CONFIGURACAO.md](CONFIGURACAO.md) para todas as variáveis disponíveis.

**Mínimo necessário:**

```env
# Database (OBRIGATÓRIO)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multivus_db
DB_USER=postgres
DB_PASSWORD=sua_senha_postgres

# JWT (OBRIGATÓRIO)
JWT_SECRET=sua_chave_secreta_jwt_aqui_minimo_32_caracteres

# Server
NODE_ENV=development
FRONTEND_DOMAIN=http://localhost:3000
```

### Passo 4: Criar Banco de Dados

```bash
# Criar banco de dados no PostgreSQL
npm run db:create
```

### Passo 5: Executar Migrations

```bash
# Criar todas as tabelas
npm run db:migrate
```

### Passo 6: Executar Seeds (Dados Iniciais)

```bash
# Popular banco com dados iniciais
npm run db:seed
```

Isso criará o usuário admin (`admin` / `admin123`).

Catálogo de exemplo (só dev): `SEED_DEMO_DATA=1 npm run db:seed`

### Passo 7: Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O site estará disponível em: **http://localhost:3000**

**Painel Admin**: **http://localhost:3000/admin/login**
- Usuário: `admin`
- Senha: `admin123`

⚠️ **IMPORTANTE**: Altere a senha padrão após o primeiro login!

---

## 🚀 Instalação em Produção (VPS)

### Menu Principal (Recomendado)

Para acessar todas as funcionalidades através de um menu interativo:

```bash
bash scripts/multivus.sh
```

O menu oferece acesso a todas as operações de instalação, deploy, backup e configuração.

### Instalação Completa e Interativa

Para instalação completa em produção com configuração interativa, use o script dedicado:

```bash
sudo bash scripts/multivus.sh
# Escolha a opção 1: Instalação Completa
```

Este script oferece instalação completa e interativa:

- ✅ **Criação de usuário**: Cria o usuário `deploy` (ou outro de sua escolha) se não existir
- ✅ **Instalação de dependências**: Verifica e instala todas as dependências necessárias:
  - Git
  - Node.js 20+
  - PostgreSQL
  - Nginx
  - PM2
- ✅ **Configuração interativa**: Permite escolher:
  - Usuário do sistema
  - Diretório da aplicação
  - Domínio frontend e backend
  - Portas frontend e backend
  - URL do repositório Git
  - Branch do Git
  - Credenciais do banco de dados
  - Configuração SSL (Let's Encrypt)
- ✅ **Configuração automática**: Configura automaticamente:
  - Banco de dados PostgreSQL
  - Nginx com proxy reverso
  - PM2 para gerenciamento de processos
  - SSL com Let's Encrypt (opcional)
  - Firewall (UFW)

**Exemplo de uso:**
```bash
sudo bash scripts/multivus.sh
# Escolha a opção 1: Instalação Completa
```

O script irá perguntar todas as informações necessárias durante a execução.

### Atualização (Deploy)

Para atualizar uma instalação existente, use:

```bash
sudo bash scripts/deploy.sh
```

O script `multivus.sh` oferece um menu interativo com todas as opções, incluindo instalação completa e atualização.

Para mais detalhes sobre deploy, consulte [DEPLOY.md](DEPLOY.md).

---

## 📝 Comandos Úteis

### Banco de Dados

```bash
# Criar banco de dados
npm run db:create

# Executar migrations
npm run db:migrate

# Reverter última migration
npm run db:migrate:undo

# Reverter todas as migrations
npm run db:migrate:undo:all

# Executar seeds
npm run db:seed

# Reverter seeds
npm run db:seed:undo

# Deletar banco de dados
npm run db:drop
```

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Lint do código
npm run lint
```

### Produção (PM2)

```bash
# Iniciar aplicação
npm run start:prod

# Parar aplicação
npm run stop:prod

# Reiniciar aplicação
npm run restart:prod

# Ver logs
npm run logs:prod

# Monitorar
npm run monit:prod
```

---

## ✅ Verificação Pós-Instalação

Após instalar, verifique:

1. ✅ Site carrega em `http://localhost:3000`
2. ✅ Painel admin acessível em `http://localhost:3000/admin/login`
3. ✅ Login funciona com credenciais padrão
4. ✅ Produtos aparecem na página de produtos
5. ✅ Serviços aparecem na página de serviços
6. ✅ Blog funciona corretamente

---

## 🐛 Problemas Comuns

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Database connection failed"

- Verifique se PostgreSQL está rodando
- Verifique credenciais no arquivo `.env`
- Teste conexão: `psql -U postgres -d multivus_db`

### Erro: "Migration failed"

```bash
# Verificar status das migrations
npm run db:migrate:status

# Reverter e tentar novamente
npm run db:migrate:undo
npm run db:migrate
```

Para mais soluções, consulte [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## 📚 Próximos Passos

Após instalação bem-sucedida:

1. ✅ Configure todas as variáveis de ambiente (veja [CONFIGURACAO.md](CONFIGURACAO.md))
2. ✅ Altere a senha do usuário admin
3. ✅ Configure integrações opcionais (Stripe, WhatsApp, etc.)
4. ✅ Personalize conteúdo (produtos, serviços, blog)
5. ✅ Configure deploy em produção (veja [DEPLOY.md](DEPLOY.md))
