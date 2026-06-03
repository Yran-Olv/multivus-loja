import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"
import { formatPhoneNumber } from "@/lib/whatsapp"

/**
 * POST /api/whatsapp/send-text
 * Envia mensagem de texto via WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { number, body: messageBody, userId, queueId, sendSignature = true, closeTicket = false } = body

    if (!number || !messageBody) {
      return NextResponse.json(
        { error: "Número e mensagem são obrigatórios" },
        { status: 400 }
      )
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Buscar configuração ativa
    const configs = await sql!`
      SELECT token, endpoint, user_id, queue_id
      FROM whatsapp_config
      WHERE is_active = true
      ORDER BY id DESC
      LIMIT 1
    `

    if (configs.length === 0) {
      return NextResponse.json(
        { error: "WhatsApp não configurado. Configure no painel administrativo." },
        { status: 400 }
      )
    }

    const config = configs[0]
    const formattedNumber = formatPhoneNumber(number)

    // Preparar payload
    // Não incluir userId e queueId se estiverem vazios (a API não aceita string vazia)
    const payload: {
      number: string
      body: string
      userId?: string
      queueId?: string
      sendSignature: boolean
      closeTicket: boolean
    } = {
      number: formattedNumber,
      body: messageBody,
      sendSignature: sendSignature,
      closeTicket: closeTicket,
    }

    // Adicionar userId e queueId apenas se tiverem valor válido
    const finalUserId = userId || config.user_id
    if (finalUserId && finalUserId.trim() !== "") {
      payload.userId = finalUserId
    }

    const finalQueueId = queueId || config.queue_id
    if (finalQueueId && finalQueueId.trim() !== "") {
      payload.queueId = finalQueueId
    }

    // Enviar para API externa
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[WhatsApp] Error sending message:", errorText)
      return NextResponse.json(
        { error: "Erro ao enviar mensagem via WhatsApp", details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Mensagem enviada com sucesso",
      data,
    })
  } catch (error) {
    console.error("[API] Error sending WhatsApp message:", error)
    return NextResponse.json(
      { error: "Erro ao enviar mensagem via WhatsApp" },
      { status: 500 }
    )
  }
}

