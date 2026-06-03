import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { addSecurityHeaders, getClientIP, validateOrigin, logSecurityEvent } from "@/lib/security"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-min-32-chars")

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const hostname = request.headers.get("host") || ""
  const clientIP = getClientIP(request)

  // Rate limiting global para APIs (exceto webhooks e rotas de autenticação)
  if ((pathname.startsWith("/api") || pathname.startsWith("/admin/api")) && 
      !pathname.includes("/webhook") && 
      !pathname.startsWith("/admin/api/auth/")) {
    const { rateLimit, getClientIdentifier } = await import("@/lib/rate-limit")
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 100 }) // 100 req/min global

    if (!limit.allowed) {
      logSecurityEvent("rate_limit", clientIP, { endpoint: pathname })
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns instantes." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
          },
        }
      )
    }
  }

  // Validar origem em produção (CORS básico)
  // Permitir rotas de autenticação sem validação de origem
  if (process.env.NODE_ENV === "production" && 
      (pathname.startsWith("/api") || pathname.startsWith("/admin/api")) &&
      !pathname.startsWith("/admin/api/auth/")) {
    if (!validateOrigin(request)) {
      logSecurityEvent("suspicious", clientIP, { reason: "invalid_origin", pathname })
      return NextResponse.json({ error: "Origem não permitida" }, { status: 403 })
    }
  }

  // Proteção contra path traversal em APIs
  if ((pathname.startsWith("/api") || pathname.startsWith("/admin/api")) && 
      (pathname.includes("..") || pathname.includes("//"))) {
    logSecurityEvent("suspicious", clientIP, { reason: "path_traversal_attempt", pathname })
    return NextResponse.json({ error: "Caminho inválido" }, { status: 400 })
  }
  
  // Detectar se está acessando pelo domínio admin configurado
  // Permite configurar domínios personalizados via variáveis de ambiente
  const adminDomain = process.env.ADMIN_DOMAIN || ""
  const adminDomains = process.env.ADMIN_DOMAINS?.split(",").map(d => d.trim()).filter(Boolean) || []
  
  // Verificar se o hostname corresponde a algum domínio admin configurado
  let isAdminDomain = false
  
  if (adminDomain) {
    // Suporta domínio completo ou apenas o hostname (sem porta)
    const hostnameWithoutPort = hostname.split(":")[0]
    isAdminDomain = hostname === adminDomain || 
                   hostnameWithoutPort === adminDomain ||
                   hostname.startsWith(adminDomain)
  }
  
  // Verificar lista de domínios admin
  if (!isAdminDomain && adminDomains.length > 0) {
    const hostnameWithoutPort = hostname.split(":")[0]
    isAdminDomain = adminDomains.some(domain => 
      hostname === domain || 
      hostnameWithoutPort === domain ||
      hostname.startsWith(domain)
    )
  }
  
  // Fallback: detectar subdomínio "admin" se nenhum domínio estiver configurado
  if (!isAdminDomain && !adminDomain && adminDomains.length === 0) {
    isAdminDomain = hostname.startsWith("admin.") || 
                   !!hostname.match(/^admin\./) ||
                   hostname.includes("admin.localhost")
  }
  
  // Se estiver no domínio admin e não estiver em /admin, redirecionar
  if (isAdminDomain && !pathname.startsWith("/admin")) {
    const adminPath = pathname === "/" ? "/admin/dashboard" : `/admin${pathname}`
    const adminUrl = new URL(adminPath, request.url)
    // Preservar query params se houver
    request.nextUrl.searchParams.forEach((value, key) => {
      adminUrl.searchParams.set(key, value)
    })
    return NextResponse.redirect(adminUrl)
  }
  
  // Permitir acesso à página de login sem autenticação
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next()
  }

  // Permitir acesso às rotas de API do admin sem autenticação (login, etc)
  if (pathname.startsWith("/admin/api/auth/")) {
    return NextResponse.next()
  }

  // Permitir acesso às rotas públicas de API (que são mapeadas para /admin/api/* via rewrite)
  // Essas rotas não requerem autenticação de admin
  // Também verificar rotas /api/* que serão reescritas para /admin/api/*
  const publicApiRoutes = [
    "/admin/api/service-requests", // POST público, GET com email
    "/admin/api/software-request", // POST público
    "/admin/api/contact", // POST público
    "/admin/api/chat", // POST público
    "/admin/api/search", // GET público
    "/admin/api/orders", // POST público, GET com email
    "/admin/api/reviews", // POST público
    "/admin/api/efi/create-payment", // POST público
    "/admin/api/efi/webhook", // POST público (webhook)
    "/admin/api/stripe/create-checkout", // POST público
    "/admin/api/stripe/webhook", // POST público (webhook)
    "/admin/api/customers/auth", // Rotas públicas de autenticação de clientes
    "/admin/api/customers/send-whatsapp", // POST público (requer auth de cliente)
    // Rotas /api/* que serão reescritas (verificar antes do rewrite)
    "/api/service-requests",
    "/api/software-request",
    "/api/contact",
    "/api/chat",
    "/api/search",
    "/api/orders",
    "/api/reviews",
    "/api/efi/create-payment",
    "/api/efi/webhook",
    "/api/stripe/create-checkout",
    "/api/stripe/webhook",
    "/api/customers/auth",
    "/api/customers/send-whatsapp", // Rota reescrita
  ]
  
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
  
  // Se for rota pública de API, permitir sem autenticação de admin
  if (isPublicApiRoute) {
    return NextResponse.next()
  }
  
  // Rotas de API que requerem autenticação de admin (tanto /api/* quanto /admin/api/*)
  // Essas rotas são protegidas - verificar autenticação antes de permitir
  const protectedApiRoutes = [
    "/admin/api/blog", // Todas as rotas de blog requerem auth (exceto GET público)
    "/admin/api/efi-config", // Configuração requer auth
    "/admin/api/whatsapp-config", // Configuração requer auth
    "/admin/api/upload", // Upload requer auth
    "/admin/api/whatsapp", // WhatsApp requer auth
    "/api/blog", // Rota reescrita
    "/api/efi-config", // Rota reescrita
    "/api/whatsapp-config", // Rota reescrita
    "/api/upload", // Rota reescrita
  ]
  
  const isProtectedApiRoute = protectedApiRoutes.some(route => pathname.startsWith(route))
  
  // Se for rota protegida de API, verificar autenticação
  if (isProtectedApiRoute) {
    const token = request.cookies.get("auth-token")?.value
    
    if (!token) {
      // Para rotas de API, retornar 401 em vez de redirecionar
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    
    try {
      await jwtVerify(token, secret)
      // Token válido, permitir acesso (a rota ainda pode verificar novamente se necessário)
      return NextResponse.next()
    } catch (error) {
      logSecurityEvent("suspicious", clientIP, { reason: "invalid_token", pathname })
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }
  }

  // Proteger todas as outras rotas /admin/* (exceto API de autenticação e rotas públicas)
  // As rotas de API admin (/api/* reescritas para /admin/api/*) já foram verificadas acima
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      await jwtVerify(token, secret)
    } catch (error) {
      logSecurityEvent("suspicious", clientIP, { reason: "invalid_token", pathname })
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("from", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Adicionar headers de segurança a todas as respostas
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (arquivos estáticos de upload - servidos diretamente pelo Nginx)
     * - arquivos estáticos (imagens, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}

