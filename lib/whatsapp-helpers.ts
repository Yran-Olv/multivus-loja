import { formatPhoneNumber } from "./whatsapp"
import { sql } from "./db"

/**
 * Envia mensagem de texto via WhatsApp
 * Usado internamente pelo sistema (não requer autenticação)
 */
export async function sendWhatsAppMessage(
  number: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[WhatsApp] Iniciando envio de mensagem para:", number)
    
    // Verificar se sql está disponível
    if (!sql) {
      console.error("[WhatsApp] Database não disponível")
      return { success: false, error: "Database não disponível" }
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
      console.warn("[WhatsApp] Configuração não encontrada no banco de dados")
      return { success: false, error: "WhatsApp não configurado. Configure no painel administrativo." }
    }

    const config = configs[0]
    
    if (!config.token || !config.endpoint) {
      console.error("[WhatsApp] Token ou endpoint não configurados:", {
        hasToken: !!config.token,
        hasEndpoint: !!config.endpoint,
      })
      return { success: false, error: "Token ou endpoint não configurados" }
    }

    // Validar se número foi fornecido
    if (!number || number.trim() === "") {
      console.error("[WhatsApp] Número de telefone não fornecido")
      return { success: false, error: "Número de telefone é obrigatório" }
    }

    // SEMPRE formatar o número (corrige qualquer formato incorreto)
    // A função formatPhoneNumber sempre corrige: remove máscaras, adiciona código do país, etc.
    const formattedNumber = formatPhoneNumber(number)
    
    console.log("[WhatsApp] Formatação de número:", {
      original: number,
      formatado: formattedNumber,
      comprimento: formattedNumber.length,
    })

    // Validar se conseguiu formatar
    if (!formattedNumber || formattedNumber.length === 0) {
      console.error("[WhatsApp] Não foi possível formatar o número:", number)
      return { 
        success: false, 
        error: `Número inválido: "${number}". Forneça um número válido com DDD.` 
      }
    }

    // Validar formato final conforme documentação da API
    // Formato: Código do País (55) + DDD (2 dígitos) + Número (8-9 dígitos)
    // Total: 12-15 dígitos, sem máscara ou caracteres especiais
    // Números brasileiros válidos:
    // - Fixo: 55 + DDD (2) + número (8) = 12 dígitos
    // - Celular: 55 + DDD (2) + número (9) = 13 dígitos
    if (formattedNumber.length < 12 || formattedNumber.length > 15) {
      console.error("[WhatsApp] Número formatado com comprimento inválido:", {
        formatado: formattedNumber,
        comprimento: formattedNumber.length,
        esperado: "12-15 dígitos (55 + DDD + Número)",
      })
      return { 
        success: false, 
        error: `Número inválido após formatação: ${formattedNumber} (${formattedNumber.length} dígitos). Formato esperado: Código do País (55) + DDD + Número (12-15 dígitos).` 
      }
    }

    // Validar se começa com código do país (55) - sempre deve começar após formatação
    if (!formattedNumber.startsWith("55")) {
      console.error("[WhatsApp] Número não começa com código do país (55) após formatação:", formattedNumber)
      return { 
        success: false, 
        error: "Erro na formatação: número deve começar com código do país (55)" 
      }
    }

    // Validar se contém apenas números (sem caracteres especiais)
    if (!/^\d+$/.test(formattedNumber)) {
      console.error("[WhatsApp] Número formatado contém caracteres inválidos:", formattedNumber)
      return { 
        success: false, 
        error: "Erro na formatação: número não deve conter máscara ou caracteres especiais" 
      }
    }

    // Validar se tem DDD + número válidos após código do país
    // Após "55", deve ter pelo menos DDD (2) + número fixo (8) = 10 dígitos
    // Ou DDD (2) + número celular (9) = 11 dígitos
    const afterCountryCode = formattedNumber.substring(2) // Remove "55"
    if (afterCountryCode.length < 10 || afterCountryCode.length > 13) {
      console.error("[WhatsApp] Número inválido após código do país:", {
        formatado: formattedNumber,
        aposCodigoPais: afterCountryCode,
        comprimento: afterCountryCode.length,
        esperado: "10-13 dígitos (DDD + Número)",
      })
      return { 
        success: false, 
        error: `Número incompleto. Após código do país (55), deve ter DDD + Número (10-13 dígitos). Encontrado: ${afterCountryCode.length} dígitos.` 
      }
    }

    // Preparar payload conforme documentação da API
    // Formato: Código do País + DDD + Número (sem máscara)
    // userId e queueId: não enviar se estiverem vazios (a API não aceita string vazia)
    const payload: {
      number: string
      body: string
      userId?: string
      queueId?: string
      sendSignature: boolean
      closeTicket: boolean
    } = {
      number: formattedNumber, // Formato: 558599999999 (sem máscara)
      body: message,
      sendSignature: true,
      closeTicket: false,
    }

    // Adicionar userId e queueId apenas se tiverem valor válido (não vazio)
    // A API não aceita string vazia, então omitimos o campo se não houver valor
    if (config.user_id && config.user_id.trim() !== "") {
      payload.userId = config.user_id
    }
    
    if (config.queue_id && config.queue_id.trim() !== "") {
      payload.queueId = config.queue_id
    }

    console.log("[WhatsApp] Enviando para:", config.endpoint)
    console.log("[WhatsApp] Payload:", {
      ...payload,
      body: message.substring(0, 50) + "...", // Log apenas início da mensagem
    })

    // Enviar para API externa
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify(payload),
    })

    console.log("[WhatsApp] Resposta da API:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    if (!response.ok) {
      let errorText = await response.text()
      let errorMessage = "Erro ao enviar mensagem via WhatsApp"
      
      // Tentar parsear erro como JSON
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error || errorMessage
        
        // Mensagens específicas para erros comuns
        if (response.status === 403 || errorMessage.includes("Invalid token")) {
          errorMessage = "Token inválido ou expirado. Verifique a configuração no painel administrativo."
        } else if (response.status === 401) {
          errorMessage = "Não autorizado. Verifique o token da API."
        } else if (response.status === 400) {
          errorMessage = errorJson.error || "Dados inválidos. Verifique o número de telefone."
        }
      } catch {
        // Se não for JSON, usar o texto direto
        errorMessage = errorText || errorMessage
      }
      
      console.error("[WhatsApp] Erro ao enviar mensagem:", {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        originalError: errorText,
      })
      
      return { success: false, error: errorMessage }
    }

    const responseData = await response.json().catch(() => ({}))
    console.log("[WhatsApp] Mensagem enviada com sucesso:", responseData)

    return { success: true }
  } catch (error: any) {
    console.error("[WhatsApp] Erro ao processar envio:", {
      error: error.message,
      stack: error.stack,
    })
    return { success: false, error: String(error) }
  }
}

/**
 * Envia notificação de nova solicitação de serviço via WhatsApp
 */
export async function sendServiceRequestNotification(
  requestId: number,
  customerName: string,
  customerPhone: string,
  serviceType: string,
  deviceInfo?: string | null,
  problemDescription?: string | null,
  priority?: string | null,
  customerAddress?: string | null
): Promise<void> {
  if (!customerPhone) {
    console.log("[WhatsApp] Telefone não fornecido, pulando envio")
    return
  }

  console.log("[WhatsApp] Iniciando envio de notificação:", {
    requestId,
    customerName,
    customerPhone,
    serviceType,
    deviceInfo,
    problemDescription,
    priority,
  })

  // Mapear prioridade para texto legível
  const priorityMap: Record<string, string> = {
    low: "Baixa",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente",
  }
  const priorityText = priority ? priorityMap[priority] || priority : "Normal"

  // Construir mensagem com todos os dados do formulário
  let message = `📋 *Solicitação de Orçamento Recebida!*

Olá *${customerName}*! 👋

Recebemos sua solicitação de orçamento. Segue um resumo completo:

━━━━━━━━━━━━━━━━━━━━
🛠️ *DETALHES DA SOLICITAÇÃO*
━━━━━━━━━━━━━━━━━━━━

*Tipo de Serviço:*
${serviceType}

${deviceInfo ? `*Equipamento:*
${deviceInfo}

` : ""}${problemDescription ? `*Descrição do Problema:*
${problemDescription}

` : ""}*Urgência:*
${priorityText}

*Número da Solicitação:*
#${requestId}

${customerAddress ? `*Endereço:*
${customerAddress}

` : ""}━━━━━━━━━━━━━━━━━━━━

✅ *Sua solicitação foi registrada com sucesso!*

Nossa equipe técnica especializada entrará em contato *em breve* para:
• Avaliar o problema detalhadamente
• Fornecer um orçamento personalizado
• Agendar o melhor horário para atendimento

Você receberá um retorno em até *24 horas*.

Obrigado por escolher a MULTIVUS! 🚀`

  const result = await sendWhatsAppMessage(customerPhone, message)
  
  if (result.success) {
    console.log("[WhatsApp] Notificação enviada com sucesso para:", customerPhone)
  } else {
    console.error("[WhatsApp] Falha ao enviar notificação:", result.error)
    // Re-throw para que o chamador possa tratar
    throw new Error(result.error || "Erro desconhecido ao enviar WhatsApp")
  }
}

/**
 * Envia notificação de pedido confirmado via WhatsApp com imagem do produto
 */
export function buildPixWhatsAppBlock(pixCopiaECola: string, totalAmount: number): string {
  return `━━━━━━━━━━━━━━━━━━━━
💳 *PAGAMENTO PIX*
━━━━━━━━━━━━━━━━━━━━

*Valor:* R$ ${Number(totalAmount).toFixed(2).replace(".", ",")}

Copie o código Pix no app do seu banco:

${pixCopiaECola}

✅ Após pagar, o pedido é confirmado automaticamente.`
}

export async function sendOrderConfirmationNotification(
  orderNumber: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  customerAddress: string,
  status: string,
  totalAmount: number,
  items: Array<{
    product_id: number
    product_name: string
    product_price: number
    quantity: number
    subtotal: number
    image_url?: string | null
  }>,
  pixCopiaECola?: string | null
): Promise<void> {
  if (!customerPhone) {
    console.log("[WhatsApp] Telefone não fornecido, pulando envio de notificação de pedido")
    return
  }

  console.log("[WhatsApp] Iniciando envio de notificação de pedido:", {
    orderNumber,
    customerName,
    customerPhone,
    totalAmount,
    itemsCount: items.length,
    items: items.map(item => ({
      name: item.product_name,
      imageUrl: item.image_url,
      hasImage: !!item.image_url && item.image_url.trim() !== ""
    }))
  })

  // Mapear status para texto legível
  const statusMap: Record<string, string> = {
    pending: "Pendente",
    processing: "Em processamento",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  }
  const statusText = statusMap[status] || status

  // Construir mensagem de texto
  let message = `✅ *Pedido Confirmado!*

Seu pedido foi recebido com sucesso

━━━━━━━━━━━━━━━━━━━━
📋 *DETALHES DO PEDIDO*
━━━━━━━━━━━━━━━━━━━━

*Número do Pedido:*
${orderNumber}

*Status:*
${statusText}

*Total:*
R$ ${Number(totalAmount).toFixed(2).replace(".", ",")}

━━━━━━━━━━━━━━━━━━━━
🛍️ *ITENS DO PEDIDO*
━━━━━━━━━━━━━━━━━━━━

`

  // Adicionar itens
  items.forEach((item, index) => {
    message += `${item.product_name}${item.image_url ? " (Imagem meramente ilustrativa)" : ""}

${item.quantity}x R$ ${Number(item.product_price).toFixed(2).replace(".", ",")}

R$ ${Number(item.subtotal).toFixed(2).replace(".", ",")}

`
    if (index < items.length - 1) {
      message += "\n"
    }
  })

  message += `━━━━━━━━━━━━━━━━━━━━
📦 *DADOS DE ENTREGA*
━━━━━━━━━━━━━━━━━━━━

${customerName}

${customerEmail}

${customerPhone}

${customerAddress}

`

  if (pixCopiaECola?.trim()) {
    message += `${buildPixWhatsAppBlock(pixCopiaECola.trim(), totalAmount)}

`
  } else {
    message += `━━━━━━━━━━━━━━━━━━━━

Você receberá um email de confirmação em breve. Nossa equipe entrará em contato para finalizar o pagamento.`
  }

  // Enviar mensagem de texto primeiro
  const textResult = await sendWhatsAppMessage(customerPhone, message)

  if (!textResult.success) {
    console.error("[WhatsApp] Falha ao enviar mensagem de texto do pedido:", textResult.error)
    // Não falhar o pedido se o WhatsApp falhar, apenas logar o erro
    return
  }

  console.log("[WhatsApp] Mensagem de texto do pedido enviada com sucesso")

  // Aguardar um pouco antes de enviar a imagem para garantir que a mensagem de texto foi processada
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Se houver imagem do primeiro produto, enviar como mídia
  console.log("[WhatsApp] Verificando itens para envio de imagem:", items.map(item => ({
    name: item.product_name,
    hasImage: !!item.image_url,
    imageUrl: item.image_url
  })))
  
  const firstItemWithImage = items.find((item) => item.image_url && item.image_url.trim() !== "")
  
  if (firstItemWithImage?.image_url) {
    try {
      // Buscar a imagem e converter para base64
      const imageUrl = firstItemWithImage.image_url
      console.log("[WhatsApp] Item com imagem encontrado:", {
        productName: firstItemWithImage.product_name,
        imageUrl: imageUrl
      })
      
      // Se for URL relativa, construir URL absoluta
      // Para uploads (/uploads/), usar FRONTEND_DOMAIN ou NEXT_PUBLIC_DOMAIN
      let fullImageUrl = imageUrl
      if (imageUrl.startsWith("/uploads/")) {
        // URL de upload relativa - construir URL absoluta usando domínio do frontend
        const frontendDomain = process.env.FRONTEND_DOMAIN || process.env.NEXT_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const cleanDomain = frontendDomain.replace(/^https?:\/\//, "")
        fullImageUrl = `https://${cleanDomain}${imageUrl}`
      } else if (imageUrl.startsWith("/")) {
        // Outra URL relativa do próprio site
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        fullImageUrl = `${baseUrl}${imageUrl}`
      } else if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
        // Se não começar com http/https nem com /, assumir que é relativa
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        fullImageUrl = `${baseUrl}/${imageUrl.startsWith("/") ? imageUrl.substring(1) : imageUrl}`
      }

      console.log("[WhatsApp] Baixando imagem do produto:", {
        originalUrl: imageUrl,
        fullUrl: fullImageUrl
      })

      // Baixar a imagem com timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 segundos de timeout

      let imageBase64: string
      
      try {
        const imageResponse = await fetch(fullImageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*'
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!imageResponse.ok) {
          console.error("[WhatsApp] Erro ao baixar imagem:", {
            status: imageResponse.status,
            statusText: imageResponse.statusText,
            url: fullImageUrl
          })
          return
        }

        const imageBuffer = await imageResponse.arrayBuffer()
        
        if (imageBuffer.byteLength === 0) {
          console.error("[WhatsApp] Imagem vazia ou inválida")
          return
        }
        
        imageBase64 = Buffer.from(imageBuffer).toString("base64")
        const imageMimeType = imageResponse.headers.get("content-type") || "image/jpeg"
        
        console.log("[WhatsApp] Imagem convertida para base64:", {
          size: imageBase64.length,
          bufferSize: imageBuffer.byteLength,
          mimeType: imageMimeType,
          firstChars: imageBase64.substring(0, 50)
        })
        
        if (!imageBase64 || imageBase64.length === 0) {
          console.error("[WhatsApp] Falha ao converter imagem para base64")
          return
        }
        
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          console.error("[WhatsApp] Timeout ao baixar imagem:", fullImageUrl)
        } else {
          console.error("[WhatsApp] Erro ao baixar imagem:", {
            error: fetchError.message,
            url: fullImageUrl
          })
        }
        return
      }

      // Enviar imagem via API de mídia
      const { sql } = await import("./db")
      
      if (!sql) {
        console.warn("[WhatsApp] Database não disponível para envio de mídia")
        return
      }
      
      const configs = await sql!`
        SELECT token, endpoint, user_id, queue_id
        FROM whatsapp_config
        WHERE is_active = true
        ORDER BY id DESC
        LIMIT 1
      `

      if (configs.length === 0) {
        console.warn("[WhatsApp] Configuração não encontrada para envio de mídia")
        return
      }

      const config = configs[0]
      const { formatPhoneNumber } = await import("./whatsapp")
      const formattedNumber = formatPhoneNumber(customerPhone)

      // Criar legenda completa com informações do produto
      const pixHint = pixCopiaECola?.trim()
        ? `💳 *Pague via Pix* (código na mensagem anterior)

✅ Confirmação automática após o pagamento.`
        : `Nossa equipe entrará em contato para finalizar o pagamento.

Obrigado por escolher a MULTIVUS! 🚀`

      const productCaption = `🛍️ *${firstItemWithImage.product_name}*

📦 *Pedido:* ${orderNumber}
💰 *Valor total:* R$ ${Number(totalAmount).toFixed(2).replace(".", ",")}
📊 *Quantidade:* ${firstItemWithImage.quantity}x

━━━━━━━━━━━━━━━━━━━━

${pixHint}`

      // Preparar payload - remover campos undefined
      const mediaPayload: any = {
        number: formattedNumber,
        body: productCaption,
        medias: imageBase64, // A API espera apenas base64, sem data URI
        sendSignature: true,
        closeTicket: false,
      }

      // Adicionar userId e queueId apenas se tiverem valor válido (não undefined)
      if (config.user_id && config.user_id.trim() !== "") {
        mediaPayload.userId = config.user_id
      }
      
      if (config.queue_id && config.queue_id.trim() !== "") {
        mediaPayload.queueId = config.queue_id
      }
      
      // Remover campos undefined do payload
      Object.keys(mediaPayload).forEach(key => {
        if (mediaPayload[key] === undefined) {
          delete mediaPayload[key]
        }
      })

      console.log("[WhatsApp] Enviando imagem via API:", {
        endpoint: config.endpoint,
        number: formattedNumber,
        productName: firstItemWithImage.product_name,
        captionLength: productCaption.length,
        captionPreview: productCaption.substring(0, 100) + "...",
        imageBase64Length: imageBase64.length,
        imageBase64Preview: imageBase64.substring(0, 50) + "...",
        payloadSize: JSON.stringify(mediaPayload).length,
        hasUserId: !!mediaPayload.userId,
        hasQueueId: !!mediaPayload.queueId,
        payloadKeys: Object.keys(mediaPayload)
      })
      
      console.log("[WhatsApp] Payload completo (sem base64):", {
        ...mediaPayload,
        medias: `[base64 string com ${imageBase64.length} caracteres]`
      })

      const mediaResponse = await fetch(config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.token}`,
        },
        body: JSON.stringify(mediaPayload),
      })

      const responseText = await mediaResponse.text()
      
      if (mediaResponse.ok) {
        try {
          const responseData = JSON.parse(responseText)
          console.log("[WhatsApp] ✅ Imagem do produto enviada com sucesso:", {
            status: responseData.status,
            message: responseData.message,
            data: responseData
          })
        } catch (e) {
          console.log("[WhatsApp] ✅ Imagem do produto enviada com sucesso (resposta não-JSON):", responseText)
        }
      } else {
        console.error("[WhatsApp] ❌ Erro ao enviar imagem do produto:", {
          status: mediaResponse.status,
          statusText: mediaResponse.statusText,
          error: responseText,
          payloadPreview: {
            number: mediaPayload.number,
            bodyLength: mediaPayload.body.length,
            mediasLength: mediaPayload.medias.length,
            hasUserId: !!mediaPayload.userId,
            hasQueueId: !!mediaPayload.queueId
          }
        })
      }
    } catch (error: any) {
      console.error("[WhatsApp] ❌ Erro ao processar envio de imagem:", {
        error: error.message,
        stack: error.stack,
        productName: firstItemWithImage?.product_name
      })
      // Não falhar o pedido se a imagem falhar
    }
  } else {
    console.log("[WhatsApp] Nenhum item com imagem encontrado para envio")
  }
}

/**
 * Envia notificação de pagamento confirmado via WhatsApp
 */
export async function sendPaymentConfirmedNotification(
  orderNumber: string,
  customerName: string,
  customerPhone: string,
  totalAmount: number
): Promise<void> {
  if (!customerPhone) {
    console.log("[WhatsApp] Telefone não fornecido, pulando envio de notificação de pagamento")
    return
  }

  console.log("[WhatsApp] Enviando notificação de pagamento confirmado:", {
    orderNumber,
    customerName,
    customerPhone,
    totalAmount,
  })

  const message = `✅ *Pagamento Confirmado!*

Olá *${customerName}*! 👋

Seu pagamento foi confirmado com sucesso!

━━━━━━━━━━━━━━━━━━━━
💰 *DETALHES DO PAGAMENTO*
━━━━━━━━━━━━━━━━━━━━

*Número do Pedido:*
${orderNumber}

*Valor Pago:*
R$ ${Number(totalAmount).toFixed(2).replace(".", ",")}

*Status:*
✅ Pagamento Confirmado

━━━━━━━━━━━━━━━━━━━━

🎉 Seu pedido está sendo processado e em breve será enviado!

Você receberá atualizações sobre o envio por email e WhatsApp.

Obrigado por escolher a MULTIVUS! 🚀`

  const result = await sendWhatsAppMessage(customerPhone, message)
  
  if (result.success) {
    console.log("[WhatsApp] Notificação de pagamento confirmado enviada com sucesso para:", customerPhone)
  } else {
    console.error("[WhatsApp] Falha ao enviar notificação de pagamento:", result.error)
    throw new Error(result.error || "Erro desconhecido ao enviar WhatsApp")
  }
}

/**
 * Envia notificação de interesse em software via WhatsApp
 */
export async function sendSoftwareRequestNotification(
  softwareId: number,
  softwareName: string,
  softwarePrice: number | null,
  isFree: boolean,
  customerName: string,
  customerPhone: string
): Promise<{ success: boolean; error?: string }> {
  if (!customerPhone || customerPhone.trim() === "") {
    console.log("[WhatsApp] Telefone não fornecido, pulando envio")
    return { success: false, error: "Telefone não fornecido" }
  }

  console.log("[WhatsApp] Iniciando envio de notificação de software:", {
    softwareId,
    softwareName,
    softwarePrice,
    isFree,
    customerName,
    customerPhone,
  })

  // Buscar informações adicionais do software do banco
  let softwareDetails: any = null
  try {
    if (sql) {
      const softwareResult = await sql!`
        SELECT description, short_description, version, category, platform, features
        FROM softwares
        WHERE id = ${softwareId}
        LIMIT 1
      `
      if (softwareResult.length > 0) {
        softwareDetails = softwareResult[0]
      }
    }
  } catch (error) {
    console.warn("[WhatsApp] Erro ao buscar detalhes do software:", error)
  }

  // Construir mensagem formatada
  const priceText = isFree
    ? "🆓 *GRATUITO*"
    : softwarePrice
      ? `💰 *A partir de R$ ${Number(softwarePrice).toFixed(2).replace(".", ",")}*`
      : "💰 *Consulte valores*"

  const versionText = softwareDetails?.version ? `v${softwareDetails.version}` : ""
  const categoryText = softwareDetails?.category || ""
  const platformText = softwareDetails?.platform || ""

  let message = `💻 *Interesse em Software - MULTIVUS*

Olá *${customerName}*! 👋

Obrigado pelo seu interesse no software:

━━━━━━━━━━━━━━━━━━━━
📦 *SOFTWARE SOLICITADO*
━━━━━━━━━━━━━━━━━━━━

*Nome:*
${softwareName}

${versionText ? `*Versão:*
${versionText}

` : ""}${categoryText ? `*Categoria:*
${categoryText}

` : ""}${platformText ? `*Plataforma:*
${platformText}

` : ""}*Valor:*
${priceText}

${softwareDetails?.short_description || softwareDetails?.description
    ? `*Descrição:*
${softwareDetails.short_description || softwareDetails.description}

`
    : ""}━━━━━━━━━━━━━━━━━━━━
👤 *SEUS DADOS*
━━━━━━━━━━━━━━━━━━━━

*Nome:*
${customerName}

*WhatsApp:*
${customerPhone}

━━━━━━━━━━━━━━━━━━━━

✅ *Sua solicitação foi registrada!*

Nossa equipe entrará em contato em breve para:
${isFree
    ? "• Enviar o link de download\n• Fornecer instruções de instalação\n• Oferecer suporte técnico"
    : "• Fornecer informações detalhadas\n• Apresentar opções de pagamento\n• Agendar demonstração (se necessário)"}

Você receberá um retorno em até *24 horas*.

Obrigado por escolher a MULTIVUS! 🚀`

  // Adicionar funcionalidades se disponíveis
  if (softwareDetails?.features && Array.isArray(softwareDetails.features) && softwareDetails.features.length > 0) {
    message += `\n\n━━━━━━━━━━━━━━━━━━━━\n✨ *PRINCIPAIS FUNCIONALIDADES*\n━━━━━━━━━━━━━━━━━━━━\n\n`
    softwareDetails.features.slice(0, 5).forEach((feature: string) => {
      message += `✓ ${feature}\n`
    })
  }

  const result = await sendWhatsAppMessage(customerPhone, message)

  if (result.success) {
    console.log("[WhatsApp] Notificação de software enviada com sucesso para:", customerPhone)
  } else {
    console.error("[WhatsApp] Falha ao enviar notificação de software:", result.error)
  }

  return result
}

/**
 * Envia notificação de mensagem de contato via WhatsApp
 */
export async function sendContactMessageNotification(
  messageId: number,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!customerPhone || customerPhone.trim() === "") {
    console.log("[WhatsApp] Telefone não fornecido, pulando envio")
    return { success: false, error: "Telefone não fornecido" }
  }

  console.log("[WhatsApp] Iniciando envio de notificação de contato:", {
    messageId,
    customerName,
    customerEmail,
    customerPhone,
    subject,
  })

  // Construir mensagem formatada
  const messageText = `📧 *Nova Mensagem de Contato - MULTIVUS*

Olá *${customerName}*! 👋

Recebemos sua mensagem através do formulário de contato:

━━━━━━━━━━━━━━━━━━━━
📋 *DETALHES DA MENSAGEM*
━━━━━━━━━━━━━━━━━━━━

*Assunto:*
${subject}

*Mensagem:*
${message}

━━━━━━━━━━━━━━━━━━━━
👤 *SEUS DADOS*
━━━━━━━━━━━━━━━━━━━━

*Nome:*
${customerName}

*E-mail:*
${customerEmail}

*WhatsApp:*
${customerPhone}

*Número da Mensagem:*
#${messageId}

━━━━━━━━━━━━━━━━━━━━

✅ *Sua mensagem foi registrada com sucesso!*

Nossa equipe entrará em contato em breve para responder sua solicitação.

Você receberá um retorno em até *24 horas* através do e-mail ou WhatsApp informado.

Obrigado por entrar em contato com a MULTIVUS! 🚀`

  const result = await sendWhatsAppMessage(customerPhone, messageText)

  if (result.success) {
    console.log("[WhatsApp] Notificação de contato enviada com sucesso para:", customerPhone)
  } else {
    console.error("[WhatsApp] Falha ao enviar notificação de contato:", result.error)
  }

  return result
}

