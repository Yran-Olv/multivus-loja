import { NextRequest, NextResponse } from "next/server"
import { verifyCredentials } from "@/lib/auth"
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
  const timestamp = new Date().toISOString()
  const url = request.url
  
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 5 }) // 5 tentativas por minuto

    if (!limit.allowed) {
      const errorMsg = `[AUTH-LOGIN] Rate limit excedido - IP: ${clientIP}, URL: ${url}, Timestamp: ${timestamp}`
      console.error(errorMsg)
      logSecurityEvent("rate_limit", clientIP, { endpoint: "/admin/api/auth/login", url, timestamp })
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
      const errorMsg = `[AUTH-LOGIN] IP bloqueado - IP: ${clientIP}, URL: ${url}, Timestamp: ${timestamp}`
      console.error(errorMsg)
      logSecurityEvent("blocked", clientIP, { endpoint: "/admin/api/auth/login", url, timestamp })
      return NextResponse.json(
        { error: "Acesso temporariamente bloqueado. Tente novamente mais tarde." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      const errorMsg = `[AUTH-LOGIN] Campos obrigatórios ausentes - IP: ${clientIP}, URL: ${url}, Timestamp: ${timestamp}, Username fornecido: ${!!username}, Password fornecido: ${!!password}`
      console.error(errorMsg)
      return NextResponse.json({ error: "Username e senha são obrigatórios" }, { status: 400 })
    }

    const user = await verifyCredentials(username, password)

    if (!user) {
      const result = recordFailedLogin(clientIP)
      const errorMsg = `[AUTH-LOGIN] Credenciais inválidas - IP: ${clientIP}, Username: ${username}, Tentativas restantes: ${result.remainingAttempts}, URL: ${url}, Timestamp: ${timestamp}`
      console.error(errorMsg)
      logSecurityEvent("failed_login", clientIP, { 
        username, 
        remainingAttempts: result.remainingAttempts,
        url,
        timestamp 
      })
      
      if (result.blocked) {
        const blockedMsg = `[AUTH-LOGIN] IP bloqueado após múltiplas tentativas - IP: ${clientIP}, Username: ${username}, URL: ${url}, Timestamp: ${timestamp}`
        console.error(blockedMsg)
        return NextResponse.json(
          { error: "Muitas tentativas falhadas. Acesso bloqueado por 15 minutos." },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { error: "Credenciais inválidas", remainingAttempts: result.remainingAttempts },
        { status: 401 }
      )
    }

    // Login bem-sucedido - limpar tentativas
    clearLoginAttempts(clientIP)
    const successMsg = `[AUTH-LOGIN] Login bem-sucedido - IP: ${clientIP}, Username: ${user.username}, User ID: ${user.id}, URL: ${url}, Timestamp: ${timestamp}`
    console.log(successMsg)

    // Criar JWT token
    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret)

    // Criar resposta com cookie
    const response = NextResponse.json({ success: true, user: { id: user.id, username: user.username, email: user.email } })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 horas
      path: "/",
    })

    return addSecurityHeaders(response)
  } catch (error) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { error: String(error) }
    
    const errorMsg = `[AUTH-LOGIN] Erro ao processar login - IP: ${clientIP}, URL: ${url}, Timestamp: ${timestamp}, Erro: ${JSON.stringify(errorDetails)}`
    console.error(errorMsg)
    console.error("[AUTH-LOGIN] Stack trace completo:", error)
    
    logSecurityEvent("suspicious", clientIP, { 
      error: "login_exception",
      errorDetails,
      url,
      timestamp
    })
    
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 })
  }
}

