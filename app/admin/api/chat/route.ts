import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { z } from "zod"
import { sanitizeString } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

const messageSchema = z.object({
  session_id: z.string(),
  sender_type: z.enum(["customer", "admin"]),
  sender_name: z.string().min(1),
  sender_email: z.string().email().optional(),
  message: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 10000, maxRequests: 10 }) // 10 mensagens por 10 segundos

    if (!limit.allowed) {
      return NextResponse.json({ error: "Muitas mensagens. Aguarde um momento." }, { status: 429 })
    }

    const body = await request.json()
    const validationResult = messageSchema.safeParse({
      ...body,
      message: sanitizeString(body.message),
      sender_name: sanitizeString(body.sender_name),
    })

    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.errors }, { status: 400 })
    }

    const { session_id, sender_type, sender_name, sender_email, message } = validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const safeSenderEmail = sender_email ?? null

    await sql!`
      INSERT INTO chat_messages (session_id, sender_type, sender_name, sender_email, message, is_read)
      VALUES (${session_id}, ${sender_type}, ${sender_name}, ${safeSenderEmail}, ${message}, false)
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error saving chat message:", error)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "session_id é obrigatório" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const messages = await sql!`
      SELECT * FROM chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
    `

    return NextResponse.json(messages)
  } catch (error) {
    console.error("[API] Error fetching chat messages:", error)
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 })
  }
}

