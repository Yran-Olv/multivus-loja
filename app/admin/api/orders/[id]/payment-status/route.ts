import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { syncOrderPaymentFromEfi } from "@/lib/efi/sync-order-payment"

/** GET público — status do pagamento e Pix (para polling na página do pedido) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = Number(id)
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const rows = await sql!`
      SELECT id, order_number, payment_status, status, total_amount, pix_copia_cola, payment_intent_id
      FROM orders
      WHERE id = ${orderId}
      LIMIT 1
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    await syncOrderPaymentFromEfi(orderId)

    const updatedRows = await sql!`
      SELECT id, order_number, payment_status, status, total_amount, pix_copia_cola, payment_intent_id
      FROM orders
      WHERE id = ${orderId}
      LIMIT 1
    `

    const order = updatedRows[0] as {
      payment_status: string
      status: string
      total_amount: string | number
      pix_copia_cola: string | null
      order_number: string
    }

    return NextResponse.json({
      payment_status: order.payment_status,
      status: order.status,
      total_amount: Number(order.total_amount),
      pix_copia_cola: order.pix_copia_cola || null,
      order_number: order.order_number,
    })
  } catch (error) {
    console.error("[Orders] payment-status:", error)
    return NextResponse.json({ error: "Erro ao consultar pedido" }, { status: 500 })
  }
}
