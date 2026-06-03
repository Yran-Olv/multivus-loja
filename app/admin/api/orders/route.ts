import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { sendEmail, emailTemplates } from "@/lib/email"
import { sendOrderConfirmationNotification } from "@/lib/whatsapp-helpers"
import { z } from "zod"

const orderSchema = z.object({
  customer_name: z.string().min(3),
  customer_email: z.string().email(),
  customer_phone: z.string().min(10),
  customer_address: z.string().min(10),
  city: z.string().min(2),
  state: z.string().length(2),
  zip_code: z.string().min(8),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      product_id: z.number(),
      product_name: z.string(),
      product_price: z.number(),
      quantity: z.number(),
      subtotal: z.number(),
      image_url: z.string().nullable().optional(),
    })
  ),
  total_amount: z.number().positive(),
  skip_whatsapp: z.boolean().optional(),
})

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 3 })

    if (!limit.allowed) {
      return NextResponse.json({ error: "Muitas requisições" }, { status: 429 })
    }

    // Validar tamanho do payload
    const contentLength = request.headers.get("content-length")
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      return NextResponse.json({ error: "Payload muito grande" }, { status: 413 })
    }

    const body = await request.json()
    
    // Validar número de itens (prevenir arrays muito grandes)
    if (body.items && Array.isArray(body.items) && body.items.length > 100) {
      return NextResponse.json({ error: "Número de itens excede o limite" }, { status: 400 })
    }

    const validationResult = orderSchema.safeParse(body)

    if (!validationResult.success) {
      // Em produção, não expor detalhes de validação
      const isProduction = process.env.NODE_ENV === "production"
      return NextResponse.json(
        {
          error: "Por favor, verifique os dados informados e tente novamente",
          ...(isProduction ? {} : { details: validationResult.error.errors }),
        },
        { status: 400 }
      )
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      city,
      state,
      zip_code,
      notes,
      items,
      total_amount,
      skip_whatsapp,
    } = validationResult.data

    // Gerar número do pedido
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Criar pedido
    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const safeCustomerAddress = customer_address || `${city}, ${state} - CEP: ${zip_code}`
    const safeNotes = notes ?? null
    
    let order: { id: number; order_number: string }
    try {
      const orderResult = await sql!`
        INSERT INTO orders (
          order_number,
          customer_name,
          customer_email,
          customer_phone,
          customer_address,
          total_amount,
          status,
          payment_status,
          notes
        )
        VALUES (
          ${orderNumber},
          ${customer_name},
          ${customer_email},
          ${customer_phone},
          ${safeCustomerAddress},
          ${total_amount},
          'pending',
          'pending',
          ${safeNotes}
        )
        RETURNING id, order_number
      `

      if (!orderResult || orderResult.length === 0 || !orderResult[0]?.id) {
        console.error("[Orders] Erro: ID não retornado da inserção do pedido")
        return NextResponse.json(
          { error: "Não foi possível criar seu pedido. Por favor, tente novamente." },
          { status: 500 }
        )
      }

      order = orderResult[0] as { id: number; order_number: string }
    } catch (dbError) {
      console.error("[Orders] Erro ao inserir pedido no banco de dados:", dbError)
      return NextResponse.json(
        { error: "Não foi possível processar seu pedido. Por favor, tente novamente em alguns instantes." },
        { status: 500 }
      )
    }

    // Criar itens do pedido
    try {
      for (const item of items) {
        if (!sql) break
        await sql!`
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            product_price,
            quantity,
            subtotal
          )
          VALUES (
            ${order.id},
            ${item.product_id},
            ${item.product_name},
            ${item.product_price},
            ${item.quantity},
            ${item.subtotal}
          )
        `
      }
    } catch (itemsError) {
      console.error("[Orders] Erro ao inserir itens do pedido:", itemsError)
      // Se falhar ao inserir itens, o pedido já foi criado, então retornar erro
      // Em produção, pode ser necessário fazer rollback ou deletar o pedido
      return NextResponse.json(
        { error: "Não foi possível salvar os itens do pedido. Por favor, tente novamente." },
        { status: 500 }
      )
    }

    // Buscar imagens dos produtos do banco de dados
    let itemsWithImages = items
    try {
      itemsWithImages = await Promise.all(
        items.map(async (item: typeof items[0]) => {
          if (!sql) return item
          try {
            const product = await sql!`
              SELECT image_url FROM products WHERE id = ${item.product_id} LIMIT 1
            `
            return {
              ...item,
              image_url: product.length > 0 ? product[0].image_url : item.image_url || null,
            }
          } catch (error) {
            // Se falhar ao buscar imagem, usar a imagem do item
            console.warn(`[Orders] Erro ao buscar imagem do produto ${item.product_id}:`, error)
            return {
              ...item,
              image_url: item.image_url || null,
            }
          }
        })
      )
    } catch (imagesError) {
      // Se falhar ao buscar imagens, usar os itens originais
      console.warn("[Orders] Erro ao buscar imagens dos produtos, usando imagens dos itens:", imagesError)
      itemsWithImages = items
    }

    // Enviar email de confirmação (não bloqueia se falhar)
    sendEmail({
      to: customer_email,
      subject: `Pedido confirmado: ${orderNumber}`,
      html: emailTemplates.orderConfirmation(orderNumber, customer_name, total_amount),
    }).catch((error) => {
      console.error("[API] Erro ao enviar email:", error)
      // Não falhar o pedido se o email falhar
    })

    // WhatsApp com Pix é enviado após create-payment (skip_whatsapp no checkout)
    if (customer_phone && !skip_whatsapp) {
      sendOrderConfirmationNotification(
        orderNumber,
        customer_name,
        customer_phone,
        customer_email,
        customer_address || `${city}, ${state} - CEP: ${zip_code}`,
        "pending",
        total_amount,
        itemsWithImages
      ).catch((error) => {
        console.error("[API] Erro ao enviar notificação WhatsApp:", error)
        // Não falhar o pedido se o WhatsApp falhar
      })
    }

    return NextResponse.json({ success: true, order: { id: order.id, order_number: order.order_number } }, { status: 200 })
  } catch (error) {
    console.error("[API] Error creating order:", error)
    // Não expor detalhes do erro em produção
    const isProduction = process.env.NODE_ENV === "production"
    return NextResponse.json(
      {
        error: isProduction
          ? "Ocorreu um erro ao processar seu pedido. Por favor, tente novamente em alguns instantes."
          : String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get("email")

    if (email) {
      if (!sql) {
        return NextResponse.json({ error: "Database not available" }, { status: 503 })
      }

      // Buscar pedidos por email (área do cliente)
      const orders = await sql!`
        SELECT * FROM orders
        WHERE customer_email = ${email}
        ORDER BY created_at DESC
      `

      // Buscar itens de cada pedido
      const ordersWithItems = await Promise.all(
        orders.map(async (order: any) => {
          if (!sql) return order
          const items = await sql!`
            SELECT * FROM order_items WHERE order_id = ${order.id}
          `
          return { ...order, items }
        })
      )

      return NextResponse.json(ordersWithItems)
    }

    // Se não forneceu email, requer autenticação (admin)
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const orders = await sql!`
      SELECT * FROM orders
      ORDER BY created_at DESC
    `

    return NextResponse.json(orders)
  } catch (error) {
    console.error("[API] Error fetching orders:", error)
    // Não expor detalhes do erro em produção
    const isProduction = process.env.NODE_ENV === "production"
    return NextResponse.json(
      { error: isProduction ? "Erro ao buscar pedidos" : String(error) },
      { status: 500 }
    )
  }
}

