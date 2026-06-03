import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"
import { formatPhoneNumber } from "@/lib/whatsapp"

/**
 * POST /api/whatsapp/send-media
 * Envia mensagem com mídia via WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      number,
      body: messageBody,
      mediaBase64,
      userId,
      queueId,
      sendSignature = true,
      closeTicket = false,
    } = body

    if (!number || !messageBody || !mediaBase64) {
      return NextResponse.json(
        { error: "Número, mensagem e mídia são obrigatórios" },
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
    const payload = {
      number: formattedNumber,
      body: messageBody,
      medias: mediaBase64, // A API externa espera base64
      userId: userId || config.user_id || undefined,
      queueId: queueId || config.queue_id || undefined,
      sendSignature: sendSignature,
      closeTicket: closeTicket,
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
      console.error("[WhatsApp] Error sending media:", errorText)
      return NextResponse.json(
        { error: "Erro ao enviar mídia via WhatsApp", details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Mídia enviada com sucesso",
      data,
    })
  } catch (error) {
    console.error("[API] Error sending WhatsApp media:", error)
    return NextResponse.json(
      { error: "Erro ao enviar mídia via WhatsApp" },
      { status: 500 }
    )
  }
}

