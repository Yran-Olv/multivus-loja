// Tratamento seguro de erros - não expõe informações sensíveis

import { NextResponse } from "next/server"
import { logSecurityEvent, getClientIP } from "./security"
import { NextRequest } from "next/server"

/**
 * Trata erros de forma segura, sem expor informações sensíveis
 */
export function handleError(
  error: unknown,
  request: NextRequest,
  context: string = "API"
): NextResponse {
  const clientIP = getClientIP(request)
  const isProduction = process.env.NODE_ENV === "production"

  // Log do erro completo (apenas no servidor)
  console.error(`[${context}] Error:`, error)

  // Log de segurança
  logSecurityEvent("suspicious", clientIP, {
    reason: "error_occurred",
    context,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
  })

  // Em produção, não expor detalhes do erro
  if (isProduction) {
    return NextResponse.json(
      { error: "Erro interno do servidor. Tente novamente mais tarde." },
      { status: 500 }
    )
  }

  // Em desenvolvimento, mostrar mais detalhes
  return NextResponse.json(
    {
      error: "Erro ao processar requisição",
      details: error instanceof Error ? error.message : String(error),
    },
    { status: 500 }
  )
}

/**
 * Valida se um erro é um erro de banco de dados conhecido
 */
export function isDatabaseError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes("database") ||
      message.includes("connection") ||
      message.includes("sql") ||
      message.includes("postgres")
    )
  }
  return false
}

/**
 * Valida se um erro é um erro de validação
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === "ZodError" || error.message.includes("validation")
  }
  return false
}

