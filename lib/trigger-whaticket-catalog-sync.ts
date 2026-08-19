import { getCatalogSyncApiKey, resolveSiteBaseUrl } from "./catalog-sync"

const DEBOUNCE_MS = 2500
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function resolveWhaticketApiUrl(): string {
  const raw =
    process.env.WHATICKET_API_URL ||
    process.env.WHATICKET_BACKEND_URL ||
    process.env.NEXT_PUBLIC_WHATICKET_API_URL ||
    ""

  return String(raw).trim().replace(/\/$/, "")
}

async function triggerWhaticketCatalogSync(reason?: string): Promise<void> {
  const apiUrl = resolveWhaticketApiUrl()
  if (!apiUrl) {
    console.warn(
      "[catalog-sync] WHATICKET_API_URL não configurada; sync automático com Whaticket ignorado."
    )
    return
  }

  const apiKey = await getCatalogSyncApiKey()
  if (!apiKey) {
    console.warn(
      "[catalog-sync] Chave CATALOG_SYNC não configurada; sync automático ignorado."
    )
    return
  }

  const siteUrl = resolveSiteBaseUrl()

  try {
    const response = await fetch(`${apiUrl}/company-products/loja-sync/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Catalog-Sync-Key": apiKey,
        ...(siteUrl ? { "X-Catalog-Source-Url": siteUrl } : {}),
      },
      body: JSON.stringify({
        reason: reason || "catalog_change",
        source: "multivus-loja",
      }),
      signal: AbortSignal.timeout(45000),
    })

    if (!response.ok && response.status !== 202) {
      const text = await response.text().catch(() => "")
      console.error(
        `[catalog-sync] webhook Whaticket falhou (${response.status}): ${text.slice(0, 300)}`
      )
      return
    }

    console.info(
      `[catalog-sync] Whaticket notificado (${response.status})${reason ? `: ${reason}` : ""}`
    )
  } catch (error) {
    console.error("[catalog-sync] erro ao notificar Whaticket:", error)
  }
}

/** Agenda sync automático com o Whaticket após alterações no catálogo da loja. */
export function scheduleWhaticketCatalogSync(reason?: string): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void triggerWhaticketCatalogSync(reason)
  }, DEBOUNCE_MS)
}

export async function triggerWhaticketCatalogSyncNow(reason?: string): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  await triggerWhaticketCatalogSync(reason)
}

export function getWhaticketWebhookUrl(): string | null {
  const apiUrl = resolveWhaticketApiUrl()
  return apiUrl ? `${apiUrl}/company-products/loja-sync/webhook` : null
}
