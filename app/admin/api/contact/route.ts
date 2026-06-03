import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { contactMessageSchema, sanitizeString } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { sendContactMessageNotification } from "@/lib/whatsapp-helpers"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 5 }) // 5 requisições por minuto

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns instantes." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()

    // Validar e sanitizar dados
    const validationResult = contactMessageSchema.safeParse({
      name: sanitizeString(body.name || ""),
      email: body.email,
      phone: body.phone || undefined, // Deixar schema tratar
      subject: sanitizeString(body.subject || ""),
      message: sanitizeString(body.message || ""),
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Por favor, verifique os dados informados e tente novamente",
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { name, email, phone, subject, message } = validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Preparar telefone: pode ser null ou string vazia após validação
    // Se for string vazia ou apenas números (sem código do país), ainda pode ser válido
    const safePhone = phone && phone.trim() !== "" ? phone : null
    let messageId: number = 0
    
    try {
      const result = await sql!`
        INSERT INTO contact_messages (name, email, phone, subject, message, status)
        VALUES (${name}, ${email}, ${safePhone}, ${subject}, ${message}, 'new')
        RETURNING id
      `
      
      if (result && result.length > 0 && result[0]?.id) {
        messageId = result[0].id
      } else {
        console.error("[Contact] Erro: ID não retornado após inserção")
        return NextResponse.json(
          { error: "Não foi possível salvar sua mensagem. Por favor, tente novamente." },
          { status: 500 }
        )
      }
    } catch (dbError) {
      console.error("[Contact] Erro ao inserir no banco de dados:", dbError)
      return NextResponse.json(
        { error: "Não foi possível salvar sua mensagem. Por favor, tente novamente em alguns instantes." },
        { status: 500 }
      )
    }

    // Enviar notificação via WhatsApp se telefone foi fornecido (não bloqueia se falhar)
    if (safePhone && safePhone.trim() !== "" && messageId > 0) {
      console.log("[Contact] Enviando notificação WhatsApp:", {
        messageId: messageId,
        customerName: name,
        customerPhone: phone,
        subject: subject,
      })

      // Formatar telefone antes de enviar (a validação já remove caracteres não numéricos)
      // Mas precisamos garantir que seja string
      const formattedPhone = typeof safePhone === "string" ? safePhone : String(safePhone)

      sendContactMessageNotification(
        messageId,
        name,
        email,
        formattedPhone,
        subject,
        message
      )
        .then(() => {
          console.log("[Contact] WhatsApp enviado com sucesso para:", formattedPhone)
        })
        .catch((error) => {
          console.error("[Contact] Erro ao enviar notificação WhatsApp:", {
            error: error.message,
            stack: error.stack,
            phone: formattedPhone,
          })
          // Não falhar a requisição se o WhatsApp falhar
        })
    } else {
      if (!safePhone || safePhone.trim() === "") {
        console.log("[Contact] Telefone não fornecido, pulando envio WhatsApp")
      } else if (messageId === 0) {
        console.log("[Contact] ID da mensagem não gerado, pulando envio WhatsApp")
      }
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": limit.remaining.toString(),
          "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
        },
      }
    )
  } catch (error) {
    console.error("[API] Error saving contact message:", error)
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes." },
      { status: 500 }
    )
  }
}
