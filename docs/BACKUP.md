# 💾 Backup e Restauração - MULTIVUS

Este documento descreve os procedimentos de backup e restauração do sistema MULTIVUS.

---

## 📦 Scripts Disponíveis

### Backup do Banco de Dados

```bash
bash scripts/backup-database.sh
```

Cria backup apenas do banco de dados PostgreSQL.

### Backup Completo

```bash
bash scripts/backup-completo.sh
```

Cria backup completo incluindo:
- Banco de dados
- Arquivos de upload (`public/uploads/`)
- Arquivo `.env` (se configurado)

---

## 🚀 Uso Rápido

### Fazer Backup

```bash
# Backup do banco de dados
bash scripts/backup-database.sh

# Backup completo
bash scripts/backup-completo.sh
```

### Listar Backups

```bash
bash scripts/listar-backups.sh
```

### Restaurar Backup

```bash
bash scripts/restaurar-backup.sh
```

---

## 📋 O que é Incluído no Backup

### Backup do Banco de Dados

- ✅ Todas as tabelas e dados
- ✅ Estrutura completa do banco
- ✅ Formato: SQL (pg_dump)

### Backup Completo

- ✅ Banco de dados (SQL)
- ✅ Arquivos de upload (`public/uploads/`)
- ✅ Arquivo `.env` (opcional, se configurado)
- ✅ Formato: Arquivo tar.gz comprimido

---

## 📁 Localização dos Backups

Por padrão, os backups são salvos em:

```
/home/deploy/LojaMultivus/backups/
├── database/
│   └── multivus_db_2025-01-15_10-30-00.sql
└── completo/
    └── multivus_completo_2025-01-15_10-30-00.tar.gz
```

---

## ⚙️ Configuração

### Configurar Localização dos Backups

Edite os scripts de backup e altere a variável `BACKUP_DIR`:

```bash
BACKUP_DIR="/caminho/para/backups"
```

### Configurar Retenção de Backups

Os scripts mantêm automaticamente:
- Últimos 7 backups diários
- Últimos 4 backups semanais
- Últimos 12 backups mensais

---

## 🔄 Limpeza Automática

Os scripts de backup incluem limpeza automática de backups antigos:

- Backups diários: Mantém últimos 7 dias
- Backups semanais: Mantém últimas 4 semanas
- Backups mensais: Mantém últimos 12 meses

---

## 📖 Backup Manual

### Backup do Banco de Dados

```bash
# Criar backup
pg_dump -U postgres multivus_db > backup_$(date +%Y%m%d).sql

# Backup comprimido
pg_dump -U postgres multivus_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Backup de Arquivos

```bash
# Backup da pasta uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/

# Backup completo do projeto
tar -czf projeto_backup_$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  .
```

---

## ⏰ Backup Automático

### Configurar Cron para Backup Diário

```bash
# Editar crontab
crontab -e

# Adicionar linha (executa diariamente às 2h da manhã)
0 2 * * * /home/deploy/LojaMultivus/scripts/backup-database.sh
```

### Usar Script de Configuração

```bash
sudo bash scripts/configurar-backup-cron.sh
```

---

## 🔙 Restauração

### Restaurar Banco de Dados

```bash
# Usar script automatizado
bash scripts/restaurar-backup.sh

# Ou manualmente
psql -U postgres multivus_db < backup.sql
```

### Restaurar Backup Completo

```bash
# Extrair arquivo
tar -xzf multivus_completo_2025-01-15_10-30-00.tar.gz

# Restaurar banco
psql -U postgres multivus_db < database.sql

# Restaurar uploads
cp -r uploads/* public/uploads/
```

---

## 🔍 Troubleshooting de Backup

### Erro: "Permissão negada"

```bash
# Dar permissões ao diretório de backups
sudo mkdir -p /home/deploy/LojaMultivus/backups
sudo chown -R deploy:deploy /home/deploy/LojaMultivus/backups
chmod 755 /home/deploy/LojaMultivus/backups
```

### Erro: "Espaço em disco insuficiente"

```bash
# Verificar espaço disponível
df -h

# Limpar backups antigos
bash scripts/listar-backups.sh
# Deletar backups antigos manualmente se necessário
```

### Erro: "pg_dump não encontrado"

```bash
# Instalar PostgreSQL client
sudo apt-get install postgresql-client
```

---

## 🎯 Boas Práticas

1. ✅ **Faça backups regulares**: Configure backup automático diário
2. ✅ **Teste restauração**: Periodicamente teste restaurar backups
3. ✅ **Armazene externamente**: Copie backups para servidor externo ou cloud
4. ✅ **Documente procedimentos**: Mantenha documentação de como restaurar
5. ✅ **Monitore espaço**: Verifique espaço em disco regularmente
6. ✅ **Criptografe backups**: Para dados sensíveis, considere criptografia

---

## 📊 Verificar Backups

### Listar Backups Disponíveis

```bash
bash scripts/listar-backups.sh
```

### Verificar Integridade

```bash
# Verificar se arquivo SQL é válido
head -n 20 backup.sql

# Verificar tamanho do arquivo
ls -lh backup.sql
```

---

Para mais informações sobre deploy, consulte [DEPLOY.md](DEPLOY.md).
