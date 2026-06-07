"use server"

import { sql } from "@/lib/db"
import { deleteServiceSafe } from "@/lib/catalog-delete"
import { revalidatePath } from "next/cache"

export type ServiceFormData = {
  name: string
  description: string
  icon: string
  features: string[]
  price_from: number | null
}

function validateServiceData(data: ServiceFormData): string | null {
  if (!data.name?.trim()) return "Nome do serviço é obrigatório"
  if (!data.description?.trim()) return "Descrição é obrigatória"
  if (!data.icon?.trim()) return "Selecione um ícone para o serviço"
  if (!data.features?.length) return "Informe ao menos um recurso ou característica"
  return null
}

export async function createService(data: ServiceFormData): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sql) {
    return { ok: false, error: "Banco de dados indisponível. Verifique as variáveis DB_* no servidor." }
  }

  const validationError = validateServiceData(data)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  try {
    await sql!`
      INSERT INTO services (name, description, icon, features, price_from)
      VALUES (
        ${data.name.trim()},
        ${data.description.trim()},
        ${data.icon.trim()},
        ${data.features},
        ${data.price_from}
      )
    `
    revalidatePath("/admin/servicos")
    revalidatePath("/servicos")
    return { ok: true }
  } catch (error) {
    console.error("[createService]", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    if (message.includes("column") && message.includes("features")) {
      return {
        ok: false,
        error:
          "Coluna 'features' ausente na tabela services. Execute a migration: bash scripts/update.sh",
      }
    }
    return { ok: false, error: `Não foi possível criar o serviço: ${message}` }
  }
}

export async function updateService(
  id: number,
  data: ServiceFormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sql) {
    return { ok: false, error: "Banco de dados indisponível. Verifique as variáveis DB_* no servidor." }
  }

  const validationError = validateServiceData(data)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  try {
    await sql!`
      UPDATE services
      SET name = ${data.name.trim()},
          description = ${data.description.trim()},
          icon = ${data.icon.trim()},
          features = ${data.features},
          price_from = ${data.price_from}
      WHERE id = ${id}
    `
    revalidatePath("/admin/servicos")
    revalidatePath("/servicos")
    return { ok: true }
  } catch (error) {
    console.error("[updateService]", error)
    const message = error instanceof Error ? error.message : "Erro desconhecido"
    if (message.includes("column") && message.includes("features")) {
      return {
        ok: false,
        error:
          "Coluna 'features' ausente na tabela services. Execute a migration: bash scripts/update.sh",
      }
    }
    return { ok: false, error: `Não foi possível atualizar o serviço: ${message}` }
  }
}

export async function toggleServiceStatus(id: number) {
  if (!sql) {
    throw new Error("Database not available")
  }

  await sql!`
    UPDATE services 
    SET is_active = NOT is_active
    WHERE id = ${id}
  `
  revalidatePath("/admin/servicos")
  revalidatePath("/servicos")
}

export async function deleteService(id: number) {
  await deleteServiceSafe(id)
  revalidatePath("/admin/servicos")
  revalidatePath("/servicos")
}
