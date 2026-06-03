# 🛡️ Segurança - MULTIVUS

Este documento descreve as medidas de segurança implementadas no sistema MULTIVUS.

---

## ✅ Medidas de Segurança Implementadas

### 1. Headers de Segurança HTTP

O sistema inclui headers de segurança para proteção contra ataques comuns:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### 2. Rate Limiting

Proteção contra abuso de APIs:

- Limite de requisições por IP
- Janela de tempo configurável
- Bloqueio temporário após exceder limite

### 3. Proteção contra Brute Force

- Limite de tentativas de login
- Bloqueio temporário de IP após falhas
- Logs de tentativas suspeitas

### 4. Validação e Sanitização

- Validação de dados com Zod
- Sanitização de inputs
- Proteção contra SQL Injection (usando parâmetros preparados)
- Proteção contra XSS

### 5. Autenticação Segura

- JWT com chave secreta forte
- Cookies httpOnly e secure
- Expiração de tokens
- Hash de senhas com bcrypt

### 6. Proteção de Uploads

- Validação de tipo de arquivo
- Validação de magic bytes
- Sanitização de nomes de arquivo
- Limite de tamanho
- Proteção contra path traversal

### 7. Proteção de Banco de Dados

- Uso de parâmetros preparados
- Validação de inputs
- Conexão segura (quando configurado)

### 8. CORS e Validação de Origem

- Configuração de `ALLOWED_ORIGINS`
- Validação de origem em requisições
- Headers CORS apropriados

### 9. Logging de Segurança

- Logs de tentativas de autenticação
- Logs de eventos suspeitos
- Logs de rate limiting
- Logs de uploads

---

## 🔐 Boas Práticas de Segurança

### Para Desenvolvedores

1. ✅ Nunca commite o arquivo `.env`
2. ✅ Use variáveis de ambiente para dados sensíveis
3. ✅ Valide e sanitize todos os inputs
4. ✅ Use parâmetros preparados em queries SQL
5. ✅ Mantenha dependências atualizadas
6. ✅ Use HTTPS em produção
7. ✅ Configure CORS corretamente

### Para Administradores

1. ✅ Use senhas fortes
2. ✅ Altere senha padrão do admin
3. ✅ Configure `JWT_SECRET` forte (mínimo 32 caracteres)
4. ✅ Configure `ALLOWED_ORIGINS` corretamente
5. ✅ Mantenha sistema e dependências atualizadas
6. ✅ Configure firewall adequadamente
7. ✅ Faça backups regulares
8. ✅ Monitore logs de segurança

---

## 🚨 Resposta a Incidentes

Em caso de incidente de segurança:

1. **Identifique o problema**: Verifique logs de segurança
2. **Isole o sistema**: Se necessário, pare a aplicação
3. **Analise logs**: `pm2 logs` e logs do sistema
4. **Corrija o problema**: Aplique correções necessárias
5. **Notifique**: Informe usuários se dados foram comprometidos
6. **Documente**: Registre o incidente e ações tomadas

---

## 📋 Verificar Logs de Autenticação

### Opção 1: Script Helper (Recomendado)

```bash
bash scripts/ver-log-auth.sh
```

### Opção 2: Ver Logs Diretamente

```bash
# Logs do PM2
pm2 logs | grep -i auth

# Logs do sistema
sudo tail -f /var/log/auth.log
```

### O que os logs mostram:

- Tentativas de login (sucesso/falha)
- IPs bloqueados
- Rate limits excedidos
- Eventos suspeitos

---

## 🔓 Desbloquear IP Bloqueado

### Opção 1: Aguardar (Recomendado)

O bloqueio expira automaticamente após o tempo configurado.

### Opção 2: Reiniciar PM2

```bash
pm2 restart all
```

**⚠️ Atenção**: Isso desbloqueia TODOS os IPs.

### Opção 3: Via Script

```bash
sudo bash scripts/desbloquear-ip.sh IP_A_DESBLOQUEAR
```

---

## 📋 Checklist de Segurança

### 🔐 Configuração

- [ ] `JWT_SECRET` configurado e forte (32+ caracteres)
- [ ] Senha do banco de dados forte
- [ ] `ALLOWED_ORIGINS` configurado corretamente
- [ ] HTTPS configurado em produção
- [ ] Firewall configurado

### 🛡️ Aplicação

- [ ] Senha padrão do admin alterada
- [ ] Headers de segurança ativos
- [ ] Rate limiting configurado
- [ ] Uploads protegidos
- [ ] Logs de segurança ativos

### 🔄 Manutenção

- [ ] Dependências atualizadas
- [ ] Sistema operacional atualizado
- [ ] Backups regulares configurados
- [ ] Logs monitorados regularmente

---

Para mais informações sobre configuração, consulte [CONFIGURACAO.md](CONFIGURACAO.md).
