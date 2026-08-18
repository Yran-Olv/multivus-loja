import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCatalogSyncApiKey } from "@/lib/catalog-sync"

export const dynamic = "force-dynamic"

const unauthorized = () =>
  NextResponse.json({ error: "Não autorizado" }, { status: 401 })

export async function POST(request: NextRequest) {
  const apiKey = await getCatalogSyncApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: "Chave não configurada" }, { status: 503 })
  }

  const providedKey =
    request.headers.get("x-catalog-sync-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""

  if (providedKey !== apiKey) {
    return unauthorized()
  }

  if (!sql) {
    return NextResponse.json({ error: "Banco indisponível" }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const softwareSourceId = Number(body?.softwareSourceId)
  const sourceLinkId = Number(body?.sourceLinkId)
  const orderReference = String(body?.orderReference || "").trim() || null

  if (!Number.isInteger(softwareSourceId) || !Number.isInteger(sourceLinkId)) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
  }

  const updated = (await sql!`
    UPDATE software_activation_links
    SET status = 'used',
        used_at = CURRENT_TIMESTAMP,
        order_reference = ${orderReference}
    WHERE id = ${sourceLinkId}
      AND software_id = ${softwareSourceId}
      AND status = 'available'
    RETURNING id
  `) as Array<{ id: number }>

  if (!updated.length) {
    return NextResponse.json({ ok: false, reason: "not_found_or_already_used" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, id: updated[0].id })
}
