import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import {
  efiApiRequest,
  formatEfiAmount,
  generateEfiTxid,
} from "@/lib/efi/client"
import type { EfiConfigRow } from "@/lib/efi/types"
import { sendEmail, emailTemplates } from "@/lib/email"
import { sendOrderConfirmationNotification } from "@/lib/whatsapp-helpers"

interface EfiCobResponse {
  txid: string
  loc?: { id: number }
  pixCopiaECola?: string
}

interface EfiQrResponse {
  qrcode?: string
  imagemQrcode?: string
  pixCopiaECola?: string
}

/**
 * POST /api/efi/create-payment
 * Cria cobrança Pix imediata (Efí / Gerencianet)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id, total_amount, customer } = body

    if (!order_id || total_amount == null || !customer) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const configs = (await sql!`
      SELECT client_id, client_secret, environment, pix_key,
             certificate_path, certificate_passphrase, webhook_url
      FROM efi_config
      WHERE is_active = true
      ORDER BY id DESC
      LIMIT 1
    `) as EfiConfigRow[]

    if (configs.length === 0) {
      return NextResponse.json({ error: "Efí não configurado" }, { status: 400 })
    }

    const config = configs[0]

    if (!config.certificate_path) {
      return NextResponse.json(
        {
          error:
            "Certificado .p12 da Efí não configurado. Informe o caminho no painel (ex: /app/certs/efi/homologacao.p12).",
        },
        { status: 400 }
      )
    }

    const siteBase = (
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_DOMAIN ||
      process.env.FRONTEND_DOMAIN ||
      "http://localhost:3000"
    ).replace(/\/$/, "")

    const orders = await sql!`SELECT * FROM orders WHERE id = ${order_id}`
    if (orders.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = orders[0]
    const txid = generateEfiTxid(Number(order_id))

    const devedor: Record<string, string> = { nome: customer.name }
    const cpf = customer.cpf?.replace(/\D/g, "")
    const cnpj = customer.cnpj?.replace(/\D/g, "")
    if (cpf && cpf.length === 11) devedor.cpf = cpf
    else if (cnpj && cnpj.length === 14) devedor.cnpj = cnpj

    const cobBody = {
      calendario: { expiracao: 3600 },
      devedor: Object.keys(devedor).length > 1 ? devedor : undefined,
      valor: { original: formatEfiAmount(Number(total_amount)) },
      chave: config.pix_key,
      solicitacaoPagador: `Pedido ${order.order_number}`,
      infoAdicionais: [
        { nome: "Pedido", valor: String(order.order_number) },
        { nome: "Email", valor: customer.email || "" },
      ],
    }

    const cob = await efiApiRequest<EfiCobResponse>(config, `/v2/cob/${txid}`, {
      method: "PUT",
      body: cobBody,
    })

    let pixCopiaECola = cob.pixCopiaECola || ""
    let qrcodeBase64 = ""

    if (cob.loc?.id) {
      const qr = await efiApiRequest<EfiQrResponse>(config, `/v2/loc/${cob.loc.id}/qrcode`, {
        method: "GET",
      })
      pixCopiaECola = qr.pixCopiaECola || pixCopiaECola
      qrcodeBase64 = qr.imagemQrcode || qr.qrcode || ""
    }

    await sql!`
      UPDATE orders
      SET payment_intent_id = ${txid},
          payment_method = 'efi_pix',
          pix_copia_cola = ${pixCopiaECola || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${order_id}
    `

    const orderItemsRaw = await sql!`
      SELECT product_id, product_name, product_price, quantity, subtotal, image_url
      FROM order_items WHERE order_id = ${order_id}
    `
    const orderItems = orderItemsRaw.map((row) => {
      const r = row as Record<string, unknown>
      return {
        product_id: Number(r.product_id),
        product_name: String(r.product_name),
        product_price: Number(r.product_price),
        quantity: Number(r.quantity),
        subtotal: Number(r.subtotal),
        image_url: (r.image_url as string | null) ?? null,
      }
    })

    if (pixCopiaECola && order.customer_email) {
      sendEmail({
        to: order.customer_email,
        subject: `Pague seu pedido ${order.order_number} — MULTIVUS`,
        html: emailTemplates.orderConfirmation(
          order.order_number,
          order.customer_name,
          Number(total_amount),
          {
            orderUrl: `${siteBase}/pedido/${order_id}?payment=pix`,
            pixCopiaECola,
          }
        ),
      }).catch((err) => console.error("[Efí] Email pedido+Pix:", err))
    }

    if (order.customer_phone && pixCopiaECola) {
      sendOrderConfirmationNotification(
        order.order_number,
        order.customer_name,
        order.customer_phone,
        order.customer_email,
        order.customer_address,
        "pending",
        Number(total_amount),
        orderItems,
        pixCopiaECola
      ).catch((err) => console.error("[Efí] WhatsApp pedido+Pix:", err))
    }

    return NextResponse.json({
      success: true,
      txid,
      qr_code: pixCopiaECola || qrcodeBase64,
      pix_copia_cola: pixCopiaECola,
      payment_url: `${siteBase}/pedido/${order_id}?payment=pix`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao processar pagamento"
    console.error("[Efí] create-payment:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
