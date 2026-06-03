"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MessageCircle } from "lucide-react"
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
  if (context === "service-request") {
    if (errorLower.includes("salvar") || errorLower.includes("save")) {
      return "Não foi possível enviar sua solicitação. Verifique os dados informados e tente novamente"
    }
    return "Não foi possível processar sua solicitação de serviço. Tente novamente"
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
      customer_email: "E-mail",
      customer_phone: "Telefone",
      customer_address: "Endereço",
      service_type: "Tipo de serviço",
      device_info: "Informações do equipamento",
      problem_description: "Descrição do problema",
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
      customer_email: "E-mail",
      customer_phone: "Telefone",
      service_type: "Tipo de serviço",
    }
    const fieldName = fieldNames[field] || field
    return error.message.replace(field, fieldName)
  })
  if (errors.length > 3) {
    return `${friendlyErrors.join(". ")}. E mais ${errors.length - 3} erro(s)`
  }
  return friendlyErrors.join(". ")
}

interface ServiceRequestFormProps {
  defaultServiceType?: string
}

export function ServiceRequestForm({ defaultServiceType }: ServiceRequestFormProps = {}) {
  const { customer, loading: customerLoading } = useCustomer()
  const [isLoading, setIsLoading] = useState(false)
  // Inicializar com defaultServiceType se fornecido
  const [selectedServiceType, setSelectedServiceType] = useState<string>(() => defaultServiceType || "")
  const formRef = useRef<HTMLFormElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Atualizar serviço selecionado quando defaultServiceType mudar (apenas uma vez)
  useEffect(() => {
    if (defaultServiceType && defaultServiceType !== selectedServiceType) {
      setSelectedServiceType(defaultServiceType)
    }
  }, [defaultServiceType]) // Não incluir selectedServiceType nas dependências

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

    setIsLoading(true)

    try {
      const response = await fetch("/api/customers/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "service",
          data: {
            service_type: selectedServiceType || "Outro",
            device_info: null,
            problem_description: null,
            priority: "normal",
          },
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        toast({
          title: "Enviado para seu WhatsApp!",
          description: "A mensagem foi enviada para seu WhatsApp. Você pode continuar a conversa por lá.",
        })
      } else {
        toast({
          title: "Erro ao enviar",
          description: responseData.error || "Tente novamente mais tarde.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar direto:", error)
      toast({
        title: "Erro ao enviar",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Se cliente está logado, enviar direto
    if (customer && customer.phone) {
      await handleDirectSend()
      return
    }

    setIsLoading(true)

    const form = e.currentTarget || formRef.current
    if (!form) {
      setIsLoading(false)
      return
    }

    const formData = new FormData(form)
    
    // Converter strings vazias para undefined para campos opcionais (schema vai transformar em null)
    const getOptionalField = (value: FormDataEntryValue | null) => {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return undefined
      }
      return value
    }
    
    const customerAddressValue = formData.get("customer_address")
    const customerAddress = customerAddressValue && typeof customerAddressValue === "string" && customerAddressValue.trim() !== ""
      ? customerAddressValue
      : undefined
    
    const data = {
      customer_name: formData.get("customer_name"),
      customer_email: formData.get("customer_email"),
      customer_phone: formData.get("customer_phone"),
      customer_address: customerAddress,
      service_type: formData.get("service_type") || selectedServiceType,
      device_info: getOptionalField(formData.get("device_info")),
      problem_description: getOptionalField(formData.get("problem_description")),
      priority: formData.get("priority") || "normal",
    }

    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (response.ok) {
        toast({
          title: "Solicitação enviada!",
          description: "Entraremos em contato em breve. Você receberá uma confirmação via WhatsApp se tiver fornecido o número.",
        })
        // Resetar formulário de forma segura
        if (form && form.reset) {
          form.reset()
        }
      } else {
        // Mostrar erro amigável
        let errorMessage = "Não foi possível enviar sua solicitação. Por favor, tente novamente."

        if (responseData.details && Array.isArray(responseData.details)) {
          errorMessage = processValidationErrors(responseData.details)
        } else if (responseData.error) {
          errorMessage = translateApiError(responseData.error, "service-request")
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
        "service-request"
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

  // Se cliente está logado e tem telefone, mostrar botão direto
  if (customer && customer.phone && !customerLoading) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-1">Cliente Logado</p>
          <p className="text-lg font-semibold">{customer.name}</p>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>

        {selectedServiceType && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Serviço Selecionado:</p>
            <p className="text-lg font-semibold">{selectedServiceType}</p>
          </div>
        )}

        <Button
          onClick={handleDirectSend}
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar para meu WhatsApp
            </>
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          A mensagem será enviada diretamente para seu WhatsApp cadastrado. Você pode continuar a conversa por lá.
        </p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Nome Completo *</Label>
          <Input id="customer_name" name="customer_name" placeholder="Seu nome" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_email">E-mail *</Label>
          <Input id="customer_email" name="customer_email" type="email" placeholder="seu@email.com" required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_phone">Telefone / WhatsApp *</Label>
          <Input id="customer_phone" name="customer_phone" type="tel" placeholder="(34) 93300-5932" required />
        </div>

        {!selectedServiceType && (
          <div className="space-y-2">
            <Label htmlFor="service_type">Tipo de Serviço *</Label>
            <Select 
              name="service_type" 
              required 
              onValueChange={(value) => {
                setSelectedServiceType(value)
              }}
            >
              <SelectTrigger id="service_type">
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manutenção de Computadores">Manutenção de Computadores</SelectItem>
                <SelectItem value="Formatação e Instalação">Formatação e Instalação</SelectItem>
                <SelectItem value="Montagem de PC">Montagem de PC</SelectItem>
                <SelectItem value="Remoção de Vírus">Remoção de Vírus</SelectItem>
                <SelectItem value="Backup e Recuperação">Backup e Recuperação</SelectItem>
                <SelectItem value="Upgrade de Hardware">Upgrade de Hardware</SelectItem>
                <SelectItem value="Rede e Cabeamento">Rede e Cabeamento</SelectItem>
                <SelectItem value="Suporte Remoto">Suporte Remoto</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedServiceType && (
        <input type="hidden" name="service_type" value={selectedServiceType} />
      )}

      <div className="space-y-2">
        <Label htmlFor="customer_address">
          Endereço {selectedServiceType ? "*" : "(Opcional)"}
        </Label>
        <Input 
          id="customer_address" 
          name="customer_address" 
          placeholder="Rua, número, bairro, cidade" 
          required={!!selectedServiceType}
        />
      </div>

      {selectedServiceType && (
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary mb-1">Serviço Selecionado:</p>
          <p className="text-lg font-semibold">{selectedServiceType}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="device_info">Informações do Equipamento (Opcional)</Label>
        <Input id="device_info" name="device_info" placeholder="Ex: Notebook Dell Inspiron 15, Desktop montado, etc." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="problem_description">
          Descrição do Problema {selectedServiceType ? "(Opcional)" : "*"}
        </Label>
        <Textarea
          id="problem_description"
          name="problem_description"
          placeholder="Descreva detalhadamente o problema que está enfrentando..."
          rows={4}
          required={!selectedServiceType}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Urgência</Label>
        <Select name="priority" defaultValue="normal">
          <SelectTrigger id="priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baixa - Posso aguardar</SelectItem>
            <SelectItem value="normal">Normal - Alguns dias</SelectItem>
            <SelectItem value="high">Alta - Preciso em breve</SelectItem>
            <SelectItem value="urgent">Urgente - Preciso imediatamente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar Solicitação"
        )}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        Ao enviar, você concorda que entraremos em contato por e-mail ou telefone
      </p>
    </form>
  )
}
