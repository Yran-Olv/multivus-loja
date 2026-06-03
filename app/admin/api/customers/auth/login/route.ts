import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import {
  getClientIP,
  recordFailedLogin,
  clearLoginAttempts,
  isIPBlocked,
  addSecurityHeaders,
  logSecurityEvent,
} from "@/lib/security"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-min-32-chars")

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const url = request.url
  const timestamp = new Date().toISOString()
  
  console.log("[CUSTOMER-AUTH-LOGIN] Iniciando login - IP:", clientIP, "URL:", url, "Timestamp:", timestamp)
  
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 5 }) // 5 tentativas por minuto

    if (!limit.allowed) {
      console.log("[CUSTOMER-AUTH-LOGIN] Rate limit excedido - IP:", clientIP)
      logSecurityEvent("rate_limit", clientIP, { endpoint: "/api/customers/auth/login" })
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em alguns instantes." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
          },
        }
      )
    }

    // Verificar se IP está bloqueado
    if (isIPBlocked(clientIP)) {
      console.log("[CUSTOMER-AUTH-LOGIN] IP bloqueado - IP:", clientIP)
      logSecurityEvent("blocked", clientIP, { endpoint: "/api/customers/auth/login" })
      return NextResponse.json(
        { error: "Acesso temporariamente bloqueado. Tente novamente mais tarde." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password } = body
    
    console.log("[CUSTOMER-AUTH-LOGIN] Tentativa de login - Email:", email ? email.substring(0, 3) + "***" : "não fornecido", "IP:", clientIP)

    if (!email || !password) {
      console.log("[CUSTOMER-AUTH-LOGIN] Dados incompletos - Email:", !!email, "Password:", !!password)
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Buscar cliente por email
    if (!sql) {
      console.error("[CUSTOMER-AUTH-LOGIN] Database não disponível")
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const customers = await sql!`
      SELECT id, email, name, phone, password_hash, is_active
      FROM customers
      WHERE email = ${email.toLowerCase().trim()} AND is_active = true
      LIMIT 1
    `

    if (customers.length === 0) {
      console.log("[CUSTOMER-AUTH-LOGIN] Cliente não encontrado - Email:", email)
      const result = recordFailedLogin(clientIP)
      logSecurityEvent("failed_login", clientIP, { email, remainingAttempts: result.remainingAttempts })
      
      if (result.blocked) {
        return NextResponse.json(
          { error: "Muitas tentativas falhadas. Acesso bloqueado por 15 minutos." },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: "Email ou senha inválidos", remainingAttempts: result.remainingAttempts },
        { status: 401 }
      )
    }

    const customer = customers[0]

    // Verificar senha
    if (!customer.password_hash) {
      const result = recordFailedLogin(clientIP)
      logSecurityEvent("failed_login", clientIP, { email, reason: "no_password_hash" })
      return NextResponse.json(
        { error: "Cliente não possui senha cadastrada. Faça o cadastro primeiro." },
        { status: 401 }
      )
    }

    const isValid = await bcrypt.compare(password, customer.password_hash)

    if (!isValid) {
      console.log("[CUSTOMER-AUTH-LOGIN] Senha inválida - Email:", email)
      const result = recordFailedLogin(clientIP)
      logSecurityEvent("failed_login", clientIP, { email, remainingAttempts: result.remainingAttempts })
      
      if (result.blocked) {
        return NextResponse.json(
          { error: "Muitas tentativas falhadas. Acesso bloqueado por 15 minutos." },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: "Email ou senha inválidos", remainingAttempts: result.remainingAttempts },
        { status: 401 }
      )
    }

    // Login bem-sucedido - limpar tentativas
    clearLoginAttempts(clientIP)
    console.log("[CUSTOMER-AUTH-LOGIN] Login bem-sucedido - Customer ID:", customer.id, "Email:", email)

    // Criar JWT token
    const token = await new SignJWT({
      id: customer.id,
      email: customer.email,
      type: "customer",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d") // 30 dias
      .sign(secret)

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
      },
    })

    // Configurar cookie
    // Em produção com HTTPS, usar secure: true
    // Em desenvolvimento ou HTTP, usar secure: false
    const isProduction = process.env.NODE_ENV === "production"
    const isHttps = url.startsWith("https://")
    const useSecure = isProduction && isHttps
    
    console.log("[CUSTOMER-AUTH-LOGIN] Configurando cookie - Secure:", useSecure, "Production:", isProduction, "HTTPS:", isHttps)
    
    response.cookies.set("customer-token", token, {
      httpOnly: true,
      secure: useSecure, // Apenas secure se for HTTPS em produção
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    })

    console.log("[CUSTOMER-AUTH-LOGIN] Cookie configurado com sucesso")
    return addSecurityHeaders(response)
  } catch (error) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { error: String(error) }
    
    console.error("[CUSTOMER-AUTH-LOGIN] Erro ao processar login - IP:", clientIP, "URL:", url, "Timestamp:", timestamp, "Erro:", JSON.stringify(errorDetails))
    console.error("[CUSTOMER-AUTH-LOGIN] Stack trace completo:", error)
    
    logSecurityEvent("suspicious", clientIP, { 
      error: "customer_login_exception",
      errorDetails,
      url,
      timestamp
    })
    
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 })
  }
}

