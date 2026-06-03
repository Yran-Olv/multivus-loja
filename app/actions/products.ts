"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { productSchema, sanitizeString } from "@/lib/validation"

export async function createProduct(data: {
  name: string
  description: string
  price: number
  category: string
  image_url: string | null
  stock_quantity: number
  specifications: any
  warranty?: string | null
  delivery?: string | null
  support?: string | null
}) {
  // Validar dados (o schema já normaliza image_url automaticamente via preprocess)
  const validationResult = productSchema.safeParse({
    ...data,
    name: sanitizeString(data.name),
    description: sanitizeString(data.description || ""),
    // image_url pode ser string, string vazia, null ou undefined - o schema trata todos os casos
  })

  if (!validationResult.success) {
    throw new Error("Dados inválidos: " + validationResult.error.errors.map((e) => e.message).join(", "))
  }

  if (!sql) {
    throw new Error("Database not available")
  }

  const safeDescription = validationResult.data.description || null
  const safeImageUrl = validationResult.data.image_url || null
  const safeWarranty = validationResult.data.warranty || null
  const safeDelivery = validationResult.data.delivery || null
  const safeSupport = validationResult.data.support || null

  await sql!`
    INSERT INTO products (name, description, price, category, image_url, stock_quantity, specifications, warranty, delivery, support)
    VALUES (${validationResult.data.name}, ${safeDescription}, ${validationResult.data.price}, ${validationResult.data.category}, ${safeImageUrl}, ${validationResult.data.stock_quantity}, ${JSON.stringify(validationResult.data.specifications || {})}, ${safeWarranty}, ${safeDelivery}, ${safeSupport})
  `
  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
}

export async function updateProduct(
  id: number,
  data: {
    name: string
    description: string
    price: number
    category: string
    image_url: string | null
    stock_quantity: number
    specifications: any
    warranty?: string | null
    delivery?: string | null
    support?: string | null
  },
) {
  // Validar dados (o schema já normaliza image_url automaticamente via preprocess)
  const validationResult = productSchema.safeParse({
    ...data,
    name: sanitizeString(data.name),
    description: sanitizeString(data.description || ""),
    // image_url pode ser string, string vazia, null ou undefined - o schema trata todos os casos
  })

  if (!validationResult.success) {
    throw new Error("Dados inválidos: " + validationResult.error.errors.map((e) => e.message).join(", "))
  }

  if (!sql) {
    throw new Error("Database not available")
  }

  const safeDescription = validationResult.data.description || null
  const safeImageUrl = validationResult.data.image_url || null
  const safeWarranty = validationResult.data.warranty || null
  const safeDelivery = validationResult.data.delivery || null
  const safeSupport = validationResult.data.support || null

  await sql!`
    UPDATE products 
    SET name = ${validationResult.data.name}, 
        description = ${safeDescription}, 
        price = ${validationResult.data.price}, 
        category = ${validationResult.data.category}, 
        image_url = ${safeImageUrl}, 
        stock_quantity = ${validationResult.data.stock_quantity}, 
        specifications = ${JSON.stringify(validationResult.data.specifications || {})},
        warranty = ${safeWarranty},
        delivery = ${safeDelivery},
        support = ${safeSupport},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  revalidatePath("/admin/produtos")
  revalidatePath("/produtos")
  revalidatePath(`/produtos/${id}`)
}

export async function toggleProductStatus(id: number) {
  if (!sql) {
    throw new Error("Database not available")
  }

  await sql!`
    UPDATE products 
    SET is_active = NOT is_active
    WHERE id = ${id}
  `
  revalidatePath("/admin/produtos")
}

export async function deleteProduct(id: number) {
  if (!sql) {
    throw new Error("Database not available")
  }

  await sql!`DELETE FROM products WHERE id = ${id}`
  revalidatePath("/admin/produtos")
}
