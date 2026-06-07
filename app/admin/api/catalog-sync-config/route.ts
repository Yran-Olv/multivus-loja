import { randomBytes } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"
import {
  buildCatalogExportUrl,
  maskApiKey,
  resolveSiteBaseUrl,
} from "@/lib/catalog-sync"

export const dynamic = "force-dynamic"

function generateApiKey(): string {
  return randomBytes(32).toString("base64url")
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const siteUrl = resolveSiteBaseUrl()
    const exportUrl = buildCatalogExportUrl(siteUrl)
    const envConfigured = Boolean(process.env.CATALOG_SYNC_API_KEY?.trim())

    if (!sql) {
      return NextResponse.json({
        configured: envConfigured,
        source: envConfigured ? "env" : null,
        keyPreview: envConfigured ? "definida no .env" : null,
        siteUrl,
        exportUrl,
      })
    }

    const rows = (await sql!`
      SELECT api_key, updated_at
      FROM catalog_sync_config
      WHERE is_active = true
      ORDER BY id DESC
      LIMIT 1
    `) as { api_key: string; updated_at: string }[]

    const row = rows[0]
    const configured = Boolean(row?.api_key) || envConfigured

    return NextResponse.json({
      configured,
      source: row?.api_key ? "database" : envConfigured ? "env" : null,
      keyPreview: row?.api_key
        ? maskApiKey(row.api_key)
        : envConfigured
          ? "definida no .env"
          : null,
      siteUrl,
      exportUrl,
      updatedAt: row?.updated_at || null,
    })
  } catch (error: any) {
    console.error("[API] catalog-sync-config GET:", error)

    if (error?.code === "42P01") {
      return NextResponse.json(
        {
          error: "Tabela catalog_sync_config não encontrada. Execute: npm run db:migrate",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || "generate")

    if (action !== "generate") {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
    }

    const apiKey = generateApiKey()

    await sql!`
      UPDATE catalog_sync_config
      SET is_active = false
      WHERE is_active = true
    `

    const existing = (await sql!`
      SELECT id FROM catalog_sync_config ORDER BY id DESC LIMIT 1
    `) as { id: number }[]

    if (existing.length > 0) {
      await sql!`
        UPDATE catalog_sync_config
        SET api_key = ${apiKey},
            is_active = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
      `
    } else {
      await sql!`
        INSERT INTO catalog_sync_config (api_key, is_active)
        VALUES (${apiKey}, true)
      `
    }

    const siteUrl = resolveSiteBaseUrl()

    return NextResponse.json({
      success: true,
      apiKey,
      keyPreview: maskApiKey(apiKey),
      siteUrl,
      exportUrl: buildCatalogExportUrl(siteUrl),
      message:
        "Chave gerada. Copie agora e cole no Whaticket (Catálogo de produtos → Sincronizar com multivus-loja).",
    })
  } catch (error: any) {
    console.error("[API] catalog-sync-config POST:", error)

    if (error?.code === "42P01") {
      return NextResponse.json(
        {
          error: "Tabela catalog_sync_config não encontrada. Execute: npm run db:migrate",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: "Erro ao gerar chave" }, { status: 500 })
  }
}
