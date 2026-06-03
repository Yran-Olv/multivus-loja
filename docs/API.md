# 🔌 API Endpoints - MULTIVUS

Este documento descreve todos os endpoints da API do sistema MULTIVUS.

---

## 🔐 Autenticação

### `POST /api/auth/login`
Fazer login no painel administrativo.

**Request:**
```json
{
  "username": "admin",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@multivus.com.br"
  }
}
```

**Response (401):**
```json
{
  "error": "Credenciais inválidas"
}
```

### `POST /api/auth/logout`
Fazer logout.

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

### `GET /api/auth/me`
Verificar autenticação atual.

**Headers:**
```
Cookie: auth-token=...
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@multivus.com.br"
  }
}
```

---

## 📦 Produtos

### `GET /api/products`
Listar produtos (público).

**Query params:**
- `category` - Filtrar por categoria
- `search` - Buscar por nome/descrição
- `page` - Número da página
- `limit` - Itens por página

**Response:**
```json
{
  "products": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### `POST /api/products`
Criar produto (admin).

**Headers:**
```
Cookie: auth-token=...
```

**Request:**
```json
{
  "name": "SSD 240GB",
  "description": "SSD SATA 240GB",
  "price": 199.90,
  "category": "Armazenamento",
  "stock_quantity": 10,
  "image_url": "/uploads/ssd.jpg"
}
```

### `GET /api/products/[id]`
Obter produto específico.

### `PUT /api/products/[id]`
Atualizar produto (admin).

### `DELETE /api/products/[id]`
Excluir produto (admin).

---

## 🛒 Pedidos

### `GET /api/orders`
Listar pedidos (admin).

**Query params:**
- `status` - Filtrar por status
- `payment_status` - Filtrar por status de pagamento

### `POST /api/orders`
Criar pedido.

**Request:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 199.90
    }
  ],
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999"
  },
  "shipping_address": "Rua Exemplo, 123"
}
```

### `GET /api/orders/[id]`
Obter pedido específico.

### `PATCH /api/orders/[id]`
Atualizar pedido (admin).

---

## ⭐ Avaliações

### `GET /api/reviews`
Listar avaliações de produtos.

**Query params:**
- `product_id` - Filtrar por produto
- `is_approved` - Filtrar por aprovação

### `POST /api/reviews`
Criar avaliação.

**Request:**
```json
{
  "product_id": 1,
  "customer_name": "Maria",
  "rating": 5,
  "comment": "Produto excelente!"
}
```

---

## 🔧 Solicitações de Serviço

### `GET /api/service-requests`
Listar solicitações (admin).

### `POST /api/service-requests`
Criar solicitação.

**Request:**
```json
{
  "customer_name": "João",
  "customer_email": "joao@email.com",
  "customer_phone": "11999999999",
  "service_name": "Formatação",
  "description": "Preciso formatar meu computador"
}
```

### `GET /api/service-requests/[id]`
Obter solicitação específica.

### `PATCH /api/service-requests/[id]`
Atualizar solicitação (admin).

**Request:**
```json
{
  "status": "Em Andamento",
  "estimated_cost": 150.00,
  "observations": "Serviço em execução"
}
```

### `DELETE /api/service-requests/[id]`
Excluir solicitação (admin).

---

## 📧 Mensagens de Contato

### `POST /api/contact`
Enviar mensagem de contato.

**Request:**
```json
{
  "name": "João",
  "email": "joao@email.com",
  "phone": "11999999999",
  "subject": "Dúvida",
  "message": "Tenho uma dúvida sobre..."
}
```

### `GET /api/contact/[id]`
Obter mensagem específica (admin).

### `PATCH /api/contact/[id]`
Atualizar mensagem (admin).

**Request:**
```json
{
  "is_read": true,
  "is_responded": true
}
```

### `DELETE /api/contact/[id]`
Excluir mensagem (admin).

---

## 📝 Blog

### `GET /api/blog/posts`
Listar posts do blog.

**Query params:**
- `category` - Filtrar por categoria
- `is_published` - Filtrar por publicação
- `page` - Número da página

### `POST /api/blog/posts`
Criar post (admin).

**Request:**
```json
{
  "title": "Título do Post",
  "slug": "titulo-do-post",
  "excerpt": "Resumo do post",
  "content": "Conteúdo completo...",
  "category": "Tecnologia",
  "tags": ["dicas", "tutorial"],
  "featured_image": "/uploads/post.jpg",
  "is_published": true
}
```

### `GET /api/blog/posts/[id]`
Obter post específico.

### `PUT /api/blog/posts/[id]`
Atualizar post (admin).

### `DELETE /api/blog/posts/[id]`
Excluir post (admin).

---

## 📤 Upload

### `POST /api/upload`
Upload de imagens (admin).

**Headers:**
```
Cookie: auth-token=...
Content-Type: multipart/form-data
```

**Request:**
```
FormData:
- file: [arquivo de imagem]
- title: "Nome do contexto" (opcional)
```

**Response:**
```json
{
  "url": "/uploads/imagem.jpg",
  "filename": "imagem.jpg"
}
```

---

## 💳 Stripe

### `POST /api/stripe/create-checkout`
Criar sessão de checkout do Stripe.

**Request:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ],
  "success_url": "https://multivus.com.br/sucesso",
  "cancel_url": "https://multivus.com.br/cancelado"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### `POST /api/stripe/webhook`
Webhook do Stripe para eventos de pagamento.

---

## 💬 Chat

### `GET /api/chat`
Obter mensagens do chat.

### `POST /api/chat`
Enviar mensagem no chat.

**Request:**
```json
{
  "name": "João",
  "email": "joao@email.com",
  "message": "Olá, preciso de ajuda"
}
```

---

## 🔒 Autenticação Requerida

Endpoints marcados como **(admin)** requerem autenticação via cookie `auth-token`.

Para obter o token, faça login em `/api/auth/login`.

---

## 📝 Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Requisição inválida
- `401` - Não autenticado
- `403` - Acesso negado
- `404` - Não encontrado
- `500` - Erro interno do servidor

---

Para mais informações sobre segurança da API, consulte [SEGURANCA.md](SEGURANCA.md).
