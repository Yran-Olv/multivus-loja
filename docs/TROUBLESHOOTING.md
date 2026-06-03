# 🐛 Troubleshooting - MULTIVUS

Este documento contém soluções para problemas comuns do sistema MULTIVUS.

---

## 🔧 Problemas Comuns

### Erro: "Cannot find module"

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

---

### Erro: "Database connection failed"

**Verificações:**
1. PostgreSQL está rodando?
```bash
sudo systemctl status postgresql
```

2. Credenciais corretas no `.env`?
```bash
cat .env | grep DB_
```

3. Testar conexão:
```bash
psql -U postgres -d multivus_db
```

**Solução:**
- Verifique se PostgreSQL está instalado e rodando
- Confirme credenciais no arquivo `.env`
- Verifique se o banco de dados existe: `npm run db:create`

---

### Erro: "Migration failed"

**Solução:**
```bash
# Verificar status das migrations
npx sequelize-cli db:migrate:status

# Reverter última migration
npm run db:migrate:undo

# Tentar novamente
npm run db:migrate
```

---

### Erro: "Port already in use"

**Solução:**
```bash
# Verificar qual processo está usando a porta
lsof -i :3000
# ou
netstat -tulpn | grep 3000

# Parar processo ou mudar porta no .env
```

---

### Site não carrega após build

**Verificações:**
1. Build foi bem-sucedido?
```bash
npm run build
```

2. Servidor está rodando?
```bash
npm start
# ou
pm2 status
```

3. Verificar logs:
```bash
pm2 logs
```

---

### Imagens não carregam

**Verificações:**
1. Diretório `public/uploads` existe?
```bash
ls -la public/uploads
```

2. Permissões corretas?
```bash
chmod 755 public/uploads
```

3. Nginx configurado para servir `/uploads`?
```bash
sudo nginx -t
```

Para mais detalhes, consulte [DEPLOY.md](DEPLOY.md).

---

### Aplicação não inicia no PM2

**Solução:**
```bash
# Verificar logs
pm2 logs

# Deletar e recriar
pm2 delete loja-frontend loja-backend
pm2 start ecosystem.config.js --env production

# Verificar status
pm2 status
```

---

### Nginx retorna 502 Bad Gateway

**Verificações:**
1. Aplicação está rodando?
```bash
pm2 status
```

2. Porta correta no Nginx?
```bash
sudo cat /etc/nginx/sites-available/multivus-loja | grep proxy_pass
```

3. Testar aplicação diretamente:
```bash
curl http://localhost:3000
```

**Solução:**
- Verifique se PM2 está rodando
- Confirme porta no `ecosystem.config.js` e Nginx
- Reinicie Nginx: `sudo systemctl reload nginx`

---

### Erro ao executar migrations

**Solução:**
```bash
# Verificar conexão com banco
psql -U postgres -d multivus_db

# Verificar variáveis de ambiente
cat .env | grep DB_

# Executar migration manualmente
npx sequelize-cli db:migrate --debug
```

---

### Domínio não funciona (DNS_PROBE_FINISHED_NXDOMAIN)

**Verificações:**
1. DNS configurado corretamente?
```bash
dig seu-dominio.com.br
```

2. Nginx configurado?
```bash
sudo nginx -t
sudo systemctl status nginx
```

**Solução:**
- Configure DNS apontando para IP do servidor
- Configure virtual host no Nginx
- Aguarde propagação DNS (pode levar até 48h)

---

### SSL não funciona (Certbot falha)

**Solução:**
```bash
# Verificar se domínio aponta para servidor
dig seu-dominio.com.br

# Tentar certificado novamente
sudo certbot --nginx -d seu-dominio.com.br

# Verificar certificado
sudo certbot certificates
```

---

## 🔍 Troubleshooting - Painel Administrativo

### Erro 404 ao fazer login

**Checklist de Diagnóstico:**

1. **Verificar se aplicações PM2 estão rodando:**
```bash
pm2 status
```

2. **Verificar se portas estão abertas:**
```bash
sudo netstat -tulpn | grep -E '3000|3001'
```

3. **Verificar se usuário existe no banco:**
```bash
psql -U postgres -d multivus_db -c "SELECT * FROM admin_users;"
```

4. **Verificar configuração do Nginx:**
```bash
sudo nginx -t
sudo cat /etc/nginx/sites-available/multivus-loja
```

5. **Verificar logs:**
```bash
pm2 logs
```

Para diagnóstico completo, execute:
```bash
bash scripts/verificar-sistema-completo.sh
```

---

## 📤 Troubleshooting - Upload de Imagens

### Upload não funciona

**Verificações:**

1. **Diretório existe?**
```bash
ls -la public/uploads
```

2. **Permissões corretas?**
```bash
sudo chmod 755 public/uploads
sudo chown -R deploy:deploy public/uploads
```

3. **Nginx configurado?**
```bash
sudo grep -A 10 "location /uploads" /etc/nginx/sites-available/multivus-loja
```

4. **Logs de upload:**
```bash
pm2 logs | grep UPLOAD
```

**Script de diagnóstico:**
```bash
sudo bash scripts/diagnosticar-imagens.sh
```

---

## 🔄 Reverter para Versão Anterior

```bash
# Ver commits
git log --oneline

# Reverter para commit anterior
git reset --hard HEAD~1

# Rebuild e restart
sudo bash scripts/deploy.sh --force-rebuild
```

---

## 📞 Obter Ajuda

Se o problema persistir:

1. Verifique os logs detalhados: `pm2 logs`
2. Execute scripts de diagnóstico disponíveis em `scripts/`
3. Consulte a documentação específica em `docs/`
4. Verifique issues conhecidas no repositório

---

Para mais informações sobre deploy, consulte [DEPLOY.md](DEPLOY.md).
