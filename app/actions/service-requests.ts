"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateServiceRequestStatus(id: number, status: string) {
  if (!sql) {
    throw new Error("Database not available")
  }

  await sql!`
    UPDATE service_requests 
    SET status = ${status},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  revalidatePath("/admin/solicitacoes")
  revalidatePath("/admin/dashboard")
}

export async function updateServiceRequestEstimatedCost(id: number, estimated_cost: number | null) {
  if (!sql) {
    throw new Error("Database not available")
  }

  await sql!`
    UPDATE service_requests 
    SET estimated_cost = ${estimated_cost},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  revalidatePath("/admin/solicitacoes")
}

