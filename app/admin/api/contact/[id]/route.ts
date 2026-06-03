import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"
import { z } from "zod"

const updateSchema = z.object({
  status: z.enum(["new", "read", "responded"]).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = updateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.errors }, { status: 400 })
    }

    const { status } = validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    if (status) {
      await sql!`
        UPDATE contact_messages 
        SET status = ${status},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error updating contact message:", error)
    return NextResponse.json({ error: "Erro ao atualizar mensagem" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    await sql!`DELETE FROM contact_messages WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting contact message:", error)
    return NextResponse.json({ error: "Erro ao excluir mensagem" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const messages = await sql!`SELECT * FROM contact_messages WHERE id = ${id}`

    if (messages.length === 0) {
      return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
    }

    return NextResponse.json(messages[0])
  } catch (error) {
    console.error("[API] Error fetching contact message:", error)
    return NextResponse.json({ error: "Erro ao buscar mensagem" }, { status: 500 })
  }
}
