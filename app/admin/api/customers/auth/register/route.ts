import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { z } from "zod"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { addSecurityHeaders, getClientIP, logSecurityEvent } from "@/lib/security"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-min-32-chars")

const registerSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(255),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  phone: z.string().min(10, "Telefone inválido").max(50),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  address: z.string().min(5, "Informe o endereço completo"),
  city: z.string().min(2, "Informe a cidade"),
  state: z.string().length(2, "UF deve ter 2 letras"),
  zip_code: z.string().min(8, "CEP inválido"),
})

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const url = request.url
  const timestamp = new Date().toISOString()
  
  console.log("[CUSTOMER-AUTH-REGISTER] Iniciando registro - IP:", clientIP, "URL:", url, "Timestamp:", timestamp)
  
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 3 }) // 3 registros por minuto

    if (!limit.allowed) {
      console.log("[CUSTOMER-AUTH-REGISTER] Rate limit excedido - IP:", clientIP)
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em alguns instantes." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const validationResult = registerSchema.safeParse(body)
    
    console.log("[CUSTOMER-AUTH-REGISTER] Dados recebidos - Email:", body.email ? body.email.substring(0, 3) + "***" : "não fornecido", "Name:", body.name ? body.name.substring(0, 3) + "***" : "não fornecido")

    if (!validationResult.success) {
      console.log("[CUSTOMER-AUTH-REGISTER] Validação falhou - Erros:", validationResult.error.errors)
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, email, phone, password, address, city, state, zip_code } = validationResult.data
    const stateUpper = state.toUpperCase()

    // Verificar se email já existe
    if (!sql) {
      console.error("[CUSTOMER-AUTH-REGISTER] Database não disponível")
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const existing = await sql!`
      SELECT id FROM customers WHERE email = ${email} LIMIT 1
    `

    if (existing.length > 0) {
      console.log("[CUSTOMER-AUTH-REGISTER] Email já cadastrado - Email:", email)
      return NextResponse.json({ error: "Email já cadastrado. Faça login ou use outro email." }, { status: 400 })
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    // Criar cliente
    console.log("[CUSTOMER-AUTH-REGISTER] Criando cliente - Email:", email, "Name:", name)

    const result = await sql!`
      INSERT INTO customers (name, email, phone, password_hash, address, city, state, zip_code, is_active)
      VALUES (${name}, ${email}, ${phone}, ${passwordHash}, ${address}, ${city}, ${stateUpper}, ${zip_code}, true)
      RETURNING id, email, name, phone, address, city, state, zip_code
    `

    const customer = result[0]
    console.log("[CUSTOMER-AUTH-REGISTER] Cliente criado com sucesso - ID:", customer.id, "Email:", customer.email)

    // Criar JWT token
    const token = await new SignJWT({
      id: customer.id,
      email: customer.email,
      type: "customer",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret)

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
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
    })

    // Configurar cookie
    // Em produção com HTTPS, usar secure: true
    // Em desenvolvimento ou HTTP, usar secure: false
    const isProduction = process.env.NODE_ENV === "production"
    const isHttps = url.startsWith("https://")
    const useSecure = isProduction && isHttps
    
    console.log("[CUSTOMER-AUTH-REGISTER] Configurando cookie - Secure:", useSecure, "Production:", isProduction, "HTTPS:", isHttps)
    
    response.cookies.set("customer-token", token, {
      httpOnly: true,
      secure: useSecure, // Apenas secure se for HTTPS em produção
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    })

    console.log("[CUSTOMER-AUTH-REGISTER] Cookie configurado com sucesso")
    return addSecurityHeaders(response)
  } catch (error) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { error: String(error) }
    
    console.error("[CUSTOMER-AUTH-REGISTER] Erro ao processar registro - IP:", clientIP, "URL:", url, "Timestamp:", timestamp, "Erro:", JSON.stringify(errorDetails))
    console.error("[CUSTOMER-AUTH-REGISTER] Stack trace completo:", error)
    
    logSecurityEvent("suspicious", clientIP, { 
      error: "customer_register_exception",
      errorDetails,
      url,
      timestamp
    })
    
    return NextResponse.json({ error: "Erro ao criar conta" }, { status: 500 })
  }
}

