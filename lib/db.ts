import postgres from "postgres"

// Validação das variáveis de ambiente do banco de dados
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

let sql: ReturnType<typeof postgres> | null = null

if (missingVars.length > 0) {
  console.warn(`[DB] Missing required database environment variables: ${missingVars.join(', ')}`)
  console.warn(`[DB] Database features will be disabled. Please configure .env file.`)
} else {
  try {
    // Construir a string de conexão PostgreSQL
    const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

    // Criar instância do cliente PostgreSQL
    const poolMax = Math.min(Math.max(parseInt(process.env.DB_POOL_MAX || "3", 10) || 3, 1), 10)

    sql = postgres(connectionString, {
      max: poolMax,
      idle_timeout: 20,
      connect_timeout: 10,
      max_lifetime: 60 * 30,
      onnotice: () => {},
    })
    console.log(`[DB] Connected to PostgreSQL: ${process.env.DB_NAME}`)
  } catch (error) {
    console.error(`[DB] Failed to connect to database:`, error)
    console.warn(`[DB] Database features will be disabled.`)
  }
}

// Exportar sql com fallback para evitar erros
export { sql }

// Helper function to handle database errors
export function handleDbError(error: unknown): never {
  console.error("[DB] Database error:", error)
  throw new Error("Database operation failed")
}

// Helper function to check if database is available
export function isDbAvailable(): boolean {
  return sql !== null
}

// Types for our database models
export interface Product {
  id: number
  name: string
  description: string | null
  category: string
  price: number
  image_url: string | null
  stock_quantity: number
  specifications: Record<string, string> | null
  warranty: string | null
  delivery: string | null
  support: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Service {
  id: number
  name: string
  description: string
  icon: string | null
  features: string[] | null
  price_from: number | null
  is_active: boolean
  created_at: Date
}

export interface ServiceRequest {
  id: number
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string | null
  service_type: string
  device_info: string | null
  problem_description: string | null | null
  priority: "low" | "normal" | "high" | "urgent"
  status: "pending" | "in_progress" | "completed" | "cancelled"
  estimated_cost: number | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

export interface ContactMessage {
  id: number
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: "new" | "read" | "responded"
  created_at: Date
}

export interface Software {
  id: number
  name: string
  description: string
  short_description: string | null
  version: string | null
  icon: string | null
  features: string[]
  screenshots: string[] | null
  download_url: string | null
  documentation_url: string | null
  price: number | null
  is_free: boolean
  is_featured: boolean
  category: string | null
  platform: string | null
  system_requirements: Record<string, string> | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}
