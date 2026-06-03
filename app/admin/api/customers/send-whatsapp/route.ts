import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { jwtVerify } from "jose"
import { sendServiceRequestNotification, sendSoftwareRequestNotification } from "@/lib/whatsapp-helpers"
import { formatPhoneNumber } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-min-32-chars")

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("customer-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)

    if (payload.type !== "customer") {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const customerId = payload.id as number

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Buscar dados do cliente
    const customers = await sql!`
      SELECT id, email, name, phone, address
      FROM customers
      WHERE id = ${customerId} AND is_active = true
      LIMIT 1
    `

    if (customers.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const customer = customers[0]

    if (!customer.phone) {
      return NextResponse.json(
        { error: "Telefone não cadastrado. Atualize seu perfil com o WhatsApp." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { type, data } = body

    if (type === "service") {
      // Enviar solicitação de serviço
      const { service_type, device_info, problem_description, priority } = data

      if (!sql) {
        return NextResponse.json({ error: "Database not available" }, { status: 503 })
      }

      // Criar solicitação no banco
      const safeAddress = customer.address ?? null
      const safeDeviceInfo = device_info ?? null
      const safeProblemDescription = problem_description ?? null
      const safePriority = priority || "normal"
      
      const result = await sql!`
        INSERT INTO service_requests (
          customer_name, 
          customer_email, 
          customer_phone, 
          customer_address,
          service_type, 
          device_info, 
          problem_description, 
          priority,
          status
        )
        VALUES (
          ${customer.name}, 
          ${customer.email}, 
          ${customer.phone}, 
          ${safeAddress},
          ${service_type}, 
          ${safeDeviceInfo}, 
          ${safeProblemDescription}, 
          ${safePriority},
          'pending'
        )
        RETURNING id
      `

      // Enviar WhatsApp
      await sendServiceRequestNotification(
        result[0].id,
        customer.name,
        customer.phone,
        service_type,
        device_info || null,
        problem_description || null,
        priority || "normal",
        customer.address || null
      )

      return NextResponse.json({ success: true, message: "Solicitação enviada com sucesso!" })
    } else if (type === "software") {
      // Enviar solicitação de software
      const { software_id, software_name, software_price, is_free } = data

      // Enviar WhatsApp
      await sendSoftwareRequestNotification(
        software_id,
        software_name,
        software_price,
        is_free,
        customer.name,
        customer.phone
      )

      return NextResponse.json({ success: true, message: "Solicitação enviada com sucesso!" })
    } else {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }
  } catch (error) {
    console.error("[Customer WhatsApp] Error:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}

