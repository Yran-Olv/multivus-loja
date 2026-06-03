import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { sql } from "@/lib/db"
import { sendEmail, emailTemplates } from "@/lib/email"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(request: NextRequest) {
  // Validar tamanho do payload
  const contentLength = request.headers.get("content-length")
  if (contentLength && parseInt(contentLength) > 1024 * 1024) {
    return NextResponse.json({ error: "Payload muito grande" }, { status: 413 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook secret não configurado" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[Stripe] Webhook signature verification failed:", err)
    // Não expor detalhes do erro
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.order_id

      if (orderId) {
        if (!sql) {
          console.error("[Stripe Webhook] Database not available")
          return NextResponse.json({ error: "Database not available" }, { status: 503 })
        }

        // Atualizar status do pedido
        await sql!`
          UPDATE orders
          SET payment_status = 'paid',
              status = 'confirmed',
              payment_method = 'stripe'
          WHERE id = ${orderId}
        `

        // Buscar pedido para enviar email
        const orders = await sql!`SELECT * FROM orders WHERE id = ${orderId}`
        if (orders.length > 0) {
          const order = orders[0]
          await sendEmail({
            to: order.customer_email,
            subject: `Pagamento confirmado: ${order.order_number}`,
            html: emailTemplates.orderConfirmation(order.order_number, order.customer_name, Number(order.total_amount)),
          })
        }
      }
    }
  } catch (error) {
    console.error("[Stripe] Webhook error:", error)
    // Não expor detalhes do erro
    return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

