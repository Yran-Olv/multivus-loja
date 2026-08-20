# Pagamentos — Efí (Gerencianet) Pix

O PagBank foi substituído pela **API Pix da Efí** (antiga Gerencianet).

## 1. Conta Efí

1. Acesse [sejaefi.com.br](https://sejaefi.com.br) e abra **API** no painel.
2. Crie uma **Aplicação** com escopo **API Pix** (homologação e/ou produção).
3. Anote **Client ID** e **Client Secret**.
4. Em **Meus Certificados**, baixe o `.p12` de homologação ou produção.
5. Cadastre uma **Chave Pix** (EVP recomendada) na conta.

## 2. Certificado na VPS

```bash
mkdir -p /var/www/multivus-loja/certs/efi
# Copie o arquivo para a VPS, ex.:
# scp homologacao.p12 user@vps:/var/www/multivus-loja/certs/efi/homologacao.p12
chmod 600 /var/www/multivus-loja/certs/efi/*.p12
```

O Docker monta `./certs/efi` em `/app/certs/efi` (gravável — upload pelo admin).

## 3. Migration

```bash
bash scripts/update.sh
```

Cria a tabela `efi_config`.

## 4. Painel admin

**Configurações → Configurar Efí Pix** (`/admin/configuracoes/efi`)

| Campo | Exemplo |
|--------|---------|
| Client ID / Secret | do painel Efí |
| Ambiente | Homologação ou Produção |
| Chave Pix | sua chave cadastrada na Efí |
| Certificado | `/app/certs/efi/homologacao.p12` (caminho **dentro do Docker**, não `/var/www/...`) |

Se no painel estiver `/var/www/multivus-loja/certs/efi/arquivo.p12`, salve de novo como `/app/certs/efi/arquivo.p12` (o sistema corrige o nome ao salvar).
| Webhook | `https://multivus.shop/api/efi/webhook` |

## 5. Webhook no painel Efí (obrigatório para confirmar pagamento)

Cadastre a URL de notificação Pix (mesma do admin):

`https://SEU_DOMINIO/api/efi/webhook`

Sem webhook configurado na Efí, o cliente paga mas o site **não atualiza** sozinho.

Quando o Pix for pago, o pedido passa para **pago** / **confirmado** e o cliente recebe WhatsApp de confirmação.

## 6. Deploy

```bash
bash scripts/update.sh
```

## Fluxo do cliente

1. Checkout → cria pedido  
2. API cria cobrança Pix (`PUT /v2/cob/{txid}`)  
3. Cliente vê **Pix copia e cola** na página do pedido  
4. Webhook Efí confirma pagamento  

## Tabela antiga

`pagbank_config` não é mais usada. Pode permanecer no banco sem efeito.
