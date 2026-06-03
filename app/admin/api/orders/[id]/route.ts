import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"
import { z } from "zod"

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional(),
  payment_status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
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

    const { status, payment_status, notes } = validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Buscar valores atuais
    const current = await sql!`SELECT status, payment_status, notes FROM orders WHERE id = ${id}`
    if (current.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    // Usar valores fornecidos ou manter os atuais
    const finalStatus = status !== undefined ? status : current[0].status
    const finalPaymentStatus = payment_status !== undefined ? payment_status : current[0].payment_status
    const finalNotes = notes !== undefined ? notes : current[0].notes

    await sql!`
      UPDATE orders 
      SET status = ${finalStatus},
          payment_status = ${finalPaymentStatus},
          notes = ${finalNotes},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error updating order:", error)
    return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
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

    const orders = await sql!`SELECT * FROM orders WHERE id = ${id}`

    if (orders.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = orders[0]
    const items = await sql!`SELECT * FROM order_items WHERE order_id = ${id}`

    return NextResponse.json({ ...order, items })
  } catch (error) {
    console.error("[API] Error fetching order:", error)
    return NextResponse.json({ error: "Erro ao buscar pedido" }, { status: 500 })
  }
}

