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

const insertBulkLinks = async (
  softwareId: number,
  bulkRaw?: string | null,
  fallbackSingle?: string | null
) => {
  const fromBulk = parseActivationLinkLines(String(bulkRaw || ""))
  const links =
    fromBulk.length > 0
      ? fromBulk
      : fallbackSingle
        ? [String(fallbackSingle).trim()].filter(Boolean)
        : []

  if (!links.length) return 0

  let inserted = 0
  for (const activation_url of links) {
    try {
      await sql!`
        INSERT INTO software_activation_links (software_id, activation_url, status)
        VALUES (${softwareId}, ${activation_url}, 'available')
        ON CONFLICT (activation_url) DO NOTHING
      `
      inserted += 1
    } catch {
      /* ignore duplicate */
    }
  }
  return inserted
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

  const inserted = (await sql!`
    INSERT INTO softwares (
      name, description, short_description, version, price, category, image_url,
      features, system_requirements, is_featured,
      activation_url, activation_message_template, order_id_prefix, link_validity_days,
      sold_out_message
    )
    VALUES (
      ${data.name}, ${data.description}, ${safeShortDescription}, ${safeVersion}, ${data.price},
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

  await insertBulkLinks(
    softwareId,
    data.activation_links_bulk,
    data.activation_url
  )

  revalidatePath("/admin/softwares")
  revalidatePath("/softwares")
}

export async function updateSoftware(id: number, data: SoftwarePayload) {
  if (!sql) {
    throw new Error("Database not available")
  }

  const delivery = normalizeDelivery(data)
  const safeShortDescription = data.short_description ?? null
  const safeVersion = data.version ?? null
  const safeImageUrl = data.image_url ?? null

  await sql!`
    UPDATE softwares 
    SET name = ${data.name}, 
        description = ${data.description}, 
        short_description = ${safeShortDescription},
        version = ${safeVersion},
        price = ${data.price}, 
        category = ${data.category}, 
        image_url = ${safeImageUrl}, 
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

  await insertBulkLinks(id, data.activation_links_bulk, null)

  revalidatePath("/admin/softwares")
  revalidatePath("/softwares")
  revalidatePath(`/softwares/${id}`)
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
