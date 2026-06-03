import { Resend } from "resend"

// Inicializar Resend apenas se tiver API key (evita erro no build)
let resend: Resend | null = null
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY)
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: EmailOptions): Promise<boolean> {
  if (!resend || !process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY não configurado. Email não enviado.")
    return false
  }

  try {
    await resend.emails.send({
      from: from || process.env.EMAIL_FROM || "noreply@multivus.com.br",
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error("[Email] Erro ao enviar email:", error)
    return false
  }
}

// Templates de email
export const emailTemplates = {
  orderConfirmation: (
    orderNumber: string,
    customerName: string,
    total: number,
    options?: { orderUrl?: string; pixCopiaECola?: string | null }
  ) => {
    const site =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.FRONTEND_DOMAIN ||
      "https://multivus.shop"
    const orderUrl = options?.orderUrl || `${site.replace(/\/$/, "")}/pedido`
    const pixBlock = options?.pixCopiaECola?.trim()
      ? `<p><strong>Pague via Pix</strong> (copie no app do banco):</p>
         <p style="word-break:break-all;font-size:12px;background:#eee;padding:12px;border-radius:6px;">${options.pixCopiaECola}</p>
         <p>Após pagar, a confirmação é automática.</p>`
      : `<p>Nossa equipe entrará em contato sobre o pagamento.</p>`

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MULTIVUS - Pedido Confirmado</h1>
          </div>
          <div class="content">
            <p>Olá ${customerName},</p>
            <p>Seu pedido <strong>#${orderNumber}</strong> foi confirmado com sucesso!</p>
            <p>Valor total: <strong>R$ ${total.toFixed(2).replace(".", ",")}</strong></p>
            <p><a href="${orderUrl}">Acompanhar pedido e pagar</a></p>
            ${pixBlock}
            <p>Obrigado por escolher a MULTIVUS!</p>
          </div>
          <div class="footer">
            <p>MULTIVUS - Soluções em Informática</p>
          </div>
        </div>
      </body>
    </html>
  `
  },

  serviceRequestConfirmation: (customerName: string, serviceType: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MULTIVUS - Solicitação Recebida</h1>
          </div>
          <div class="content">
            <p>Olá ${customerName},</p>
            <p>Sua solicitação de <strong>${serviceType}</strong> foi recebida com sucesso!</p>
            <p>Nossa equipe entrará em contato em breve.</p>
            <p>Obrigado por escolher a MULTIVUS!</p>
          </div>
        </div>
      </body>
    </html>
  `,

  contactConfirmation: (customerName: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MULTIVUS - Mensagem Recebida</h1>
          </div>
          <div class="content">
            <p>Olá ${customerName},</p>
            <p>Sua mensagem foi recebida com sucesso!</p>
            <p>Responderemos em breve.</p>
            <p>Obrigado por entrar em contato com a MULTIVUS!</p>
          </div>
        </div>
      </body>
    </html>
  `,

  adminNotification: (type: string, details: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nova ${type} - MULTIVUS</h1>
          </div>
          <div class="content">
            <p>Uma nova ${type} foi recebida no sistema.</p>
            <p>${details}</p>
            <p><a href="${process.env.FRONTEND_DOMAIN || 'http://localhost:3000'}/admin">Acessar painel admin</a></p>
          </div>
        </div>
      </body>
    </html>
  `,
}

