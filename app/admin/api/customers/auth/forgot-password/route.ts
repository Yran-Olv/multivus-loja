import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { sendWhatsAppMessage } from "@/lib/whatsapp-helpers"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Buscar cliente por email
    const customers = await sql!`
      SELECT id, email, name, phone
      FROM customers
      WHERE email = ${email.toLowerCase().trim()} AND is_active = true
      LIMIT 1
    `

    if (customers.length === 0) {
      // Não revelar que o email não existe por segurança
      return NextResponse.json({
        success: true,
        message: "Se o email estiver cadastrado, você receberá um código de recuperação via WhatsApp.",
      })
    }

    const customer = customers[0]

    if (!customer.phone) {
      return NextResponse.json(
        { error: "Cliente não possui WhatsApp cadastrado. Entre em contato com o suporte." },
        { status: 400 }
      )
    }

    // Gerar código de 6 dígitos
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Definir expiração (15 minutos)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Salvar código no banco
    await sql!`
      UPDATE customers
      SET password_reset_code = ${resetCode},
          password_reset_expires_at = ${expiresAt}
      WHERE id = ${customer.id}
    `

    // Criar link de recuperação
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/cliente?reset=${resetCode}`

    // Enviar mensagem via WhatsApp
    const message = `🔐 *Recuperação de Senha - MULTIVUS*

Olá *${customer.name}*!

Você solicitou a recuperação de senha da sua conta.

━━━━━━━━━━━━━━━━━━━━
🔑 *CÓDIGO DE RECUPERAÇÃO*
━━━━━━━━━━━━━━━━━━━━

*Código:* ${resetCode}

Este código expira em *15 minutos*.

━━━━━━━━━━━━━━━━━━━━

🔗 *Link Direto:*
${resetLink}

━━━━━━━━━━━━━━━━━━━━

⚠️ *IMPORTANTE:*
• Não compartilhe este código com ninguém
• Se você não solicitou esta recuperação, ignore esta mensagem
• O código é válido por apenas 15 minutos

Se precisar de ajuda, entre em contato conosco.

MULTIVUS 🚀`

    // Enviar WhatsApp (não bloqueia se falhar, mas retorna erro se falhar)
    const whatsappResult = await sendWhatsAppMessage(customer.phone, message)

    if (!whatsappResult.success) {
      console.error("[Password Reset] Erro ao enviar WhatsApp:", whatsappResult.error)
      // Retornar erro, mas não bloquear totalmente - o código já foi salvo
      return NextResponse.json(
        { 
          error: "Código gerado, mas houve erro ao enviar via WhatsApp. Verifique se o WhatsApp está configurado corretamente.",
          details: whatsappResult.error 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Código de recuperação enviado para seu WhatsApp.",
    })
  } catch (error) {
    console.error("[Password Reset] Error:", error)
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
  }
}

