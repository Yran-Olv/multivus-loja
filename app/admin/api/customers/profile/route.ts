import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { jwtVerify } from "jose"
import { z } from "zod"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-min-32-chars")

const profileSchema = z.object({
  name: z.string().min(3).max(255).optional(),
  phone: z.string().min(10).max(50).optional(),
  address: z.string().min(3).max(500).optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().length(2).optional(),
  zip_code: z.string().min(8).max(20).optional(),
})

async function getCustomerId(request: NextRequest): Promise<number | null> {
  const token = request.cookies.get("customer-token")?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    if (payload.type !== "customer") return null
    return payload.id as number
  } catch {
    return null
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const customerId = await getCustomerId(request)
    if (!customerId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.errors }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const data = parsed.data
    const rows = await sql!`
      SELECT id, email, name, phone, address, city, state, zip_code
      FROM customers WHERE id = ${customerId} AND is_active = true LIMIT 1
    `
    if (rows.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const current = rows[0] as Record<string, unknown>
    const name = data.name ?? String(current.name)
    const phone = data.phone ?? (current.phone as string | null)
    const address = data.address ?? (current.address as string | null)
    const city = data.city ?? (current.city as string | null)
    const state = data.state?.toUpperCase() ?? (current.state as string | null)
    const zip_code = data.zip_code ?? (current.zip_code as string | null)

    await sql!`
      UPDATE customers
      SET name = ${name},
          phone = ${phone},
          address = ${address},
          city = ${city},
          state = ${state},
          zip_code = ${zip_code},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${customerId}
    `

    return NextResponse.json({
      customer: {
        id: customerId,
        email: current.email,
        name,
        phone,
        address,
        city,
        state,
        zip_code,
      },
    })
  } catch (error) {
    console.error("[Customer profile] PATCH:", error)
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
  }
}
