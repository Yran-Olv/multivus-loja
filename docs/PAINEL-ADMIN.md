# 👨‍💼 Painel Administrativo - MULTIVUS

Este documento descreve o painel administrativo do sistema MULTIVUS.

> **Produção:** altere a senha padrão (`admin` / `admin123`) em **Perfil** após o primeiro acesso.

---

## 🔐 Acesso

O painel administrativo pode ser acessado de duas formas:

### 1. Subdomínio Admin (Recomendado para produção)
- **URL**: `https://admin.multivus.com.br` ou `http://admin.localhost:3000`
- Acessar pelo subdomínio `admin` redireciona automaticamente para `/admin`

### 2. Rota Direta
- **URL**: `http://localhost:3000/admin/login`

### Credenciais Padrão

Após executar seeds:
- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere a senha padrão após o primeiro login!

---

## 🌐 Configuração de Domínios Personalizados

O sistema permite configurar domínios personalizados para o painel administrativo.

### Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Domínio único para admin (opcional)
ADMIN_DOMAIN=admin.seudominio.com.br

# OU múltiplos domínios separados por vírgula (opcional)
ADMIN_DOMAINS=admin.seudominio.com.br,gestao.seudominio.com.br
```

### Configuração de DNS e Servidor Web

1. **Configurar DNS**: Adicione registro A ou CNAME apontando para o IP do servidor
2. **Configurar Nginx**: Configure virtual host para o(s) domínio(s)
3. **Configurar SSL**: Use Certbot para certificado SSL

Para mais detalhes, consulte [DEPLOY.md](DEPLOY.md).

---

## 📊 Funcionalidades do Painel

### Dashboard

- ✅ Estatísticas em tempo real
- ✅ Contadores de produtos, serviços, softwares
- ✅ Solicitações pendentes
- ✅ Mensagens não lidas
- ✅ Pedidos recentes

### Gestão de Produtos

- ✅ Criar, editar, excluir produtos
- ✅ Upload de imagens
- ✅ Ativar/desativar produtos
- ✅ Gerenciar estoque
- ✅ Especificações técnicas
- ✅ Informações adicionais (garantia, entrega, suporte)

### Gestão de Softwares

- ✅ Gerenciar portfólio de softwares
- ✅ Upload de ícones e screenshots
- ✅ Definir preços e versões
- ✅ Categorizar softwares
- ✅ Marcar como destaque
- ✅ Gerenciar funcionalidades

### Gestão de Serviços

- ✅ Cadastrar serviços oferecidos
- ✅ Definir preços a partir de
- ✅ Adicionar descrições e ícones
- ✅ Ativar/desativar serviços

### Gestão de Solicitações

- ✅ Visualizar todas as solicitações
- ✅ Atualizar status (Pendente, Em Andamento, Concluído, Cancelado)
- ✅ Adicionar custo estimado
- ✅ Adicionar observações
- ✅ Excluir solicitações

### Gestão de Mensagens

- ✅ Visualizar mensagens de contato
- ✅ Marcar como lida/respondida
- ✅ Responder por email
- ✅ Excluir mensagens

### Gestão de Pedidos

- ✅ Visualizar todos os pedidos
- ✅ Atualizar status do pedido
- ✅ Atualizar status do pagamento
- ✅ Adicionar observações
- ✅ Filtros por status e pagamento

### Gestão de Blog

- ✅ Criar, editar, excluir posts
- ✅ Upload de imagens de destaque
- ✅ Publicar/despublicar posts
- ✅ Categorias e tags
- ✅ Contador de visualizações
- ✅ Editor de conteúdo

---

## 🔒 Segurança

O painel administrativo possui várias camadas de segurança:

- ✅ Autenticação JWT obrigatória
- ✅ Middleware protegendo todas as rotas `/admin/*`
- ✅ Cookies httpOnly e secure
- ✅ Rate limiting em rotas de autenticação
- ✅ Proteção contra brute force
- ✅ Logs de segurança

Para mais informações sobre segurança, consulte [SEGURANCA.md](SEGURANCA.md).

---

## 🐛 Troubleshooting

### Erro 404 ao fazer login

Consulte [TROUBLESHOOTING.md](TROUBLESHOOTING.md) para soluções detalhadas.

### Problemas comuns:

1. **Usuário não existe**: Execute seeds novamente
2. **Senha incorreta**: Verifique hash no banco de dados
3. **Rota não encontrada**: Verifique build e PM2
4. **CORS errors**: Configure `ALLOWED_ORIGINS` corretamente

---

Para mais informações sobre configuração, consulte [CONFIGURACAO.md](CONFIGURACAO.md).
