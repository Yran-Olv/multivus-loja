import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { serviceRequestSchema, sanitizeString } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { sendEmail, emailTemplates } from "@/lib/email"
import { sendServiceRequestNotification } from "@/lib/whatsapp-helpers"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 3 }) // 3 requisições por minuto

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns instantes." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()

    // Preparar dados - sanitizar apenas campos obrigatórios e não-nulos
    const validationResult = serviceRequestSchema.safeParse({
      customer_name: sanitizeString(body.customer_name || ""),
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      customer_address: body.customer_address || undefined, // Deixar schema tratar
      service_type: sanitizeString(body.service_type || ""),
      device_info: body.device_info || undefined, // Deixar schema tratar
      problem_description: body.problem_description || undefined, // Deixar schema tratar
      priority: body.priority || "normal",
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Por favor, verifique os dados informados", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { customer_name, customer_email, customer_phone, customer_address, service_type, device_info, problem_description, priority } =
      validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Garantir que valores undefined sejam null
    const safeCustomerAddress = customer_address ?? null
    const safeDeviceInfo = device_info ?? null
    const safeProblemDescription = problem_description ?? null

    // Insert into database
    let requestId: number
    try {
      const result = await sql!`
        INSERT INTO service_requests (
          customer_name, 
          customer_email, 
          customer_phone, 
          customer_address,
          service_type, 
          device_info, 
          problem_description, 
          priority,
          status
        )
        VALUES (
          ${customer_name}, 
          ${customer_email}, 
          ${customer_phone}, 
          ${safeCustomerAddress},
          ${service_type}, 
          ${safeDeviceInfo}, 
          ${safeProblemDescription}, 
          ${priority},
          'pending'
        )
        RETURNING id
      `
      
      if (!result || result.length === 0 || !result[0]?.id) {
        console.error("[Service Request] Erro: ID não retornado da inserção")
        return NextResponse.json(
          { error: "Não foi possível criar sua solicitação. Por favor, tente novamente." },
          { status: 500 }
        )
      }
      
      requestId = result[0].id as number
    } catch (dbError) {
      console.error("[Service Request] Erro ao inserir no banco de dados:", dbError)
      return NextResponse.json(
        { error: "Não foi possível salvar sua solicitação. Por favor, tente novamente em alguns instantes." },
        { status: 500 }
      )
    }

    // Enviar email de confirmação (não bloqueia se falhar)
    sendEmail({
      to: customer_email,
      subject: `Solicitação recebida: ${service_type}`,
      html: emailTemplates.serviceRequestConfirmation(customer_name, service_type),
    }).catch((error) => {
      console.error("[Service Request] Erro ao enviar email de confirmação:", error)
      // Não falhar a requisição se o email falhar
    })

    // Notificar admin (não bloqueia se falhar)
    if (process.env.EMAIL_FROM) {
      sendEmail({
        to: process.env.EMAIL_FROM,
        subject: `Nova solicitação de serviço: ${service_type}`,
        html: emailTemplates.adminNotification(
          "solicitação de serviço",
          `Cliente: ${customer_name} (${customer_email})<br>Tipo: ${service_type}<br>Prioridade: ${priority}`
        ),
      }).catch((error) => {
        console.error("[Service Request] Erro ao enviar email para admin:", error)
        // Não falhar a requisição se o email falhar
      })
    }

    // Enviar notificação via WhatsApp (não bloqueia se falhar)
    if (customer_phone) {
      console.log("[Service Request] Enviando notificação WhatsApp:", {
        requestId: requestId,
        customerName: customer_name,
        customerPhone: customer_phone,
        serviceType: service_type,
      })
      
      sendServiceRequestNotification(
        requestId,
        customer_name,
        customer_phone,
        service_type,
        device_info,
        problem_description,
        priority,
        customer_address
      )
        .then(() => {
          console.log("[Service Request] WhatsApp enviado com sucesso")
        })
        .catch((error) => {
          console.error("[Service Request] Erro ao enviar notificação WhatsApp:", {
            error: error.message,
            stack: error.stack,
          })
          // Não falhar a requisição se o WhatsApp falhar
        })
    } else {
      console.log("[Service Request] Telefone não fornecido, pulando envio WhatsApp")
    }

    return NextResponse.json(
      { success: true, id: requestId },
      {
        status: 200,
        headers: {
          "X-RateLimit-Limit": "3",
          "X-RateLimit-Remaining": limit.remaining.toString(),
          "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
        },
      }
    )
  } catch (error) {
    console.error("[API] Error saving service request:", error)
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes." },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const email = searchParams.get("email")

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Se email fornecido, permitir busca sem autenticação (área do cliente)
    if (email) {
      const requests = await sql!`
        SELECT * FROM service_requests 
        WHERE customer_email = ${email}
        ORDER BY created_at DESC
      `
      return NextResponse.json(requests, { status: 200 })
    }

    // Caso contrário, requer autenticação (admin)
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    let query
    if (status) {
      query = sql!`
        SELECT * FROM service_requests 
        WHERE status = ${status}
        ORDER BY created_at DESC
      `
    } else {
      query = sql!`
        SELECT * FROM service_requests 
        ORDER BY created_at DESC
      `
    }

    const requests = await query

    return NextResponse.json(requests, { status: 200 })
  } catch (error) {
    console.error("[API] Error fetching service requests:", error)
    return NextResponse.json({ error: "Erro ao buscar solicitações" }, { status: 500 })
  }
}
