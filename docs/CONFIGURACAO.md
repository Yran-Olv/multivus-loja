# ⚙️ Configuração - MULTIVUS

Este documento detalha todas as variáveis de ambiente e configurações do sistema MULTIVUS.

---

## 📋 Variáveis de Ambiente

### 🔴 Obrigatórias

Estas variáveis são **necessárias** para o sistema funcionar:

#### `NODE_ENV`
- **Descrição**: Ambiente de execução
- **Valores**: `development` | `production`
- **Exemplo**: `NODE_ENV=production`

#### `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **Descrição**: Configuração do banco de dados PostgreSQL
- **Exemplo**:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multivus_db
DB_USER=postgres
DB_PASSWORD=sua_senha_segura
```

#### `JWT_SECRET`
- **Descrição**: Chave secreta para assinatura de tokens JWT
- **Requisito**: Mínimo 32 caracteres
- **Como gerar**: `openssl rand -base64 32`
- **Exemplo**: `JWT_SECRET=chave_secreta_minimo_32_caracteres_para_seguranca`

#### `FRONTEND_PORT` e `BACKEND_PORT`
- **Descrição**: Portas onde a aplicação roda
- **Padrão**: `FRONTEND_PORT=3000`, `BACKEND_PORT=3001`
- **Exemplo**:
```env
FRONTEND_PORT=3000
BACKEND_PORT=3001
```

#### `FRONTEND_DOMAIN` e `BACKEND_DOMAIN`
- **Descrição**: Domínios da aplicação (usado em produção)
- **Exemplo**:
```env
FRONTEND_DOMAIN=https://multivus.com.br
BACKEND_DOMAIN=https://api.multivus.com.br
```

#### `NEXT_PUBLIC_DOMAIN`
- **Descrição**: Domínio público (acessível no cliente)
- **Exemplo**: `NEXT_PUBLIC_DOMAIN=https://multivus.com.br`

---

### 🟡 Recomendadas para Produção

#### `ALLOWED_ORIGINS`
- **Descrição**: Domínios permitidos para CORS (separados por vírgula)
- **Exemplo**: `ALLOWED_ORIGINS=https://multivus.com.br,https://www.multivus.com.br`

#### `ADMIN_DOMAIN` ou `ADMIN_DOMAINS`
- **Descrição**: Domínio(s) personalizado(s) para painel admin
- **Exemplo único**: `ADMIN_DOMAIN=admin.multivus.com.br`
- **Exemplo múltiplos**: `ADMIN_DOMAINS=admin.multivus.com.br,gestao.multivus.com.br`

---

### 🟢 Opcionais

#### Email (Resend)
```env
RESEND_API_KEY=re_sua_chave_api_resend
EMAIL_FROM=noreply@seudominio.com.br
```

#### Stripe (Pagamentos)
```env
STRIPE_SECRET_KEY=sk_live_sua_chave_stripe
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_stripe
STRIPE_WEBHOOK_SECRET=whsec_sua_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_stripe
```

#### WhatsApp
```env
WHATSAPP_API_URL=https://api.exemplo.com
WHATSAPP_API_KEY=sua_chave_api
```

#### Google Analytics
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### Segurança
```env
SECURITY_LOG_WEBHOOK=https://webhook.exemplo.com/security
```

#### Imagens (CDN)
```env
ALLOWED_IMAGE_DOMAINS=cdn.seudominio.com.br,images.seudominio.com.br
```

---

## 📝 Arquivo .env Completo

Exemplo completo de arquivo `.env`:

```env
# ============================================
# AMBIENTE
# ============================================
NODE_ENV=production

# ============================================
# SERVIDOR
# ============================================
FRONTEND_PORT=3000
BACKEND_PORT=3001
FRONTEND_DOMAIN=https://multivus.com.br
BACKEND_DOMAIN=https://api.multivus.com.br
NEXT_PUBLIC_DOMAIN=https://multivus.com.br

# ============================================
# BANCO DE DADOS (PostgreSQL) - OBRIGATÓRIO
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multivus_db
DB_USER=postgres
DB_PASSWORD=sua_senha_segura_aqui

# ============================================
# JWT - OBRIGATÓRIO
# ============================================
JWT_SECRET=sua_chave_secreta_jwt_minimo_32_caracteres_aqui

# ============================================
# CORS E SEGURANÇA
# ============================================
ALLOWED_ORIGINS=https://multivus.com.br,https://www.multivus.com.br
ADMIN_DOMAIN=admin.multivus.com.br

# ============================================
# EMAIL (Resend) - OPCIONAL
# ============================================
RESEND_API_KEY=re_sua_chave_api_resend
EMAIL_FROM=noreply@multivus.com.br

# ============================================
# STRIPE (Pagamentos) - OPCIONAL
# ============================================
STRIPE_SECRET_KEY=sk_live_sua_chave_stripe
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_stripe
STRIPE_WEBHOOK_SECRET=whsec_sua_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_stripe

# ============================================
# WHATSAPP - OPCIONAL
# ============================================
WHATSAPP_API_URL=https://api.exemplo.com
WHATSAPP_API_KEY=sua_chave_api

# ============================================
# GOOGLE ANALYTICS - OPCIONAL
# ============================================
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ============================================
# SEGURANÇA - OPCIONAL
# ============================================
SECURITY_LOG_WEBHOOK=https://webhook.exemplo.com/security

# ============================================
# IMAGENS (CDN) - OPCIONAL
# ============================================
ALLOWED_IMAGE_DOMAINS=cdn.multivus.com.br,images.multivus.com.br
```

---

## ⚠️ Segurança

### Checklist de Segurança

1. ✅ Gere uma `JWT_SECRET` forte: `openssl rand -base64 32`
2. ✅ Use senha forte para `DB_PASSWORD` (mínimo 12 caracteres)
3. ✅ Configure `NEXT_PUBLIC_DOMAIN` e `FRONTEND_DOMAIN` com seu domínio real
4. ✅ Configure `ALLOWED_ORIGINS` com seus domínios permitidos
5. ✅ Em produção, use chaves LIVE do Stripe (`sk_live_` e `pk_live_`)
6. ✅ NUNCA compartilhe essas chaves publicamente
7. ✅ Mantenha o arquivo `.env` seguro (permissões 600)
8. ✅ NUNCA commite o arquivo `.env` no Git

### Permissões do Arquivo .env

```bash
# Definir permissões seguras
chmod 600 .env

# Verificar proprietário
chown $USER:$USER .env
```

---

## 🔄 Modo Produção

Para executar em modo produção:

```bash
# Build do projeto
npm run build

# Iniciar servidor
npm start
```

Ou use PM2:

```bash
pm2 start ecosystem.config.js --env production
```

---

Para mais informações sobre instalação, consulte [INSTALACAO.md](INSTALACAO.md).
