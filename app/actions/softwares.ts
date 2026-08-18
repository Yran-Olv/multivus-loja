"use server"

import { sql } from "@/lib/db"
import { deleteSoftwareSafe } from "@/lib/catalog-delete"
import { revalidatePath } from "next/cache"

export type SoftwareDeliveryFields = {
  activation_url?: string | null
  activation_message_template?: string | null
  order_id_prefix?: string | null
  link_validity_days?: number | null
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
})

export async function createSoftware(data: SoftwarePayload) {
  if (!sql) {
    throw new Error("Database not available")
  }

  const safeShortDescription = data.short_description ?? null
  const safeVersion = data.version ?? null
  const safeImageUrl = data.image_url ?? null
  const delivery = normalizeDelivery(data)

  await sql!`
    INSERT INTO softwares (
      name, description, short_description, version, price, category, image_url,
      features, system_requirements, is_featured,
      activation_url, activation_message_template, order_id_prefix, link_validity_days
    )
    VALUES (
      ${data.name}, ${data.description}, ${safeShortDescription}, ${safeVersion}, ${data.price},
      ${data.category}, ${safeImageUrl}, ${data.features}, ${JSON.stringify(data.system_requirements)},
      ${data.is_featured}, ${delivery.activation_url}, ${delivery.activation_message_template},
      ${delivery.order_id_prefix}, ${delivery.link_validity_days}
    )
  `
  revalidatePath("/admin/softwares")
  revalidatePath("/softwares")
}

export async function updateSoftware(id: number, data: SoftwarePayload) {
  if (!sql) {
    throw new Error("Database not available")
  }

  const safeShortDescription = data.short_description ?? null
  const safeVersion = data.version ?? null
  const safeImageUrl = data.image_url ?? null
  const delivery = normalizeDelivery(data)

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
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
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
