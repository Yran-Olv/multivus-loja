import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { sendWhatsAppMessage } from "@/lib/whatsapp-helpers"

export const dynamic = "force-dynamic"

const resetPasswordSchema = z.object({
  code: z.string().length(6, "Código deve ter 6 dígitos"),
  new_password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "As senhas não coincidem",
  path: ["confirm_password"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validationResult = resetPasswordSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { code, new_password } = validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Buscar cliente pelo código
    const customers = await sql!`
      SELECT id, email, name, password_reset_code, password_reset_expires_at
      FROM customers
      WHERE password_reset_code = ${code}
        AND password_reset_expires_at > NOW()
        AND is_active = true
      LIMIT 1
    `

    if (customers.length === 0) {
      return NextResponse.json(
        { error: "Código inválido ou expirado. Solicite um novo código." },
        { status: 400 }
      )
    }

    const customer = customers[0]

    // Verificar se o código corresponde
    if (customer.password_reset_code !== code) {
      return NextResponse.json(
        { error: "Código inválido" },
        { status: 400 }
      )
    }

    // Verificar se não expirou
    const expiresAt = new Date(customer.password_reset_expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Código expirado. Solicite um novo código." },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(new_password, 10)

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Atualizar senha e limpar código
    await sql!`
      UPDATE customers
      SET password_hash = ${passwordHash},
          password_reset_code = NULL,
          password_reset_expires_at = NULL,
          updated_at = NOW()
      WHERE id = ${customer.id}
    `

    // Buscar telefone do cliente para enviar notificação
    const customerData = await sql!`
      SELECT phone FROM customers WHERE id = ${customer.id} LIMIT 1
    `

    // Enviar notificação via WhatsApp se tiver telefone
    if (customerData.length > 0 && customerData[0].phone) {
      const notificationMessage = `🔐 *Senha Alterada com Sucesso - MULTIVUS*

Olá *${customer.name}*!

Sua senha foi alterada com sucesso.

━━━━━━━━━━━━━━━━━━━━
✅ *CONFIRMAÇÃO*
━━━━━━━━━━━━━━━━━━━━

*Data/Hora:* ${new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}

*Email:* ${customer.email}

━━━━━━━━━━━━━━━━━━━━

⚠️ *IMPORTANTE:*
• Se você não realizou esta alteração, entre em contato conosco imediatamente
• Sua nova senha já está ativa
• Você pode fazer login normalmente

Para sua segurança, recomendamos:
• Não compartilhe sua senha
• Use uma senha forte e única
• Altere sua senha periodicamente

Se precisar de ajuda, estamos à disposição!

MULTIVUS 🚀`

      // Enviar WhatsApp (não bloqueia se falhar)
      sendWhatsAppMessage(customerData[0].phone, notificationMessage)
        .then(() => {
          console.log("[Password Reset] Notificação de alteração de senha enviada com sucesso")
        })
        .catch((error) => {
          console.error("[Password Reset] Erro ao enviar notificação WhatsApp:", error)
          // Não falhar a operação se o WhatsApp falhar
        })
    }

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso! Você já pode fazer login.",
    })
  } catch (error) {
    console.error("[Password Reset] Error:", error)
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 })
  }
}

