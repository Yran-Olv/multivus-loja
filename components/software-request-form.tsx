"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCustomer } from "@/contexts/CustomerContext"
import { useRouter } from "next/navigation"
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
  if (context === "software-request") {
    if (errorLower.includes("salvar") || errorLower.includes("save")) {
      return "Não foi possível enviar sua solicitação. Verifique os dados informados e tente novamente"
    }
    if (errorLower.includes("whatsapp") || errorLower.includes("envio")) {
      return "Não foi possível enviar para o WhatsApp. Verifique se o número está correto e tente novamente"
    }
    return "Não foi possível processar sua solicitação. Tente novamente"
  }
  return error
}

function processValidationErrors(errors: Array<{ path: (string | number)[]; message: string }>): string {
  if (errors.length === 0) return "Por favor, verifique os dados informados"
  if (errors.length === 1) {
    const error = errors[0]
    const field = error.path[0]?.toString() || ""
    const fieldNames: Record<string, string> = {
      customer_name: "Nome",
      customer_phone: "Telefone",
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
      customer_name: "Nome",
      customer_phone: "Telefone",
    }
    const fieldName = fieldNames[field] || field
    return error.message.replace(field, fieldName)
  })
  if (errors.length > 3) {
    return `${friendlyErrors.join(". ")}. E mais ${errors.length - 3} erro(s)`
  }
  return friendlyErrors.join(". ")
}

interface SoftwareRequestFormProps {
  softwareId: number
  softwareName: string
  softwarePrice: number | null
  isFree: boolean
}

export function SoftwareRequestForm({
  softwareId,
  softwareName,
  softwarePrice,
  isFree,
}: SoftwareRequestFormProps) {
  const { customer, loading: customerLoading } = useCustomer()
  const [loading, setLoading] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  async function handleDirectSend() {
    if (!customer) return
    if (!customer.phone) {
      toast({
        title: "WhatsApp não cadastrado",
        description: "Atualize seu perfil com o WhatsApp para enviar direto.",
        variant: "destructive",
      })
      router.push("/cliente")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/customers/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "software",
          data: {
            software_id: softwareId,
            software_name: softwareName,
            software_price: softwarePrice,
            is_free: isFree,
          },
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        toast({
          title: "Enviado para seu WhatsApp!",
          description: "Os detalhes do software foram enviados para seu WhatsApp.",
        })
      } else {
        const errorMessage = translateApiError(
          responseData.error || "Erro desconhecido",
          "software-request"
        )

        toast({
          title: "Não foi possível enviar",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar direto:", error)
      const errorMessage = translateApiError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "software-request"
      )

      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Se cliente está logado, enviar direto
    if (customer && customer.phone) {
      await handleDirectSend()
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/software-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          software_id: softwareId,
          software_name: softwareName,
          software_price: softwarePrice,
          is_free: isFree,
          customer_name: customerName,
          customer_phone: customerPhone,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Solicitação enviada!",
          description: "Enviaremos os detalhes do software para seu WhatsApp em instantes.",
        })
        setCustomerName("")
        setCustomerPhone("")
      } else {
        let errorMessage = "Não foi possível enviar sua solicitação. Por favor, verifique os dados informados."

        if (data.details && Array.isArray(data.details)) {
          errorMessage = processValidationErrors(data.details)
        } else if (data.error) {
          errorMessage = translateApiError(data.error, "software-request")
        }

        toast({
          title: "Não foi possível enviar",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error)
      const errorMessage = translateApiError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "software-request"
      )

      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Se cliente está logado e tem telefone, mostrar botão direto
  if (customer && customer.phone && !customerLoading) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-1">Cliente Logado</p>
          <p className="text-lg font-semibold">{customer.name}</p>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>

        <Button
          onClick={handleDirectSend}
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <MessageCircle className="mr-2 h-4 w-4" />
              {isFree ? "Receber Link de Download" : "Solicitar Informações"}
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Os detalhes do software serão enviados diretamente para seu WhatsApp cadastrado.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer_name">Seu Nome *</Label>
        <Input
          id="customer_name"
          name="customer_name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Digite seu nome completo"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer_phone">WhatsApp *</Label>
        <Input
          id="customer_phone"
          name="customer_phone"
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder="(34) 99999-9999"
          required
        />
        <p className="text-xs text-muted-foreground">
          Enviaremos os detalhes do software para este número
        </p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <MessageCircle className="mr-2 h-4 w-4" />
            {isFree ? "Receber Link de Download" : "Solicitar Informações"}
          </>
        )}
      </Button>
    </form>
  )
}

