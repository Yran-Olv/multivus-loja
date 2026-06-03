import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { sql } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "")

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 })
    }

    const { order_id, items, total_amount } = await request.json()

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Buscar pedido
    const orders = await sql!`SELECT * FROM orders WHERE id = ${order_id}`
    if (orders.length === 0) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
    }

    const order = orders[0]

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "brl",
          product_data: {
            name: item.product_name,
          },
          unit_amount: Math.round(item.product_price * 100), // Converter para centavos
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.FRONTEND_DOMAIN || "http://localhost:3000"}/pedido/${order_id}?success=true`,
      cancel_url: `${process.env.FRONTEND_DOMAIN || "http://localhost:3000"}/checkout?canceled=true`,
      metadata: {
        order_id: order_id.toString(),
        order_number: order.order_number,
      },
    })

    // Atualizar pedido com payment_intent_id
    await sql!`
      UPDATE orders
      SET payment_intent_id = ${session.id}
      WHERE id = ${order_id}
    `

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[Stripe] Error:", error)
    return NextResponse.json({ error: "Erro ao criar sessão de pagamento" }, { status: 500 })
  }
}

