"use server"

import { sql } from "@/lib/db"
import { deleteSoftwareSafe } from "@/lib/catalog-delete"
import { parseActivationLinkLines } from "@/lib/software-delivery"
import { revalidatePath } from "next/cache"

export type SoftwareDeliveryFields = {
  activation_url?: string | null
  activation_message_template?: string | null
  order_id_prefix?: string | null
  link_validity_days?: number | null
  sold_out_message?: string | null
  activation_links_bulk?: string | null
}

export type SoftwarePayload = {
  name: string
  description: string
  short_description?: string | null
  version?: string | null
  price: number
  category: string
  image_url?: string | null
  features: string[]
  system_requirements: any
  is_featured: boolean
} & SoftwareDeliveryFields

const normalizeDelivery = (data: SoftwareDeliveryFields) => ({
  activation_url: String(data.activation_url || "").trim() || null,
  activation_message_template:
    String(data.activation_message_template || "").trim() || null,
  order_id_prefix:
    String(data.order_id_prefix || "LNK")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 16) || "LNK",
  link_validity_days:
    data.link_validity_days !== undefined && data.link_validity_days !== null
      ? Number(data.link_validity_days) || 7
      : 7,
  sold_out_message: String(data.sold_out_message || "").trim() || null,
})

type LinkInsertResult = { inserted: number; skipped: number; invalid: number }

const insertBulkLinks = async (
  softwareId: number,
  bulkRaw?: string | null,
  fallbackSingle?: string | null
): Promise<LinkInsertResult> => {
  const fromBulk = parseActivationLinkLines(String(bulkRaw || ""))
  const links =
    fromBulk.length > 0
      ? fromBulk
      : fallbackSingle
        ? parseActivationLinkLines(String(fallbackSingle))
        : []

  if (!links.length) {
    const rawLines = String(bulkRaw || "")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
    return { inserted: 0, skipped: 0, invalid: rawLines.length }
  }

  let inserted = 0
  let skipped = 0

  for (const activation_url of links) {
    try {
      const rows = (await sql!`
        INSERT INTO software_activation_links (software_id, activation_url, status)
        VALUES (${softwareId}, ${activation_url}, 'available')
        ON CONFLICT (activation_url) DO NOTHING
        RETURNING id
      `) as Array<{ id: number }>

      if (rows.length) inserted += 1
      else skipped += 1
    } catch {
      skipped += 1
    }
  }

  const invalid = Math.max(
    0,
    String(bulkRaw || "")
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean).length - links.length
  )

  return { inserted, skipped, invalid }
}

export type SoftwareAvailableLinkRow = { id: number; url: string }

export async function getSoftwareAvailableLinkRows(
  softwareId: number
): Promise<SoftwareAvailableLinkRow[]> {
  if (!sql) return []

  const rows = (await sql!`
    SELECT id, activation_url
    FROM software_activation_links
    WHERE software_id = ${softwareId} AND status = 'available'
    ORDER BY id ASC
  `) as Array<{ id: number; activation_url: string }>

  return rows
    .map(r => ({ id: r.id, url: r.activation_url }))
    .filter(r => Boolean(r.url))
}

export async function getSoftwareAvailableLinks(softwareId: number): Promise<string[]> {
  const rows = await getSoftwareAvailableLinkRows(softwareId)
  return rows.map(r => r.url)
}

export async function deleteSoftwareActivationLink(softwareId: number, linkId: number) {
  if (!sql) {
    throw new Error("Database not available")
  }

  const deleted = (await sql!`
    DELETE FROM software_activation_links
    WHERE id = ${linkId}
      AND software_id = ${softwareId}
      AND status = 'available'
    RETURNING id
  `) as Array<{ id: number }>

  if (!deleted.length) {
    throw new Error("Link não encontrado ou já foi vendido — não pode ser excluído.")
  }

  revalidatePath("/admin/softwares")
  revalidatePath(`/admin/softwares/${softwareId}`)
  revalidatePath("/softwares")
  revalidatePath(`/softwares/${softwareId}`)

  return { success: true }
}

export async function getSoftwareLinkStats(softwareId: number) {
  if (!sql) return { available: 0, used: 0, total: 0 }

  const rows = (await sql!`
    SELECT status, COUNT(*)::int AS count
    FROM software_activation_links
    WHERE software_id = ${softwareId}
    GROUP BY status
  `) as Array<{ status: string; count: number }>

  const available = rows.find(r => r.status === "available")?.count || 0
  const used = rows.find(r => r.status === "used")?.count || 0
  return { available, used, total: available + used }
}

const parsePriceInput = (raw: unknown): number => {
  const text = String(raw ?? "")
    .trim()
    .replace(/[^\d,.-]/g, "")
  if (!text) return Number.NaN
  if (text.includes(",")) {
    return Number.parseFloat(text.replace(/\./g, "").replace(",", "."))
  }
  return Number.parseFloat(text)
}

export async function createSoftware(data: SoftwarePayload) {
  if (!sql) {
    throw new Error("Database not available")
  }

  const delivery = normalizeDelivery(data)
  const bulkLinks = parseActivationLinkLines(String(data.activation_links_bulk || ""))
  const hasLinks =
    bulkLinks.length > 0 || Boolean(String(data.activation_url || "").trim())

  if (!hasLinks) {
    throw new Error(
      "Informe ao menos um link de ativação (um por linha) ou um link único."
    )
  }

  const safeShortDescription = data.short_description ?? null
  const safeVersion = data.version ?? null
  const safeImageUrl = data.image_url ?? null
  const price = parsePriceInput(data.price)

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Preço inválido. Use formato como 99,90")
  }

  const inserted = (await sql!`
    INSERT INTO softwares (
      name, description, short_description, version, price, category, icon,
      features, system_requirements, is_featured,
      activation_url, activation_message_template, order_id_prefix, link_validity_days,
      sold_out_message
    )
    VALUES (
      ${data.name}, ${data.description}, ${safeShortDescription}, ${safeVersion}, ${price},
      ${data.category}, ${safeImageUrl}, ${data.features}, ${JSON.stringify(data.system_requirements)},
      ${data.is_featured}, ${delivery.activation_url}, ${delivery.activation_message_template},
      ${delivery.order_id_prefix}, ${delivery.link_validity_days}, ${delivery.sold_out_message}
    )
    RETURNING id
  `) as Array<{ id: number }>

  const softwareId = inserted[0]?.id
  if (!softwareId) {
    throw new Error("Falha ao criar software")
  }

  const linkResult = await insertBulkLinks(
    softwareId,
    data.activation_links_bulk,
    data.activation_url
  )

  revalidatePath("/admin/softwares")
  revalidatePath("/softwares")

  return linkResult
}

export async function updateSoftware(id: number, data: SoftwarePayload) {
  if (!sql) {
    throw new Error("Database not available")
  }

  const delivery = normalizeDelivery(data)
  const safeShortDescription = data.short_description ?? null
  const safeVersion = data.version ?? null
  const safeImageUrl = data.image_url ?? null
  const price = parsePriceInput(data.price)

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Preço inválido. Use formato como 99,90")
  }

  await sql!`
    UPDATE softwares 
    SET name = ${data.name}, 
        description = ${data.description}, 
        short_description = ${safeShortDescription},
        version = ${safeVersion},
        price = ${price}, 
        category = ${data.category}, 
        icon = ${safeImageUrl}, 
        features = ${data.features}, 
        system_requirements = ${JSON.stringify(data.system_requirements)},
        is_featured = ${data.is_featured},
        activation_url = ${delivery.activation_url},
        activation_message_template = ${delivery.activation_message_template},
        order_id_prefix = ${delivery.order_id_prefix},
        link_validity_days = ${delivery.link_validity_days},
        sold_out_message = ${delivery.sold_out_message},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `

  const linkResult = await insertBulkLinks(id, data.activation_links_bulk, null)

  revalidatePath("/admin/softwares")
  revalidatePath(`/admin/softwares/${id}`)
  revalidatePath("/softwares")
  revalidatePath(`/softwares/${id}`)

  return linkResult
}

export async function toggleSoftwareStatus(id: number) {
  if (!sql) {
    throw new Error("Database not available")
  }

  await sql!`
    UPDATE softwares 
    SET is_active = NOT is_active
    WHERE id = ${id}
  `
  revalidatePath("/admin/softwares")
}

export async function deleteSoftware(id: number) {
  await deleteSoftwareSafe(id)
  revalidatePath("/admin/softwares")
}
