import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"
import { buildPixWhatsAppBlock, sendWhatsAppMessage } from "@/lib/whatsapp-helpers"

/** POST — reenvia código Pix por WhatsApp (admin) */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(_request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { id } = await params
    const orderId = Number(id)
    if (!Number.isFinite(orderId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const orders = await sql!`
      SELECT order_number, customer_name, customer_phone, total_amount, pix_copia_cola, payment_status
      FROM orders WHERE id = ${orderId} LIMIT 1
    `

    if (orders.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = orders[0] as {
      order_number: string
      customer_name: string
      customer_phone: string | null
      total_amount: number
      pix_copia_cola: string | null
      payment_status: string
    }

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Pedido já está pago" }, { status: 400 })
    }

    if (!order.pix_copia_cola?.trim()) {
      return NextResponse.json({ error: "Este pedido não tem código Pix salvo" }, { status: 400 })
    }

    if (!order.customer_phone) {
      return NextResponse.json({ error: "Cliente sem telefone" }, { status: 400 })
    }

    const message = `🔔 *Lembrete de pagamento — MULTIVUS*

Pedido *${order.order_number}*

${buildPixWhatsAppBlock(order.pix_copia_cola.trim(), Number(order.total_amount))}`

    const result = await sendWhatsAppMessage(order.customer_phone, message)
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Falha ao enviar WhatsApp" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Orders] resend-pix:", error)
    return NextResponse.json({ error: "Erro ao reenviar Pix" }, { status: 500 })
  }
}
