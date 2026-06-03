# Guia de Deploy - MULTIVUS

Este documento explica como instalar e atualizar a aplicação MULTIVUS em produção.

## 🎯 Menu Principal (Recomendado)

Para acessar todas as funcionalidades através de um menu interativo:

```bash
bash scripts/multivus.sh
```

O menu oferece acesso a todas as operações:
- 🆕 Instalação completa
- 🚀 Deploy/atualização
- 💾 Backup e restauração
- ⚙️ Configurações (SSL, admin, backup automático)
- 📊 Status do sistema
- 📚 Documentação

**Recomendado para uso diário!**

---

## 📦 Instalação e Atualização

### 🆕 Instalação Inicial Completa

Para instalação completa e interativa em produção, use o script dedicado:

```bash
sudo bash scripts/multivus.sh
# Escolha a opção 1: Instalação Completa
```

**O que o script faz:**

- ✅ **Cria usuário deploy**: Cria o usuário do sistema se não existir
- ✅ **Instala todas as dependências**:
  - Git
  - Node.js 20+
  - PostgreSQL
  - Nginx
  - PM2
- ✅ **Configuração interativa**: Permite escolher:
  - Usuário do sistema (padrão: deploy)
  - Diretório da aplicação
  - Domínio frontend e backend
  - Portas frontend e backend
  - URL do repositório Git
  - Branch do Git
  - Credenciais do banco de dados
  - Configuração SSL com Let's Encrypt
- ✅ **Configuração automática**:
  - Cria e configura banco de dados PostgreSQL
  - Configura Nginx com proxy reverso
  - Configura PM2 para gerenciamento de processos
  - Configura SSL (se solicitado)
  - Configura firewall (UFW)
  - Executa migrations e seeds
  - Compila e inicia a aplicação

**Pré-requisitos:**
- Servidor Linux (Ubuntu/Debian recomendado)
- Acesso root ou sudo
- Domínio apontando para o servidor (para SSL)

**Exemplo de uso:**
```bash
sudo bash scripts/multivus.sh
# Escolha a opção 1: Instalação Completa
```

O script fará perguntas interativas durante a instalação. Todas as configurações são salvas automaticamente.

---

### 🔄 Atualização

Para atualizar o projeto já instalado, use o menu principal:

```bash
bash scripts/multivus.sh
# Escolha a opção 2: Deploy/Atualização
```

**Verificar Mudanças (Opcional):**

```bash
bash scripts/multivus.sh
# Escolha a opção 3: Verificar Mudanças
```

Este script mostra:
- 📊 Status do repositório (local vs remoto)
- 📝 Lista de arquivos alterados
- 🔍 Análise do que precisa ser atualizado (dependências, rebuild, migrations)

**Atualizar Aplicação:**

```bash
bash scripts/multivus.sh
# Escolha a opção 2: Deploy/Atualização
```

O script oferece três opções:
1. **Deploy normal** (recomendado) - Analisa mudanças e atualiza apenas o necessário
2. **Forçar rebuild completo** - Força rebuild mesmo sem mudanças detectadas
3. **Deploy sem backup** (não recomendado) - Atualiza sem fazer backup

O script irá:
1. ✅ Fazer backup do banco de dados (exceto opção 3)
2. ✅ Verificar atualizações no GitHub
3. ✅ Analisar quais arquivos mudaram
4. ✅ Decidir automaticamente o que precisa ser atualizado:
   - **Reinstalar dependências**: Se `package.json` ou `package-lock.json` mudaram
   - **Rebuild**: Se código fonte (`app/`, `components/`, `lib/`), configurações (`next.config`, `tsconfig.json`) ou `package.json` mudaram
   - **Migrations**: Se houver novas migrations em `database/migrations/`
   - **Restart**: Se apenas arquivos estáticos ou configurações mudaram
5. ✅ Atualizar apenas o necessário
6. ✅ Reiniciar a aplicação com PM2

## 🧠 Como Funciona a Análise Inteligente

O script `multivus.sh` (opção Deploy/Atualização) analisa os arquivos alterados e decide automaticamente o que precisa ser atualizado:

### Arquivos que Requerem Reinstalação de Dependências

- `package.json`
- `package-lock.json`

### Arquivos que Requerem Rebuild

- `package.json` / `package-lock.json`
- `tsconfig.json`
- `next.config.js` / `next.config.mjs`
- `tailwind.config.js`
- `postcss.config.js`
- Qualquer arquivo em `app/`
- Qualquer arquivo em `components/`
- Qualquer arquivo em `lib/`
- Qualquer arquivo em `public/`
- `.env`

### Arquivos que Requerem Migrations

- Arquivos em `database/migrations/`
- Arquivos em `migrations/`

### Arquivos que Apenas Requerem Restart

- Arquivos de configuração do PM2
- Arquivos de documentação
- Scripts que não afetam a aplicação

## 📋 Exemplos de Uso

### Cenário 1: Atualização Normal

```bash
# Verificar o que mudou (opcional)
bash scripts/check-changes.sh

# Deploy (detecta automaticamente se é atualização)
sudo bash scripts/deploy.sh
```

### Cenário 2: Mudança em Dependências

Se você atualizou `package.json`:

```bash
sudo bash scripts/deploy.sh
# O script detectará automaticamente e reinstalará dependências + rebuild
```

### Cenário 3: Apenas Mudança em Estilos/CSS

Se você mudou apenas arquivos CSS ou imagens:

```bash
sudo bash scripts/deploy.sh
# O script detectará que não precisa rebuild, apenas restart
```

### Cenário 4: Nova Migration

Se você adicionou uma nova migration:

```bash
sudo bash scripts/deploy.sh
# O script detectará e executará a migration automaticamente
```

### Cenário 5: Problemas e Forçar Rebuild Completo

Se algo deu errado e você quer garantir rebuild completo:

```bash
sudo bash scripts/deploy.sh --force-rebuild
```

## 🔍 Verificação Pós-Atualização

Após atualizar, sempre verifique:

1. **Status do PM2**:
```bash
pm2 status
```

2. **Logs da aplicação**:
```bash
pm2 logs
```

3. **Testar funcionalidades principais**:
   - Acessar a página inicial
   - Testar login
   - Verificar APIs principais

## 🚨 Troubleshooting

### Erro ao Fazer Pull

Se houver conflitos:

```bash
git status
git stash
git pull origin main
git stash pop
# Resolver conflitos manualmente
```

### Erro no Build

Verificar logs detalhados:

```bash
npm run build 2>&1 | tee build.log
```

### Aplicação Não Inicia

Verificar logs do PM2:

```bash
pm2 logs loja-frontend --lines 100
pm2 logs loja-backend --lines 100
```

### Reverter para Versão Anterior

```bash
# Ver commits
git log --oneline

# Reverter para commit anterior
git reset --hard HEAD~1

# Rebuild e restart
sudo bash scripts/deploy.sh --force-rebuild
```

## 📝 Notas Importantes

1. **Sempre faça backup** antes de atualizar (o script faz automaticamente)
2. **Teste em ambiente de desenvolvimento** antes de atualizar produção
3. **Verifique os logs** após cada atualização
4. **Mantenha o `.env` atualizado** com as configurações corretas
5. **Não edite arquivos diretamente em produção** - use Git

## 🔐 Segurança

- Os scripts devem ser executados com `sudo` apenas quando necessário
- O script de backup é executado automaticamente antes de atualizar
- Sempre verifique os logs após atualização
- Mantenha o repositório Git privado se contiver informações sensíveis

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `pm2 logs`
2. Verifique o status: `pm2 status`
3. Verifique mudanças: `bash scripts/check-changes.sh`
4. Consulte a documentação do projeto
