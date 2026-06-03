import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"

export const dynamic = "force-dynamic"

/**
 * GET /api/whatsapp-config
 * Busca configuração do WhatsApp
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const configs = await sql!`
      SELECT id, endpoint, user_id, queue_id, is_active
      FROM whatsapp_config
      WHERE is_active = true
      ORDER BY id DESC
      LIMIT 1
    `

    if (configs.length === 0) {
      return NextResponse.json({ config: null })
    }

    // Não retornar o token por segurança
    return NextResponse.json({ config: configs[0] })
  } catch (error: any) {
    console.error("[API] Error fetching WhatsApp config:", error)
    
    // Verificar se é erro de tabela não encontrada
    if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "Tabela whatsapp_config não encontrada. Execute a migration: npm run db:migrate",
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Erro ao buscar configuração",
        details: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whatsapp-config
 * Salva configuração do WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { token, endpoint, user_id, queue_id } = body

    if (!token || !endpoint) {
      return NextResponse.json(
        { error: "Token e endpoint são obrigatórios" },
        { status: 400 }
      )
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Desativar todas as configurações anteriores (garantir apenas uma ativa)
    await sql!`
      UPDATE whatsapp_config
      SET is_active = false
      WHERE is_active = true
    `

    // Verificar se já existe uma configuração (mesmo que inativa) para atualizar
    const existingConfigs = await sql!`
      SELECT id FROM whatsapp_config 
      ORDER BY id DESC 
      LIMIT 1
    `

    if (existingConfigs.length > 0) {
      // Atualizar configuração existente e reativar
      const result = await sql!`
        UPDATE whatsapp_config
        SET token = ${token},
            endpoint = ${endpoint},
            user_id = ${user_id || null},
            queue_id = ${queue_id || null},
            is_active = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingConfigs[0].id}
        RETURNING id, endpoint, user_id, queue_id, is_active
      `
      
      return NextResponse.json({
        success: true,
        config: result[0],
        message: "Configuração atualizada com sucesso",
      })
    } else {
      // Inserir nova configuração
      const result = await sql!`
        INSERT INTO whatsapp_config (token, endpoint, user_id, queue_id, is_active)
        VALUES (${token}, ${endpoint}, ${user_id || null}, ${queue_id || null}, true)
        RETURNING id, endpoint, user_id, queue_id, is_active
      `

      return NextResponse.json({
        success: true,
        config: result[0],
        message: "Configuração salva com sucesso",
      })
    }

  } catch (error: any) {
    console.error("[API] Error saving WhatsApp config:", error)
    
    // Verificar se é erro de banco de dados
    if (error?.code === "42P07" || error?.message?.includes("does not exist")) {
      return NextResponse.json(
        { 
          error: "Tabela whatsapp_config não encontrada. Execute a migration: npm run db:migrate",
          details: error.message 
        },
        { status: 500 }
      )
    }
    
    if (error?.code === "23505" || error?.message?.includes("unique constraint")) {
      return NextResponse.json(
        { 
          error: "Já existe uma configuração ativa. Desative a anterior primeiro.",
          details: error.message 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Erro ao salvar configuração",
        details: error?.message || String(error)
      },
      { status: 500 }
    )
  }
}

