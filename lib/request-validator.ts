// Validador de requisições para segurança

import { NextRequest } from "next/server"
import { validatePayloadSize, getClientIP, logSecurityEvent } from "./security"

const MAX_JSON_PAYLOAD_SIZE = 1024 * 1024 // 1MB
const MAX_FORM_DATA_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Valida tamanho da requisição antes de processar
 */
export async function validateRequestSize(request: NextRequest): Promise<{
  valid: boolean
  error?: string
}> {
  const contentLength = request.headers.get("content-length")
  
  if (contentLength) {
    const size = parseInt(contentLength)
    
    // Verificar se é JSON ou FormData
    const contentType = request.headers.get("content-type") || ""
    
    if (contentType.includes("application/json")) {
      if (size > MAX_JSON_PAYLOAD_SIZE) {
        logSecurityEvent("suspicious", getClientIP(request), {
          reason: "payload_too_large",
          size,
          maxSize: MAX_JSON_PAYLOAD_SIZE,
        })
        return {
          valid: false,
          error: "Payload muito grande",
        }
      }
    } else if (contentType.includes("multipart/form-data")) {
      if (size > MAX_FORM_DATA_SIZE) {
        logSecurityEvent("suspicious", getClientIP(request), {
          reason: "form_data_too_large",
          size,
          maxSize: MAX_FORM_DATA_SIZE,
        })
        return {
          valid: false,
          error: "Dados do formulário muito grandes",
        }
      }
    }
  }

  return { valid: true }
}

/**
 * Valida e parse JSON de forma segura
 */
export async function safeJsonParse(request: NextRequest): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const text = await request.text()
    
    // Validar tamanho do texto
    if (text.length > MAX_JSON_PAYLOAD_SIZE) {
      return {
        success: false,
        error: "Payload muito grande",
      }
    }

    // Validar profundidade do JSON (prevenir JSON bomb)
    const depth = (text.match(/\{/g) || []).length
    if (depth > 100) {
      logSecurityEvent("suspicious", getClientIP(request), {
        reason: "json_depth_too_large",
        depth,
      })
      return {
        success: false,
        error: "JSON inválido",
      }
    }

    const data = JSON.parse(text)
    return { success: true, data }
  } catch (error) {
    logSecurityEvent("suspicious", getClientIP(request), {
      reason: "json_parse_error",
      error: String(error),
    })
    return {
      success: false,
      error: "JSON inválido",
    }
  }
}

/**
 * Sanitiza objeto recursivamente
 */
export function sanitizeObject(obj: any, maxDepth: number = 10, currentDepth: number = 0): any {
  if (currentDepth > maxDepth) {
    return null
  }

  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === "string") {
    return obj
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .replace(/data:/gi, "")
      .trim()
      .substring(0, 10000) // Limitar tamanho de strings
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj
      .slice(0, 1000) // Limitar arrays grandes
      .map((item) => sanitizeObject(item, maxDepth, currentDepth + 1))
  }

  if (typeof obj === "object") {
    const sanitized: any = {}
    const keys = Object.keys(obj).slice(0, 100) // Limitar número de propriedades
    
    for (const key of keys) {
      // Sanitizar chave
      const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "")
      if (safeKey) {
        sanitized[safeKey] = sanitizeObject(obj[key], maxDepth, currentDepth + 1)
      }
    }
    
    return sanitized
  }

  return obj
}

