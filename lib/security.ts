// Utilitários de segurança para produção

import { NextRequest, NextResponse } from "next/server"

// Lista de IPs bloqueados com timestamp (em produção, use Redis ou banco de dados)
const blockedIPs = new Map<string, number>()

// Tentativas de login falhadas por IP
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

// Configurações de segurança
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutos
const MAX_REQUESTS_PER_MINUTE = 60

/**
 * Verifica se um IP está bloqueado (e remove se o bloqueio expirou)
 */
export function isIPBlocked(ip: string): boolean {
  const blockedAt = blockedIPs.get(ip)
  if (!blockedAt) return false
  
  // Verificar se o bloqueio expirou
  const now = Date.now()
  if (now - blockedAt > LOGIN_LOCKOUT_TIME) {
    // Bloqueio expirou, remover
    blockedIPs.delete(ip)
    loginAttempts.delete(ip)
    return false
  }
  
  return true
}

/**
 * Bloqueia um IP
 */
export function blockIP(ip: string): void {
  blockedIPs.set(ip, Date.now())
  console.warn(`[Security] IP bloqueado: ${ip} (expira em ${LOGIN_LOCKOUT_TIME / 60000} minutos)`)
}

/**
 * Desbloqueia um IP
 */
export function unblockIP(ip: string): void {
  blockedIPs.delete(ip)
  loginAttempts.delete(ip)
  console.log(`[Security] IP desbloqueado: ${ip}`)
}

/**
 * Desbloqueia todos os IPs (útil para administração)
 */
export function unblockAllIPs(): number {
  const count = blockedIPs.size
  blockedIPs.clear()
  loginAttempts.clear()
  console.log(`[Security] Todos os IPs foram desbloqueados (${count} IPs)`)
  return count
}

/**
 * Lista IPs bloqueados
 */
export function getBlockedIPs(): Array<{ ip: string; blockedAt: number; expiresAt: number }> {
  const now = Date.now()
  const result: Array<{ ip: string; blockedAt: number; expiresAt: number }> = []
  
  for (const [ip, blockedAt] of blockedIPs.entries()) {
    // Remover se expirou
    if (now - blockedAt > LOGIN_LOCKOUT_TIME) {
      blockedIPs.delete(ip)
      continue
    }
    
    result.push({
      ip,
      blockedAt,
      expiresAt: blockedAt + LOGIN_LOCKOUT_TIME,
    })
  }
  
  return result
}

/**
 * Registra uma tentativa de login falhada
 */
export function recordFailedLogin(ip: string): { blocked: boolean; remainingAttempts: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }

  // Reset se passou o tempo de lockout
  if (now - attempts.lastAttempt > LOGIN_LOCKOUT_TIME) {
    attempts.count = 0
  }

  attempts.count++
  attempts.lastAttempt = now
  loginAttempts.set(ip, attempts)

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    blockIP(ip)
    return { blocked: true, remainingAttempts: 0 }
  }

  return { blocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempts.count }
}

/**
 * Limpa tentativas de login bem-sucedidas
 */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip)
  unblockIP(ip)
}

/**
 * Obtém o IP real do cliente
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIP = request.headers.get("x-real-ip")
  const cfConnectingIP = request.headers.get("cf-connecting-ip") // Cloudflare

  if (cfConnectingIP) return cfConnectingIP
  if (forwarded) return forwarded.split(",")[0].trim()
  if (realIP) return realIP

  // Fallback - retornar "unknown" se nenhum header estiver disponível
  return "unknown"
}

/**
 * Valida origem da requisição (CORS básico)
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  // Em desenvolvimento, permitir localhost
  if (process.env.NODE_ENV === "development") {
    return true
  }

  // Lista de origens permitidas
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(o => o.trim()) || []
  const allowedDomain = process.env.NEXT_PUBLIC_DOMAIN || ""

  // Se não houver configuração, permitir requisições do mesmo domínio
  if (allowedOrigins.length === 0 && !allowedDomain) {
    return true
  }

  // Verificar origem
  if (origin) {
    if (allowedOrigins.includes(origin)) return true
    if (allowedDomain && origin.includes(allowedDomain)) return true
  }

  // Verificar referer
  if (referer) {
    if (allowedOrigins.some(o => referer.startsWith(o))) return true
    if (allowedDomain && referer.includes(allowedDomain)) return true
  }

  return false
}

/**
 * Adiciona headers de segurança à resposta
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  const isProduction = process.env.NODE_ENV === "production"

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")

  // Headers de segurança
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
  
  if (isProduction) {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
    response.headers.set("Content-Security-Policy", csp)
  }

  // Remover header X-Powered-By (já configurado no next.config.mjs)
  response.headers.delete("X-Powered-By")

  return response
}

/**
 * Valida tamanho do body da requisição
 */
export function validateBodySize(body: string, maxSize: number = 1024 * 1024): boolean {
  return Buffer.byteLength(body, "utf8") <= maxSize
}

/**
 * Sanitiza entrada de dados removendo caracteres perigosos
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove < e >
    .replace(/javascript:/gi, "") // Remove javascript:
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Remove data: URLs
    .replace(/vbscript:/gi, "") // Remove vbscript:
    .replace(/file:/gi, "") // Remove file: URLs
    .replace(/expression\(/gi, "") // Remove CSS expressions
    .trim()
}

/**
 * Sanitiza nome de arquivo removendo caracteres perigosos
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "") // Remove caracteres especiais
    .replace(/\.\./g, "") // Remove path traversal
    .replace(/^\.+/, "") // Remove pontos no início
    .substring(0, 255) // Limita tamanho
}

/**
 * Valida se um caminho é seguro (proteção contra path traversal)
 */
export function isSafePath(filepath: string, baseDir: string): boolean {
  const normalizedPath = require("path").normalize(filepath)
  const normalizedBase = require("path").normalize(baseDir)
  return normalizedPath.startsWith(normalizedBase)
}

/**
 * Valida magic bytes de arquivo (verifica tipo real do arquivo)
 */
export function validateMagicBytes(buffer: Buffer, expectedType: string): boolean {
  const magicBytes: Record<string, number[][]> = {
    "image/jpeg": [[0xff, 0xd8, 0xff]],
    "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
    "image/gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF (precisa verificar mais bytes)
  }

  const signatures = magicBytes[expectedType]
  if (!signatures) return false

  return signatures.some((signature) => {
    if (buffer.length < signature.length) return false
    return signature.every((byte, index) => buffer[index] === byte)
  })
}

/**
 * Valida tamanho de payload
 */
export function validatePayloadSize(size: number, maxSize: number = 1024 * 1024): boolean {
  return size <= maxSize
}

/**
 * Log de segurança com detalhes completos
 */
export function logSecurityEvent(
  type: "blocked" | "failed_login" | "suspicious" | "rate_limit",
  ip: string,
  details?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const logMessage = `[Security] ${timestamp} [${type}] IP: ${ip} ${details ? JSON.stringify(details, null, 2) : ""}`
  
  // Log no console (vai para os arquivos de log do PM2)
  console.warn(logMessage)
  
  // Log detalhado para erros
  if (type === "failed_login" || type === "blocked" || type === "suspicious") {
    console.error(`[Security-ERROR] ${timestamp} [${type}] IP: ${ip}`, details || "")
  }
  
  // Em produção, enviar para serviço de logging (Sentry, LogRocket, etc)
  if (process.env.NODE_ENV === "production" && process.env.SECURITY_LOG_WEBHOOK) {
    // Opcional: enviar para webhook de monitoramento
    fetch(process.env.SECURITY_LOG_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ip, timestamp, details }),
    }).catch(() => {
      // Ignorar erros de webhook
    })
  }
}

/**
 * Limpa dados antigos periodicamente (bloqueios expirados e tentativas antigas)
 */
setInterval(() => {
  const now = Date.now()
  
  // Limpar IPs bloqueados expirados
  for (const [ip, blockedAt] of blockedIPs.entries()) {
    if (now - blockedAt > LOGIN_LOCKOUT_TIME) {
      blockedIPs.delete(ip)
      console.log(`[Security] Bloqueio expirado para IP: ${ip}`)
    }
  }
  
  // Limpar tentativas antigas
  for (const [ip, attempts] of loginAttempts.entries()) {
    if (now - attempts.lastAttempt > LOGIN_LOCKOUT_TIME * 2) {
      loginAttempts.delete(ip)
    }
  }
}, 5 * 60 * 1000) // A cada 5 minutos

