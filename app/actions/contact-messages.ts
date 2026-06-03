"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateContactMessageStatus(id: number, status: string) {
  if (!sql) {
    throw new Error("Database not available")
  }

  await sql!`
    UPDATE contact_messages 
    SET status = ${status},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  revalidatePath("/admin/mensagens")
  revalidatePath("/admin/dashboard")
}

