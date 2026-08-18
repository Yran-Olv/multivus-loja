export const DEFAULT_SOFTWARE_ACTIVATION_TEMPLATE = `🎉 Ativação do {{productName}} concluída!

Seu acesso já está disponível. 🚀

🔗 LINK DE ATIVAÇÃO:
{{activationUrl}}

📌 Como ativar:
1. Abra o link acima.
2. Siga as instruções exibidas.
3. Faça login na conta em que deseja utilizar o benefício.
4. Confirme a ativação.

✅ Após concluir, seu benefício estará vinculado à conta selecionada.

🧾 Pedido: {{orderId}}`

export const DEFAULT_SOLD_OUT_MESSAGE = `✅ *Pagamento confirmado!*

Recebemos seu pagamento com sucesso.

No momento estamos com *alta demanda* e os links automáticos deste produto esgotaram.

📞 *Nossa equipe entrará em contato* para te ajudar a ativar manualmente o mais breve possível.

🧾 Pedido: {{orderId}}

Obrigado pela compreensão! 🙏`

export const SOFTWARE_DELIVERY_PLACEHOLDERS =
  "{{productName}}, {{activationUrl}}, {{orderId}}, {{contactName}}, {{validityDays}}"

export const parseActivationLinkLines = (raw: string): string[] => {
  const seen = new Set<string>()
  const links: string[] = []
  for (const line of String(raw || "").split(/\r?\n/)) {
    const url = line.trim()
    if (!url || seen.has(url)) continue
    seen.add(url)
    links.push(url)
  }
  return links
}
