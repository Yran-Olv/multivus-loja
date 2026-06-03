# 📱 Integração WhatsApp - MULTIVUS

Este documento descreve a integração WhatsApp do sistema MULTIVUS.

---

## 🎯 Funcionalidades

A integração WhatsApp permite:

- ✅ Envio de mensagens de texto
- ✅ Envio de mídia (imagens, documentos)
- ✅ Envio de ordens de serviço via WhatsApp
- ✅ Envio de recibos financeiros
- ✅ Notificações de status de ordem
- ✅ Envio de mensagens em massa

---

## ⚙️ Configuração

### 1. Acessar Configurações

No painel administrativo:
1. Acesse **Configurações** > **WhatsApp**
2. Ou acesse diretamente: `/admin/configuracoes/whatsapp`

### 2. Configurar Credenciais

Preencha os campos:

- **URL da API**: URL da API do seu provedor WhatsApp
- **Chave de API**: Chave de autenticação da API

**Exemplo:**
```
URL da API: https://api.exemplo.com/v1
Chave de API: sua_chave_api_aqui
```

### 3. Formato do Número de Telefone

Os números devem estar no formato internacional:
- Formato: `5511999999999` (código do país + DDD + número)
- Exemplo Brasil: `5511999999orcamentos999` (55 = Brasil, 11 = DDD, 999999999 = número)

---

## 💬 Uso no Sistema

### Envio de Ordem de Serviço

Quando uma ordem de serviço é criada ou atualizada, o sistema pode enviar notificação via WhatsApp.

### Envio de Recibos Financeiros

Recibos e comprovantes podem ser enviados automaticamente via WhatsApp.

### Notificações de Status

O sistema pode enviar notificações quando o status de uma ordem muda.

### Envio de Mensagens em Massa

Envie mensagens para múltiplos clientes através do painel administrativo.

---

## 🔌 API e Rotas

### `POST /api/whatsapp/send-text`

Enviar mensagem de texto.

**Request:**
```json
{
  "to": "5511999999999",
  "message": "Sua mensagem aqui"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123"
}
```

### `POST /api/whatsapp/send-media`

Enviar mídia (imagem, documento).

**Request:**
```json
{
  "to": "5511999999999",
  "mediaUrl": "https://multivus.com.br/uploads/documento.pdf",
  "caption": "Descrição da mídia"
}
```

### `GET /api/whatsapp-config`

Obter configuração atual do WhatsApp.

### `POST /api/whatsapp-config`

Salvar configuração do WhatsApp (admin).

---

## 🔍 Troubleshooting

### Mensagens não são enviadas

**Verificações:**

1. **Configuração está salva?**
   - Verifique no painel admin se as credenciais estão corretas

2. **API está acessível?**
   ```bash
   curl -X POST https://sua-api.com/v1/test \
     -H "Authorization: Bearer sua_chave"
   ```

3. **Formato do número está correto?**
   - Deve estar no formato internacional sem caracteres especiais

4. **Verificar logs:**
   ```bash
   pm2 logs | grep -i whatsapp
   ```

### Erro: "API não responde"

- Verifique se a URL da API está correta
- Verifique se a chave de API está válida
- Verifique conectividade com a API
- Verifique logs para detalhes do erro

### Erro: "Número inválido"

- Certifique-se de que o número está no formato internacional
- Remova caracteres especiais (espaços, hífens, parênteses)
- Formato correto: `5511999999999`

---

## 📝 Scripts de Diagnóstico

### Verificar Configuração

```bash
bash scripts/verificar-whatsapp.sh
```

### Testar Envio

```bash
bash scripts/diagnosticar-whatsapp.sh
```

---

Para mais informações sobre configuração geral, consulte [CONFIGURACAO.md](CONFIGURACAO.md).
