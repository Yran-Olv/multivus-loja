function resolveWhaticketApiUrl(): string {
  const raw =
    process.env.WHATICKET_API_URL ||
    process.env.WHATICKET_BACKEND_URL ||
    process.env.NEXT_PUBLIC_WHATICKET_API_URL ||
    ""

  return String(raw).trim().replace(/\/$/, "")
}

/** Repassa notificação Pix da Efí ao Whaticket (vendas pelo catálogo no WhatsApp). */
export async function forwardPixWebhookToWhaticket(
  bodyText: string,
  txid?: string
): Promise<boolean> {
  const apiUrl = resolveWhaticketApiUrl()
  if (!apiUrl) {
    console.warn(
      "[Efí Webhook] WHATICKET_API_URL não configurada; Pix de ticket não repassado."
    )
    return false
  }

  try {
    const response = await fetch(`${apiUrl}/subscription/webhook/pix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.error(
        `[Efí Webhook] Repasse Whaticket falhou (${response.status})${txid ? ` txid=${txid}` : ""}: ${text.slice(0, 300)}`
      )
      return false
    }

    console.info(
      `[Efí Webhook] Pix repassado ao Whaticket${txid ? ` (txid=${txid})` : ""}`
    )
    return true
  } catch (error) {
    console.error("[Efí Webhook] Erro ao repassar Pix ao Whaticket:", error)
    return false
  }
}
