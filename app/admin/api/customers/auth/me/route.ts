import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { jwtVerify } from "jose"
import { getClientIP } from "@/lib/security"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-min-32-chars")

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request)
  const url = request.url
  
  try {
    const token = request.cookies.get("customer-token")?.value

    if (!token) {
      return NextResponse.json({ customer: null })
    }

    console.log("[CUSTOMER-AUTH-ME] Token encontrado, verificando - IP:", clientIP)
    
    const { payload } = await jwtVerify(token, secret)

    if (payload.type !== "customer") {
      return NextResponse.json({ customer: null })
    }

    const customerId = payload.id as number

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const customers = await sql!`
      SELECT id, email, name, phone, address, city, state, zip_code
      FROM customers
      WHERE id = ${customerId} AND is_active = true
      LIMIT 1
    `

    if (customers.length === 0) {
      return NextResponse.json({ customer: null })
    }

    const customer = customers[0] as {
      id: number
      email: string
      name: string
      phone: string | null
      address: string | null
      city: string | null
      state: string | null
      zip_code: string | null
    }

    let last_order: {
      customer_name: string
      customer_email: string
      customer_phone: string
      customer_address: string
      notes: string | null
    } | null = null

    try {
      const recent = await sql!`
        SELECT customer_name, customer_email, customer_phone, customer_address, notes
        FROM orders
        WHERE customer_email = ${customer.email}
        ORDER BY created_at DESC
        LIMIT 1
      `
      if (recent.length > 0) {
        const o = recent[0] as Record<string, unknown>
        last_order = {
          customer_name: String(o.customer_name || ""),
          customer_email: String(o.customer_email || ""),
          customer_phone: String(o.customer_phone || ""),
          customer_address: String(o.customer_address || ""),
          notes: (o.notes as string | null) ?? null,
        }
      }
    } catch {
      /* colunas opcionais */
    }

    console.log("[CUSTOMER-AUTH-ME] Cliente encontrado - ID:", customer.id, "Email:", customer.email, "IP:", clientIP)

    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip_code: customer.zip_code,
      },
      last_order,
    })
  } catch (error) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { error: String(error) }
    
    console.error("[CUSTOMER-AUTH-ME] Erro ao buscar cliente - IP:", clientIP, "URL:", url, "Erro:", JSON.stringify(errorDetails))
    return NextResponse.json({ customer: null })
  }
}

