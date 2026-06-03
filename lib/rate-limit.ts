// Rate limiting simples usando Map em memória
// Em produção, use Redis ou serviço dedicado

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  windowMs: number // Janela de tempo em milissegundos
  maxRequests: number // Número máximo de requisições
}

export function rateLimit(identifier: string, options: RateLimitOptions = { windowMs: 60000, maxRequests: 10 }): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Nova janela de tempo
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    })
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs,
    }
  }

  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

export function getClientIdentifier(request: Request): string {
  // Tenta obter IP do cliente
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0] || realIp || "unknown"
  
  // Combina IP com user-agent para melhor identificação
  const userAgent = request.headers.get("user-agent") || "unknown"
  return `${ip}-${userAgent.slice(0, 50)}`
}

