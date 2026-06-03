import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"
import { z } from "zod"

const updateSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  estimated_cost: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
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

    const { status, estimated_cost, notes } = validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    if (status !== undefined) {
      await sql!`
        UPDATE service_requests 
        SET status = ${status},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }

    if (estimated_cost !== undefined) {
      await sql!`
        UPDATE service_requests 
        SET estimated_cost = ${estimated_cost},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }

    if (notes !== undefined) {
      await sql!`
        UPDATE service_requests 
        SET notes = ${notes},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }

    if (status === undefined && estimated_cost === undefined && notes === undefined) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error updating service request:", error)
    return NextResponse.json({ error: "Erro ao atualizar solicitação" }, { status: 500 })
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

    await sql!`DELETE FROM service_requests WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting service request:", error)
    return NextResponse.json({ error: "Erro ao excluir solicitação" }, { status: 500 })
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

    const requests = await sql!`SELECT * FROM service_requests WHERE id = ${id}`

    if (requests.length === 0) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    return NextResponse.json(requests[0])
  } catch (error) {
    console.error("[API] Error fetching service request:", error)
    return NextResponse.json({ error: "Erro ao buscar solicitação" }, { status: 500 })
  }
}

