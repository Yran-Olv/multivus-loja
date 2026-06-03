import { z } from "zod"

// Validação de email
export const emailSchema = z.string().email("Por favor, digite um e-mail válido (exemplo: seu@email.com)").toLowerCase().trim()

// Validação de telefone brasileiro
// Aceita vários formatos e normaliza para apenas números
export const phoneSchema = z
  .string()
  .min(10, "O telefone deve ter pelo menos 10 dígitos. Exemplo: (34) 99999-9999")
  .refine(
    (val) => {
      // Remove caracteres não numéricos para validar
      const cleaned = val.replace(/\D/g, "")
      // Aceita números com 10-15 dígitos (com ou sem código do país)
      return cleaned.length >= 10 && cleaned.length <= 15
    },
    { message: "Telefone inválido. Use o formato: (34) 99999-9999 ou (34) 999999999" }
  )
  .transform((val) => val.replace(/\D/g, "")) // Remove caracteres não numéricos

// Validação de URL - aceita URL válida ou string vazia
export const urlSchema = z
  .string()
  .refine(
    (val) => {
      // Se for string vazia, aceita
      if (val === "" || val.trim() === "") return true
      // Caso contrário, valida como URL
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    },
    { message: "URL inválida" }
  )
  .optional()
  .nullable()

// Validação de preço
export const priceSchema = z.number().positive("Preço deve ser positivo").max(999999.99, "Preço muito alto")

// Validação de quantidade
export const quantitySchema = z.number().int("Quantidade deve ser um número inteiro").min(0, "Quantidade não pode ser negativa")

// Schema para produto
export const productSchema = z.object({
  name: z.string().min(3, "O nome do produto deve ter pelo menos 3 caracteres").max(255, "O nome do produto é muito longo"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres").optional().or(z.literal("")),
  category: z.string().min(1, "Categoria é obrigatória"),
  price: priceSchema,
  image_url: z
    .any()
    .optional()
    .nullable()
    .refine(
      (val) => {
        // Se for null, undefined ou string vazia, aceita
        if (val === null || val === undefined || val === "" || (typeof val === "string" && val.trim() === "")) {
          return true
        }
        // Caso contrário, valida como URL
        if (typeof val === "string") {
          const trimmed = val.trim()
          // Se for string vazia após trim, aceita
          if (trimmed === "") {
            return true
          }
          // Tenta validar como URL (aceita URLs absolutas e relativas que começam com /)
          try {
            // Se começa com /, é uma URL relativa válida
            if (trimmed.startsWith("/")) {
              return true
            }
            // Caso contrário, tenta validar como URL absoluta
            new URL(trimmed)
            return true
          } catch {
            return false
          }
        }
        return true
      },
      { message: "URL inválida" }
    )
    .transform((val) => {
      // Converter string vazia para null
      if (val === "" || (typeof val === "string" && val.trim() === "")) {
        return null
      }
      return val
    }),
  stock_quantity: quantitySchema,
  specifications: z.record(z.string()).optional().nullable(),
  warranty: z.string().max(100, "Garantia muito longa").optional().nullable(),
  delivery: z.string().max(100, "Entrega muito longa").optional().nullable(),
  support: z.string().max(100, "Suporte muito longo").optional().nullable(),
})

// Schema para serviço
export const serviceSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(255, "Nome muito longo"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  icon: z.string().optional(),
  features: z.array(z.string()).optional(),
  price_from: priceSchema.optional().nullable(),
})

// Schema para solicitação de serviço
export const serviceRequestSchema = z.object({
  customer_name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(255, "O nome é muito longo"),
  customer_email: emailSchema,
  customer_phone: phoneSchema,
  customer_address: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => {
      // Transformar string vazia em null
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
        return null
      }
      return val.trim()
    })
    .refine(
      (val) => {
        // Se for null (campo opcional), aceita
        if (val === null || val === undefined || val === "") {
          return true
        }
        // Se tiver conteúdo, deve ter pelo menos 5 caracteres
        return val.length >= 5
      },
      { message: "O endereço deve ter pelo menos 5 caracteres ou deixe em branco" }
    ),
  service_type: z.string().min(1, "Por favor, selecione um tipo de serviço"),
  device_info: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      // Transformar string vazia, null ou undefined em null
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
        return null
      }
      return typeof val === "string" ? val.trim() : null
    }),
  problem_description: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      // Transformar string vazia, null ou undefined em null
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
        return null
      }
      return typeof val === "string" ? val.trim() : null
    })
    .refine(
      (val) => {
        // Se for null (campo opcional), aceita
        if (val === null || val === undefined || val === "") {
          return true
        }
        // Se tiver conteúdo, deve ter pelo menos 10 caracteres
        return val.length >= 10
      },
      { message: "A descrição do problema deve ter pelo menos 10 caracteres ou deixe em branco" }
    ),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
})

// Schema para mensagem de contato
export const contactMessageSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").max(255, "O nome é muito longo"),
  email: emailSchema,
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      // Transformar string vazia em null
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
        return null
      }
      return val.trim()
    })
    .refine(
      (val) => {
        // Se for null (campo opcional), aceita
        if (val === null || val === undefined || val === "") {
          return true
        }
        // Se tiver conteúdo, valida como telefone
        const cleaned = val.replace(/\D/g, "")
        return cleaned.length >= 10 && cleaned.length <= 15
      },
      { message: "Telefone inválido. Use o formato: (XX) XXXXX-XXXX ou (XX) XXXXXXXXX" }
    )
    .transform((val) => {
      // Se for null, retorna null. Caso contrário, normaliza para apenas números
      if (val === null || val === undefined || val === "") {
        return null
      }
      return val.replace(/\D/g, "")
    }),
  subject: z.string().min(3, "O assunto deve ter pelo menos 3 caracteres").max(255, "O assunto é muito longo"),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres"),
})

// Função para sanitizar HTML
export function sanitizeHtml(html: string): string {
  // Remove tags HTML perigosas e mantém apenas texto
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:/gi, "")
    .trim()
}

// Função para sanitizar string simples
export function sanitizeString(str: string): string {
  if (typeof str !== "string") return ""
  return str
    .replace(/[<>]/g, "") // Remove < e >
    .replace(/javascript:/gi, "") // Remove javascript:
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Remove data: URLs
    .replace(/vbscript:/gi, "") // Remove vbscript:
    .replace(/file:/gi, "") // Remove file: URLs
    .replace(/expression\(/gi, "") // Remove CSS expressions
    .replace(/<script/gi, "") // Remove script tags
    .replace(/<\/script>/gi, "") // Remove script closing tags
    .replace(/<iframe/gi, "") // Remove iframe tags
    .replace(/<object/gi, "") // Remove object tags
    .replace(/<embed/gi, "") // Remove embed tags
    .trim()
}

// Validação de tamanho de arquivo (em bytes)
export function validateFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return size <= maxSizeBytes
}

// Validação de tipo de arquivo
export function validateFileType(filename: string, allowedTypes: string[] = ["image/jpeg", "image/png", "image/webp"]): boolean {
  const ext = filename.split(".").pop()?.toLowerCase()
  const typeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  }
  return ext ? allowedTypes.includes(typeMap[ext] || "") : false
}

