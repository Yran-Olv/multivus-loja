"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
// Funções utilitárias para traduzir erros (inline para evitar problemas de importação)
function translateApiError(error: string, context?: string): string {
  const errorLower = error.toLowerCase()
  if (errorLower.includes("network") || errorLower.includes("fetch") || errorLower.includes("connection") || errorLower.includes("conexão")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente"
  }
  if (errorLower.includes("unauthorized") || errorLower.includes("não autenticado")) {
    return "Sua sessão expirou. Por favor, faça login novamente"
  }
  if (errorLower.includes("rate limit") || errorLower.includes("muitas requisições") || errorLower.includes("429")) {
    return "Você fez muitas solicitações. Aguarde alguns instantes e tente novamente"
  }
  if (errorLower.includes("validation") || errorLower.includes("dados inválidos") || errorLower.includes("invalid")) {
    return "Por favor, verifique os dados informados e tente novamente"
  }
  if (errorLower.includes("database") || errorLower.includes("banco de dados") || errorLower.includes("sql")) {
    return "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes"
  }
  if (errorLower.includes("500") || errorLower.includes("internal server") || errorLower.includes("erro ao processar")) {
    return "Ocorreu um erro inesperado. Nossa equipe foi notificada. Por favor, tente novamente em alguns instantes"
  }
  if (context === "contact") {
    if (errorLower.includes("salvar") || errorLower.includes("save")) {
      return "Não foi possível enviar sua mensagem. Verifique os dados informados e tente novamente"
    }
    return "Não foi possível enviar sua mensagem. Tente novamente"
  }
  return error
}

function processValidationErrors(errors: Array<{ path: (string | number)[]; message: string }>): string {
  if (errors.length === 0) return "Por favor, verifique os dados informados"
  if (errors.length === 1) {
    const error = errors[0]
    const field = error.path[0]?.toString() || ""
    const fieldNames: Record<string, string> = {
      name: "Nome",
      email: "E-mail",
      phone: "Telefone",
      subject: "Assunto",
      message: "Mensagem",
    }
    const fieldName = fieldNames[field] || field
    if (error.message.includes("min") || error.message.includes("pelo menos")) {
      const match = error.message.match(/(\d+)/)
      const min = match ? match[1] : "alguns"
      return `O campo "${fieldName}" deve ter pelo menos ${min} caracteres`
    }
    return error.message
  }
  const friendlyErrors = errors.slice(0, 3).map((error) => {
    const field = error.path[0]?.toString() || ""
    const fieldNames: Record<string, string> = {
      name: "Nome",
      email: "E-mail",
      phone: "Telefone",
      subject: "Assunto",
      message: "Mensagem",
    }
    const fieldName = fieldNames[field] || field
    return error.message.replace(field, fieldName)
  })
  if (errors.length > 3) {
    return `${friendlyErrors.join(". ")}. E mais ${errors.length - 3} erro(s)`
  }
  return friendlyErrors.join(". ")
}

export function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setIsLoading(true)

    const formData = new FormData(form)
    const phoneValue = formData.get("phone")
    const phone = phoneValue && typeof phoneValue === "string" && phoneValue.trim() !== ""
      ? phoneValue
      : undefined
    
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: phone,
      subject: formData.get("subject"),
      message: formData.get("message"),
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      let responseData: { error?: string; details?: Array<{ path: (string | number)[]; message: string }> } = {}
      try {
        responseData = await response.json()
      } catch {
        if (!response.ok) {
          throw new Error("Resposta inválida do servidor")
        }
      }

      if (response.ok) {
        const phone = formData.get("phone") as string
        toast({
          title: "Mensagem enviada!",
          description: phone && phone.trim() !== ""
            ? "Entraremos em contato em breve. Você receberá uma confirmação via WhatsApp."
            : "Entraremos em contato em breve.",
        })
        form.reset()
      } else {
        // Processar erro amigável
        let errorMessage = "Não foi possível enviar sua mensagem. Por favor, tente novamente."

        if (responseData.details && Array.isArray(responseData.details)) {
          errorMessage = processValidationErrors(responseData.details)
        } else if (responseData.error) {
          errorMessage = translateApiError(responseData.error, "contact")
        }

        toast({
          title: "Não foi possível enviar",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      const errorMessage = translateApiError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "contact"
      )

      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome Completo</Label>
        <Input id="name" name="name" placeholder="Seu nome" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone / WhatsApp (Opcional)</Label>
        <Input id="phone" name="phone" type="tel" placeholder="(34) 93300-5932" />
        <p className="text-xs text-muted-foreground">
          Se informado, você receberá uma confirmação via WhatsApp
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Assunto</Label>
        <Input id="subject" name="subject" placeholder="Como podemos ajudar?" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensagem</Label>
        <Textarea id="message" name="message" placeholder="Descreva sua necessidade ou dúvida..." rows={5} required />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar Mensagem"
        )}
      </Button>
    </form>
  )
}
