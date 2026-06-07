"use server"

import { sql } from "@/lib/db"
import { deleteSoftwareSafe } from "@/lib/catalog-delete"
import { revalidatePath } from "next/cache"

export async function createSoftware(data: {
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
}) {
  if (!sql) {
    throw new Error("Database not available")
  }

  const safeShortDescription = data.short_description ?? null
  const safeVersion = data.version ?? null
  const safeImageUrl = data.image_url ?? null

  await sql!`
    INSERT INTO softwares (name, description, short_description, version, price, category, image_url, features, system_requirements, is_featured)
    VALUES (${data.name}, ${data.description}, ${safeShortDescription}, ${safeVersion}, ${data.price}, ${data.category}, ${safeImageUrl}, ${data.features}, ${JSON.stringify(data.system_requirements)}, ${data.is_featured})
  `
  revalidatePath("/admin/softwares")
  revalidatePath("/softwares")
}

export async function updateSoftware(
  id: number,
  data: {
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
  },
) {
  if (!sql) {
    throw new Error("Database not available")
  }

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
