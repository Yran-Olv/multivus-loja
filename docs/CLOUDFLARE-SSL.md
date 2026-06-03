# Cloudflare + SSL na VPS (multivus.shop)

## Site pelo domínio não abre de novo (525)

Na tela do Cloudflare: **You / Browser** e **Cloudflare** verdes, **Host** vermelho = problema **só entre Cloudflare e a VPS**.

### Corrigir em 1 minuto (na maioria dos casos)

1. Abra [Cloudflare](https://dash.cloudflare.com) → **multivus.shop** → **SSL/TLS** → **Overview**
2. Mude **SSL/TLS encryption mode** para **Flexible**
3. Aguarde 1–2 minutos e teste https://multivus.shop (Ctrl+Shift+R)

Isso funciona quando a VPS só tem **HTTP na porta 80** (Nginx → Docker 3255), sem certificado na 443.

### Diagnóstico na VPS

```bash
cd /var/www/multivus-loja
git pull
bash scripts/pg-connection-status.sh
```

O script diz se falta app, Nginx, HTTPS ou certbot.

### Por que “voltou” a falhar?

| Causa comum | O que fazer |
|-------------|-------------|
| Cloudflare voltou para **Full** / **Full (strict)** | Flexible **ou** instale certificado na VPS |
| Certificado Let's Encrypt **expirou** | `sudo certbot renew` e `sudo systemctl reload nginx` |
| Nginx parado ou porta 80 fechada | `sudo systemctl status nginx` |
| **`bash scripts/update.sh` sobrescreveu Nginx sem HTTPS** | `sudo certbot --nginx -d multivus.shop` de novo (versões novas do script **preservam** SSL) |

Se `bash scripts/update.sh` detectar **525**, ele mostra um diagnóstico resumido (HTTPS na VPS, Nginx, upload).

---

## Erro 525 — SSL handshake failed

Significa: o visitante → Cloudflare está OK, mas **Cloudflare → sua VPS (origem)** falhou no HTTPS.

**Não é bug do Next.js, do admin nem do formulário de serviços.** Enquanto aparecer 525, **nenhuma página** do domínio abre (`/`, `/admin/servicos/novo`, `favicon.ico`, etc.).

Causa comum: no Cloudflare está **Full** ou **Full (strict)**, e no servidor só existe **HTTP (porta 80)** ou certificado inválido/ausente.

### Erros no console que você pode ignorar

Mensagens como `pinComponent.js`, `PIN Company Discounts`, `chrome-extension://...` vêm de **extensão do Chrome** (cupons/PIN), não do site. Teste em aba anônima sem extensões para ver só os erros reais.

### Diagnóstico rápido (na VPS)

```bash
# Origem responde em HTTP?
curl -sI http://127.0.0.1:3255 | head -3

# Nginx na 80 com seu domínio?
curl -sI http://127.0.0.1 -H "Host: multivus.shop" | head -5

# Existe HTTPS na origem? (se falhar, Cloudflare em Full/strict → 525)
curl -sI https://127.0.0.1 -H "Host: multivus.shop" -k 2>&1 | head -5

sudo certbot certificates
sudo ss -tlnp | grep -E ':80|:443'
```

---

## Solução recomendada (SSL na VPS + Cloudflare Full strict)

### 1. DNS no Cloudflare

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| A | `@` | IP da VPS | Proxied (nuvem laranja) |
| A | `api` | IP da VPS | Proxied |

Só crie registro **www** se existir DNS para `www.multivus.shop`.

### 2. Certificado na VPS (sem www, se não tiver DNS)

```bash
cd /var/www/multivus-loja

sudo certbot --nginx -d multivus.shop -d api.multivus.shop
```

Se pedir e-mail e aceitar termos, conclua. Depois:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://127.0.0.1 -H "Host: multivus.shop" -k | head -5
```

### 3. Cloudflare → SSL/TLS

- **Overview → SSL/TLS encryption mode:** **Full (strict)**  
  (use **Full** só se o certbot ainda não rodou; depois mude para strict)

### 4. Testar

- https://multivus.shop  
- Desative proxy temporariamente (nuvem cinza) só para testar origem direto: `curl -I http://SEU_IP -H "Host: multivus.shop"`

---

## Solução rápida (sem certificado na VPS)

Se quiser só liberar o site **agora**:

1. Cloudflare → **SSL/TLS** → modo **Flexible**  
   (visitante HTTPS, origem HTTP na porta 80)
2. Garanta Nginx na VPS escutando **80** para `multivus.shop` (já configurado pelo `setup-host-services.sh`)

Menos seguro entre Cloudflare e origem; o ideal é certbot + **Full (strict)**.

---

## IP direto funciona, domínio não

- **IP:** pode ir direto na porta 3255/80, sem Cloudflare.  
- **Domínio:** passa pelo Cloudflare → precisa do modo SSL acima alinhado com o Nginx.

---

## Comandos úteis na VPS

```bash
# Ver se há certificado
sudo certbot certificates

# Ver sites nginx
ls -la /etc/nginx/sites-enabled/

# Logs
sudo tail -f /var/log/nginx/error.log
```
