/**
 * Utilitários para traduzir mensagens de erro técnicas em mensagens amigáveis para o cliente
 */

// Mapeamento de campos para nomes amigáveis
const fieldNames: Record<string, string> = {
  customer_name: "Nome",
  customer_email: "E-mail",
  customer_phone: "Telefone",
  customer_address: "Endereço",
  service_type: "Tipo de serviço",
  device_info: "Informações do equipamento",
  problem_description: "Descrição do problema",
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  subject: "Assunto",
  message: "Mensagem",
  product_id: "Produto",
  rating: "Avaliação",
  title: "Título",
  comment: "Comentário",
  password: "Senha",
  confirm_password: "Confirmação de senha",
  code: "Código",
  new_password: "Nova senha",
}

// Traduz mensagens de erro de validação
export function translateValidationError(field: string, message: string): string {
  const fieldName = fieldNames[field] || field

  // Erros comuns de validação
  if (message.includes("Required") || message.includes("obrigatório")) {
    return `Por favor, preencha o campo "${fieldName}"`
  }

  if (message.includes("Invalid") || message.includes("inválido")) {
    if (field === "customer_email" || field === "email") {
      return "Por favor, digite um e-mail válido (exemplo: seu@email.com)"
    }
    if (field === "customer_phone" || field === "phone") {
      return "Por favor, digite um telefone válido (exemplo: (34) 99999-9999)"
    }
    return `O valor informado em "${fieldName}" não é válido`
  }

  if (message.includes("min") || message.includes("pelo menos")) {
    const match = message.match(/(\d+)/)
    const min = match ? match[1] : "alguns"
    if (field === "customer_name" || field === "name") {
      return `O nome deve ter pelo menos ${min} caracteres`
    }
    if (field === "message" || field === "problem_description") {
      return `A descrição deve ter pelo menos ${min} caracteres`
    }
    if (field === "customer_phone" || field === "phone") {
      return "O telefone deve ter pelo menos 10 dígitos"
    }
    return `O campo "${fieldName}" deve ter pelo menos ${min} caracteres`
  }

  if (message.includes("max") || message.includes("muito longo")) {
    const match = message.match(/(\d+)/)
    const max = match ? match[1] : "alguns"
    return `O campo "${fieldName}" não pode ter mais de ${max} caracteres`
  }

  if (message.includes("length")) {
    const match = message.match(/(\d+)/)
    const length = match ? match[1] : ""
    if (field === "code") {
      return "O código deve ter 6 dígitos"
    }
    return `O campo "${fieldName}" deve ter exatamente ${length} caracteres`
  }

  if (message.includes("coincidem") || message.includes("match")) {
    return "As senhas informadas não coincidem. Verifique e tente novamente"
  }

  if (message.includes("expirado") || message.includes("expired")) {
    return "O código expirou. Por favor, solicite um novo código"
  }

  // Retornar mensagem original se não houver tradução específica
  return message
}

// Traduz erros de API para mensagens amigáveis
export function translateApiError(error: string, context?: string): string {
  const errorLower = error.toLowerCase()

  // Erros de rede/conexão
  if (
    errorLower.includes("network") ||
    errorLower.includes("fetch") ||
    errorLower.includes("connection") ||
    errorLower.includes("conexão")
  ) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente"
  }

  // Erros de autenticação
  if (
    errorLower.includes("unauthorized") ||
    errorLower.includes("não autenticado") ||
    errorLower.includes("autenticação")
  ) {
    return "Sua sessão expirou. Por favor, faça login novamente"
  }

  // Erros de rate limiting
  if (
    errorLower.includes("rate limit") ||
    errorLower.includes("muitas requisições") ||
    errorLower.includes("429")
  ) {
    return "Você fez muitas solicitações. Aguarde alguns instantes e tente novamente"
  }

  // Erros de validação genéricos
  if (
    errorLower.includes("validation") ||
    errorLower.includes("dados inválidos") ||
    errorLower.includes("invalid")
  ) {
    return "Por favor, verifique os dados informados e tente novamente"
  }

  // Erros de banco de dados
  if (
    errorLower.includes("database") ||
    errorLower.includes("banco de dados") ||
    errorLower.includes("sql")
  ) {
    return "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes"
  }

  // Erros genéricos de servidor
  if (
    errorLower.includes("500") ||
    errorLower.includes("internal server") ||
    errorLower.includes("erro ao processar")
  ) {
    return "Ocorreu um erro inesperado. Nossa equipe foi notificada. Por favor, tente novamente em alguns instantes"
  }

  // Erros de não encontrado
  if (
    errorLower.includes("404") ||
    errorLower.includes("not found") ||
    errorLower.includes("não encontrado")
  ) {
    return "O que você está procurando não foi encontrado"
  }

  // Erros específicos por contexto
  if (context === "service-request") {
    if (errorLower.includes("salvar") || errorLower.includes("save")) {
      return "Não foi possível enviar sua solicitação. Verifique os dados informados e tente novamente"
    }
    return "Não foi possível processar sua solicitação de serviço. Tente novamente"
  }

  if (context === "contact") {
    if (errorLower.includes("salvar") || errorLower.includes("save")) {
      return "Não foi possível enviar sua mensagem. Verifique os dados informados e tente novamente"
    }
    return "Não foi possível enviar sua mensagem. Tente novamente"
  }

  if (context === "order") {
    if (errorLower.includes("salvar") || errorLower.includes("save")) {
      return "Não foi possível processar seu pedido. Verifique os dados informados e tente novamente"
    }
    return "Não foi possível processar seu pedido. Tente novamente"
  }

  if (context === "software-request") {
    if (errorLower.includes("salvar") || errorLower.includes("save")) {
      return "Não foi possível enviar sua solicitação. Verifique os dados informados e tente novamente"
    }
    if (errorLower.includes("whatsapp") || errorLower.includes("envio")) {
      return "Não foi possível enviar para o WhatsApp. Verifique se o número está correto e tente novamente"
    }
    return "Não foi possível processar sua solicitação. Tente novamente"
  }

  if (context === "password-reset") {
    if (errorLower.includes("whatsapp") || errorLower.includes("cadastrado")) {
      return "Não encontramos um WhatsApp cadastrado para este e-mail. Entre em contato com o suporte"
    }
    if (errorLower.includes("código") || errorLower.includes("code")) {
      if (errorLower.includes("inválido") || errorLower.includes("invalid")) {
        return "O código informado está incorreto. Verifique o código recebido no WhatsApp e tente novamente"
      }
      if (errorLower.includes("expirado") || errorLower.includes("expired")) {
        return "O código expirou. Por favor, solicite um novo código de recuperação"
      }
      return "Não foi possível enviar o código. Verifique se o e-mail está correto e tente novamente"
    }
    return "Não foi possível redefinir sua senha. Tente novamente"
  }

  // Retornar mensagem original se não houver tradução
  return error
}

// Processa detalhes de erro de validação (array de erros do Zod)
export function processValidationErrors(
  errors: Array<{ path: (string | number)[]; message: string }>
): string {
  if (errors.length === 0) {
    return "Por favor, verifique os dados informados"
  }

  if (errors.length === 1) {
    const error = errors[0]
    const field = error.path[0]?.toString() || ""
    return translateValidationError(field, error.message)
  }

  // Múltiplos erros
  const friendlyErrors = errors
    .slice(0, 3) // Limitar a 3 erros para não sobrecarregar
    .map((error) => {
      const field = error.path[0]?.toString() || ""
      return translateValidationError(field, error.message)
    })

  if (errors.length > 3) {
    return `${friendlyErrors.join(". ")}. E mais ${errors.length - 3} erro(s)`
  }

  return friendlyErrors.join(". ")
}

