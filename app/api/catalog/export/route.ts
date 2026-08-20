import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getCatalogSyncApiKey } from "@/lib/catalog-sync"

export const dynamic = "force-dynamic"

const unauthorized = () =>
  NextResponse.json({ error: "Não autorizado" }, { status: 401 })

export async function GET(request: NextRequest) {
  const apiKey = await getCatalogSyncApiKey()
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Chave de sincronização não configurada. Gere em /admin/configuracoes/catalogo",
      },
      { status: 503 }
    )
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

  const includeProducts = request.nextUrl.searchParams.get("products") !== "0"
  const includeServices = request.nextUrl.searchParams.get("services") !== "0"
  const includeSoftwares = request.nextUrl.searchParams.get("softwares") !== "0"

  const items: Array<{
    sourceType: "product" | "service" | "software"
    sourceId: number
    name: string
    description: string | null
    shortDescription?: string | null
    version?: string | null
    price: number
    priceFrom?: number | null
    pricingMode?: "fixed" | "quote"
    imageUrl: string | null
    active: boolean
    sortOrder: number
    activationUrl?: string | null
    activationMessageTemplate?: string | null
    orderIdPrefix?: string | null
    linkValidityDays?: number | null
    soldOutMessage?: string | null
    activationLinks?: Array<{
      sourceLinkId: number
      url: string
      status: string
    }>
  }> = []

  if (includeProducts) {
    const products = (await sql!`
      SELECT id, name, description, price, image_url, is_active, created_at
      FROM products
      ORDER BY created_at DESC
    `) as any[]

    products.forEach((p, index) => {
      items.push({
        sourceType: "product",
        sourceId: p.id,
        name: p.name,
        description: p.description || null,
        price: Number(p.price) || 0,
        imageUrl: p.image_url || null,
        active: Boolean(p.is_active),
        sortOrder: index
      })
    })
  }

  if (includeServices) {
    const services = (await sql!`
      SELECT id, name, description, price_from, is_active, created_at
      FROM services
      ORDER BY created_at DESC
    `) as any[]

    services.forEach((s, index) => {
      const priceFrom =
        s.price_from !== null && s.price_from !== undefined
          ? Number(s.price_from)
          : null

      items.push({
        sourceType: "service",
        sourceId: s.id,
        name: s.name,
        description: s.description || null,
        price: priceFrom && priceFrom > 0 ? priceFrom : 0,
        priceFrom,
        pricingMode: "quote",
        imageUrl: null,
        active: Boolean(s.is_active),
        sortOrder: 1000 + index
      })
    })
  }

  if (includeSoftwares) {
    const softwares = (await sql!`
      SELECT
        id, name, description, short_description, version, price,
        icon, screenshots, is_active, created_at,
        activation_url, activation_message_template, order_id_prefix, link_validity_days,
        sold_out_message
      FROM softwares
      ORDER BY created_at DESC
    `) as any[]

    for (const s of softwares) {
      const screenshots = Array.isArray(s.screenshots) ? s.screenshots : []
      const poolRows = (await sql!`
        SELECT id, activation_url, status, short_code
        FROM software_activation_links
        WHERE software_id = ${s.id} AND status = 'available'
        ORDER BY id ASC
      `) as Array<{
        id: number
        activation_url: string
        status: string
        short_code: string | null
      }>

      items.push({
        sourceType: "software",
        sourceId: s.id,
        name: s.name,
        description: s.description || null,
        shortDescription: s.short_description || null,
        version: s.version || null,
        price: Number(s.price) || 0,
        imageUrl: s.icon || screenshots[0] || null,
        active: Boolean(s.is_active),
        sortOrder: 2000 + Number(s.id),
        activationUrl: s.activation_url || null,
        activationMessageTemplate: s.activation_message_template || null,
        orderIdPrefix: s.order_id_prefix || null,
        linkValidityDays:
          s.link_validity_days !== null && s.link_validity_days !== undefined
            ? Number(s.link_validity_days)
            : null,
        soldOutMessage: s.sold_out_message || null,
        activationLinks: poolRows.map(row => ({
          sourceLinkId: row.id,
          url: row.activation_url,
          shortCode: row.short_code || null,
          status: row.status
        }))
      })
    }
  }

  return NextResponse.json({
    source: "multivus-loja",
    exportedAt: new Date().toISOString(),
    items
  })
}
