/**
 * Funções helper para integração WhatsApp
 */

/**
 * Formata número de telefone para formato internacional sem máscara
 * SEMPRE corrige e formata o número, mesmo se estiver em formato incorreto
 * 
 * Formato esperado: Código do País (55) + DDD (2 dígitos) + Número (8-9 dígitos)
 * Ex: (85) 99999-9999 -> 558599999999
 * Ex: 34999198782 -> 5534999198782
 * Ex: (34) 99919-8782 -> 5534999198782
 * Ex: 85999999999 -> 558599999999
 * 
 * Regras de formatação:
 * - Remove TODOS os caracteres não numéricos (máscaras, espaços, parênteses, hífens, etc)
 * - Remove zeros iniciais
 * - Adiciona código do país (55) se não tiver
 * - Garante formato: 55 + DDD + Número
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return ""
  
  // Remove TODOS os caracteres não numéricos (máscaras, espaços, parênteses, hífens, etc)
  let cleaned = phone.replace(/\D/g, "")
  
  // Se estiver vazio após limpeza, retornar vazio
  if (cleaned.length === 0) {
    return ""
  }
  
  // Remove zeros iniciais (formato brasileiro antigo: 085...)
  while (cleaned.startsWith("0") && cleaned.length > 1) {
    cleaned = cleaned.substring(1)
  }
  
  // Se já começar com código do país (55), validar e retornar
  if (cleaned.startsWith("55")) {
    // Já tem código do país, retornar como está
    return cleaned
  }
  
  // Se não começar com 55, adicionar código do país
  // Isso garante que sempre terá o formato: 55 + DDD + Número
  // Números brasileiros têm:
  // - Fixo: DDD (2) + número (8) = 10 dígitos → com 55 = 12 dígitos
  // - Celular: DDD (2) + número (9) = 11 dígitos → com 55 = 13 dígitos
  // Ambos são válidos (12-15 dígitos)
  cleaned = "55" + cleaned
  
  return cleaned
}

/**
 * Valida se o número de telefone pode ser formatado corretamente
 * SEMPRE formata o número antes de validar
 * 
 * Formato esperado após formatação: Código do País (55) + DDD (2 dígitos) + Número (8-9 dígitos)
 * Total: 12-15 dígitos
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false
  
  // Sempre formatar primeiro
  const formatted = formatPhoneNumber(phone)
  
  // Se não conseguiu formatar, inválido
  if (!formatted || formatted.length === 0) {
    return false
  }
  
  // Validar comprimento: 12-15 dígitos (55 + DDD + número)
  // Mínimo: 55 (2) + DDD (2) + número (8) = 12 dígitos
  // Máximo: 55 (2) + DDD (2) + número (11) = 15 dígitos (formato internacional)
  if (formatted.length < 12 || formatted.length > 15) {
    return false
  }
  
  // Validar se começa com código do país (55) - sempre deve começar após formatação
  if (!formatted.startsWith("55")) {
    return false
  }
  
  // Validar se contém apenas números (sem caracteres especiais)
  if (!/^\d+$/.test(formatted)) {
    return false
  }
  
  // Validar se tem pelo menos DDD + número após o código do país
  // Após "55", deve ter pelo menos 10 dígitos (DDD + número)
  const afterCountryCode = formatted.substring(2)
  if (afterCountryCode.length < 10) {
    return false
  }
  
  return true
}

/**
 * Interface para configuração do WhatsApp
 */
export interface WhatsAppConfig {
  id?: number
  token: string
  endpoint: string
  user_id?: string | null
  queue_id?: string | null
  is_active: boolean
}

/**
 * Interface para envio de mensagem de texto
 */
export interface SendTextMessageParams {
  number: string
  body: string
  userId?: string
  queueId?: string
  sendSignature?: boolean
  closeTicket?: boolean
}

/**
 * Interface para envio de mensagem com mídia
 */
export interface SendMediaMessageParams {
  number: string
  body: string
  mediaBase64: string
  userId?: string
  queueId?: string
  sendSignature?: boolean
  closeTicket?: boolean
}

