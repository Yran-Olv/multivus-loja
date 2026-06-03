import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendSoftwareRequestNotification } from "@/lib/whatsapp-helpers"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      software_id,
      software_name,
      software_price,
      is_free,
      customer_name,
      customer_phone,
    } = body

    // Validação básica
    if (!software_id || !software_name || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: "Dados incompletos. Preencha todos os campos obrigatórios." },
        { status: 400 }
      )
    }

    // Enviar notificação via WhatsApp
    console.log("[Software Request] Enviando notificação WhatsApp:", {
      softwareId: software_id,
      softwareName: software_name,
      customerName: customer_name,
      customerPhone: customer_phone,
    })

    await sendSoftwareRequestNotification(
      software_id,
      software_name,
      software_price,
      is_free,
      customer_name,
      customer_phone
    )

    return NextResponse.json({
      success: true,
      message: "Solicitação enviada com sucesso. Você receberá uma mensagem no WhatsApp em instantes.",
    })
  } catch (error) {
    console.error("[Software Request API] Erro:", error)
    return NextResponse.json(
      {
        error: "Erro ao processar solicitação",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}

