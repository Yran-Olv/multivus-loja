"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function togglePostStatus(id: number) {
  if (!sql) {
    throw new Error("Database not available")
  }

  await sql!`
    UPDATE posts 
    SET is_published = NOT is_published,
        published_at = CASE 
          WHEN is_published = false THEN CURRENT_TIMESTAMP 
          ELSE published_at 
        END
    WHERE id = ${id}
  `
  revalidatePath("/admin/blog")
  revalidatePath("/blog")
}

export async function incrementPostViews(slug: string) {
  if (!sql) {
    return // Silenciosamente falha se o banco não estiver disponível
  }

  try {
    await sql!`
      UPDATE posts 
      SET views = views + 1
      WHERE slug = ${slug}
    `
    // Não usar revalidatePath aqui pois é chamado durante render
    // O cache será atualizado naturalmente na próxima requisição
  } catch (error) {
    console.error("[Blog] Error incrementing views:", error)
    // Não lançar erro para não quebrar a página
  }
}

