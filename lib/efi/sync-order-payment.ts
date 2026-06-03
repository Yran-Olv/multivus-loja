import { sql } from "@/lib/db"
import { efiApiRequest } from "@/lib/efi/client"
import type { EfiConfigRow } from "@/lib/efi/types"
import { sendPaymentConfirmedNotification } from "@/lib/whatsapp-helpers"

type EfiCobStatus = {
  status?: string
  txid?: string
}

async function getActiveEfiConfig(): Promise<EfiConfigRow | null> {
  if (!sql) return null
  const configs = (await sql!`
    SELECT client_id, client_secret, environment, pix_key,
           certificate_path, certificate_passphrase, webhook_url
    FROM efi_config
    WHERE is_active = true
    ORDER BY id DESC
    LIMIT 1
  `) as EfiConfigRow[]
  return configs[0] ?? null
}

/** Consulta a Efí e marca pedido como pago se o Pix já foi liquidado (fallback do webhook). */
export async function syncOrderPaymentFromEfi(orderId: number): Promise<{
  updated: boolean
  payment_status: string
  status: string
}> {
  if (!sql) {
    return { updated: false, payment_status: "pending", status: "pending" }
  }

  const rows = await sql!`
    SELECT id, order_number, payment_status, status, payment_intent_id,
           customer_name, customer_phone, total_amount
    FROM orders
    WHERE id = ${orderId}
    LIMIT 1
  `

  if (rows.length === 0) {
    return { updated: false, payment_status: "pending", status: "pending" }
  }

  const order = rows[0] as {
    id: number
    order_number: string
    payment_status: string
    status: string
    payment_intent_id: string | null
    customer_name: string
    customer_phone: string | null
    total_amount: string | number
  }

  if (order.payment_status === "paid") {
    return { updated: false, payment_status: "paid", status: order.status }
  }

  const txid = order.payment_intent_id?.trim()
  if (!txid) {
    return { updated: false, payment_status: order.payment_status, status: order.status }
  }

  const config = await getActiveEfiConfig()
  if (!config?.certificate_path) {
    return { updated: false, payment_status: order.payment_status, status: order.status }
  }

  try {
    const cob = await efiApiRequest<EfiCobStatus>(config, `/v2/cob/${txid}`, { method: "GET" })
    if (cob.status !== "CONCLUIDA") {
      return { updated: false, payment_status: order.payment_status, status: order.status }
    }

    await sql!`
      UPDATE orders
      SET payment_status = 'paid',
          status = 'confirmed',
          payment_method = 'efi_pix',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orderId}
    `

    if (order.customer_phone) {
      await sendPaymentConfirmedNotification(
        order.order_number,
        order.customer_name,
        order.customer_phone,
        Number(order.total_amount)
      ).catch((err) => console.error("[Efí sync] WhatsApp:", err))
    }

    console.log("[Efí sync] Pagamento confirmado via consulta API:", order.order_number, txid)
    return { updated: true, payment_status: "paid", status: "confirmed" }
  } catch (error) {
    console.warn("[Efí sync] Não foi possível consultar cob:", txid, error)
    return { updated: false, payment_status: order.payment_status, status: order.status }
  }
}
