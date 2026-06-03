# 🗄️ Banco de Dados - MULTIVUS

Este documento descreve a estrutura do banco de dados, migrations e seeds do sistema MULTIVUS.

---

## 📊 Estrutura do Banco de Dados

O sistema utiliza **PostgreSQL** com as seguintes tabelas principais:

### Tabelas Principais

1. **products** - Catálogo de produtos
   - `id`, `name`, `description`, `price`, `category`
   - `image_url`, `stock_quantity`
   - `specifications` (JSON), `warranty`, `delivery`, `support`
   - `is_active`, `created_at`, `updated_at`

2. **services** - Serviços oferecidos
   - `id`, `name`, `description`, `icon`
   - `features` (array de texto — migration `20240601150000`)
   - `price_from`, `is_active`
   - `created_at`

3. **softwares** - Portfolio de softwares
   - `id`, `name`, `description`, `short_description`
   - `version`, `price`, `category`, `image_url`
   - `features` (JSON), `system_requirements` (JSON)
   - `is_featured`, `is_active`
   - `created_at`, `updated_at`

4. **service_requests** - Solicitações de assistência técnica
   - `id`, `customer_name`, `customer_email`, `customer_phone`
   - `service_name`, `description`, `status`
   - `estimated_cost`, `observations`
   - `created_at`, `updated_at`

5. **contact_messages** - Mensagens de contato
   - `id`, `name`, `email`, `phone`, `subject`, `message`
   - `is_read`, `is_responded`
   - `created_at`, `updated_at`

6. **admin_users** - Usuários administradores
   - `id`, `username`, `email`, `password_hash`
   - `is_active`, `created_at`, `updated_at`

7. **orders** - Pedidos de compra
   - `id`, `customer_id`, `status`, `payment_status`
   - `total_amount`, `shipping_address`, `observations`
   - `created_at`, `updated_at`

8. **order_items** - Itens dos pedidos
   - `id`, `order_id`, `product_id`, `quantity`, `price`

9. **customers** - Clientes
   - `id`, `name`, `email`, `phone`, `address`
   - `created_at`, `updated_at`

10. **reviews** - Avaliações de produtos
    - `id`, `product_id`, `customer_name`, `rating`, `comment`
    - `is_approved`, `created_at`

11. **posts** - Posts do blog
    - `id`, `title`, `slug`, `excerpt`, `content`
    - `featured_image`, `category`, `tags` (JSON)
    - `is_published`, `published_at`, `views`
    - `created_at`, `updated_at`

12. **chat_messages** - Mensagens do chat
    - `id`, `name`, `email`, `message`, `is_read`
    - `created_at`

---

## 🔄 Migrations

As migrations estão localizadas em `database/migrations/` e são executadas com Sequelize CLI.

### Comandos de Migration

```bash
# Executar todas as migrations pendentes
npm run db:migrate

# Reverter última migration
npm run db:migrate:undo

# Reverter todas as migrations
npm run db:migrate:undo:all

# Ver status das migrations
npx sequelize-cli db:migrate:status
```

### Criar Nova Migration

```bash
# Criar migration vazia
npx sequelize-cli migration:generate --name nome-da-migration

# Editar arquivo criado em database/migrations/
```

### Exemplo de Migration

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('nova_tabela', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('nova_tabela');
  },
};
```

---

## 🌱 Seeds

Os seeds estão localizados em `database/seeds/` e populam o banco com dados iniciais.

### Comandos de Seed

```bash
# Executar todos os seeds
npm run db:seed

# Reverter todos os seeds
npm run db:seed:undo

# Executar seed específico
npx sequelize-cli db:seed --seed nome-do-seed.js

# Reverter seed específico
npx sequelize-cli db:seed:undo --seed nome-do-seed.js
```

### Dados Criados pelos Seeds

**Produção (padrão):** só o usuário admin:

- Usuário: `admin` / senha: `admin123` — altere após o primeiro login

**Desenvolvimento (opcional):** catálogo de exemplo com `SEED_DEMO_DATA=1`:

```bash
SEED_DEMO_DATA=1 npm run db:seed
```

### Remover catálogo demo na VPS (já instalada)

```bash
bash scripts/purge-demo-catalog.sh
# ou: bash scripts/purge-demo-catalog.sh --yes
```

---

## 🔧 Comandos Úteis

### Criar/Deletar Banco

```bash
# Criar banco de dados
npm run db:create

# Deletar banco de dados (CUIDADO!)
npm run db:drop
```

### Backup Manual

```bash
# Backup do banco
pg_dump -U postgres multivus_db > backup.sql

# Restaurar backup
psql -U postgres multivus_db < backup.sql
```

### Acessar Banco via psql

```bash
# Conectar ao banco
psql -U postgres -d multivus_db

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d nome_da_tabela

# Executar query
SELECT * FROM products LIMIT 10;

# Sair
\q
```

---

## Conexões esgotadas (`remaining connection slots are reserved`)

Aparece no `update.sh` ou no admin quando o PostgreSQL não tem slots livres.

**Causa:** dois containers Docker (frontend + backend), cada um com pool de conexões; migrations e conexões `idle` antigas somam e estouram o limite do Postgres na VPS.

**Na VPS (emergência):**

```bash
cd /var/www/multivus-loja
bash scripts/pg-connection-status.sh --kill-all-app
bash scripts/update.sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart frontend backend
```

**Prevenção** no `.env` da VPS:

```env
DB_POOL_MAX=3
DB_SEQUELIZE_POOL_MAX=2
```

Depois `git pull` e rebuild/restart dos containers.

---

## 📝 Notas Importantes

1. **Sempre faça backup** antes de executar migrations em produção
2. **Teste migrations** em ambiente de desenvolvimento primeiro
3. **Não edite migrations já executadas** - crie novas migrations
4. **Mantenha seeds atualizados** com dados realistas
5. **Use transações** em migrations complexas

---

Para mais informações sobre configuração do banco, consulte [CONFIGURACAO.md](CONFIGURACAO.md).
