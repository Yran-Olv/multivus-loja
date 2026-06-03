import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendPaymentConfirmedNotification } from "@/lib/whatsapp-helpers"
import { getClientIP, logSecurityEvent } from "@/lib/security"

/**
 * POST /api/efi/webhook
 * Notificações Pix da Efí (Gerencianet)
 * https://dev.efipay.com.br/docs/api-pix/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text()
    const body = JSON.parse(bodyText)

    console.log("[Efí Webhook] Payload:", JSON.stringify(body, null, 2))

    const pixList = body.pix as Array<{ txid?: string; valor?: string; endToEndId?: string }> | undefined
    const txids = new Set<string>()

    if (pixList?.length) {
      for (const pix of pixList) {
        if (pix.txid) txids.add(pix.txid)
      }
    }
    if (typeof body.txid === "string" && body.txid) {
      txids.add(body.txid)
    }

    if (txids.size === 0) {
      console.log("[Efí Webhook] Sem txid no payload — ignorando")
      return NextResponse.json({ received: true })
    }

    if (!sql) {
      return NextResponse.json({ received: true })
    }

    for (const txid of txids) {
      const orders = await sql!`
        SELECT * FROM orders WHERE payment_intent_id = ${txid}
      `

      if (orders.length === 0) {
        console.warn("[Efí Webhook] Pedido não encontrado para txid:", txid)
        continue
      }

      const order = orders[0]

      await sql!`
        UPDATE orders
        SET payment_status = 'paid',
            status = 'confirmed',
            payment_method = 'efi_pix',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${order.id}
      `

      if (order.customer_phone) {
        await sendPaymentConfirmedNotification(
          order.order_number,
          order.customer_name,
          order.customer_phone,
          Number(order.total_amount)
        ).catch((err) => console.error("[Efí Webhook] WhatsApp:", err))
      }

      console.log("[Efí Webhook] ✅ Pagamento confirmado:", order.order_number, txid)
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error("[Efí Webhook] Erro:", error)
    logSecurityEvent("suspicious", getClientIP(request), {
      reason: "efi_webhook_error",
      endpoint: "/api/efi/webhook",
    })
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }
}
