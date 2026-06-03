import { sql, isDbAvailable } from "./db"

/**
 * Executa uma query SQL com tratamento de erro
 * Retorna array vazio se o banco não estiver disponível
 */
export async function safeQuery<T = any>(queryFn: () => Promise<T[]>): Promise<T[]> {
  if (!isDbAvailable() || !sql) {
    console.warn("[DB] Database not available, returning empty array")
    return []
  }

  try {
    return await queryFn()
  } catch (error) {
    console.error("[DB] Query error:", error)
    return []
  }
}

/**
 * Executa uma query SQL que retorna um único item
 * Retorna null se o banco não estiver disponível ou se não encontrar
 */
export async function safeQueryOne<T = any>(queryFn: () => Promise<T[]>): Promise<T | null> {
  if (!isDbAvailable() || !sql) {
    console.warn("[DB] Database not available, returning null")
    return null
  }

  try {
    const results = await queryFn()
    return results.length > 0 ? results[0] : null
  } catch (error) {
    console.error("[DB] Query error:", error)
    return null
  }
}

