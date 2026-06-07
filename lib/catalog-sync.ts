import { sql } from "./db"

export function resolveSiteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_DOMAIN ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""

  const trimmed = String(raw).trim().replace(/\/$/, "")
  if (!trimmed) return ""

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed.replace(/^\/\//, "")}`
}

export function buildCatalogExportUrl(baseUrl?: string): string {
  const root = (baseUrl || resolveSiteBaseUrl()).replace(/\/$/, "")
  return root ? `${root}/api/catalog/export` : "/api/catalog/export"
}

export function maskApiKey(apiKey: string): string {
  const key = String(apiKey || "").trim()
  if (key.length <= 12) return "••••••••"
  return `${key.slice(0, 8)}…${key.slice(-4)}`
}

export async function getCatalogSyncApiKey(): Promise<string | null> {
  const envKey = process.env.CATALOG_SYNC_API_KEY?.trim()
  if (envKey) return envKey

  if (!sql) return null

  try {
    const rows = (await sql!`
      SELECT api_key
      FROM catalog_sync_config
      WHERE is_active = true
      ORDER BY id DESC
      LIMIT 1
    `) as { api_key: string }[]

    const dbKey = rows[0]?.api_key?.trim()
    return dbKey || null
  } catch (error: any) {
    if (error?.code === "42P01") {
      return null
    }
    throw error
  }
}
