"use client"

import { useEffect, useRef, useState } from "react"
import {
  buildCheckoutFormData,
  enrichCheckoutFromCep,
  formatDeliverySummary,
  getMissingCheckoutFields,
  prepareOrderCheckoutData,
} from "@/lib/checkout-prefill"
import { useCart } from "@/contexts/CartContext"
import { useCustomer } from "@/contexts/CustomerContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"
// Funções utilitárias para traduzir erros (inline para evitar problemas de importação)
function translateApiError(error: string, context?: string): string {
  const errorLower = error.toLowerCase()

  if (errorLower.includes("network") || errorLower.includes("fetch") || errorLower.includes("connection") || errorLower.includes("conexão")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente"
  }
  if (errorLower.includes("unauthorized") || errorLower.includes("não autenticado") || errorLower.includes("autenticação")) {
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
  if (errorLower.includes("404") || errorLower.includes("not found") || errorLower.includes("não encontrado")) {
    return "O que você está procurando não foi encontrado"
  }
  if (context === "order") {
    if (errorLower.includes("salvar") || errorLower.includes("save")) {
      return "Não foi possível processar seu pedido. Verifique os dados informados e tente novamente"
    }
    return "Não foi possível processar seu pedido. Tente novamente"
  }
  return error
}

function processValidationErrors(errors: Array<{ path: (string | number)[]; message: string }>): string {
  if (errors.length === 0) {
    return "Por favor, verifique os dados informados"
  }
  if (errors.length === 1) {
    const error = errors[0]
    const field = error.path[0]?.toString() || ""
    const fieldNames: Record<string, string> = {
      customer_name: "Nome",
      customer_email: "E-mail",
      customer_phone: "Telefone",
      customer_address: "Endereço",
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
      customer_address: "Endereço",
    }
    const fieldName = fieldNames[field] || field
    if (error.message.includes("min") || error.message.includes("pelo menos")) {
      const match = error.message.match(/(\d+)/)
      const min = match ? match[1] : "alguns"
      return `O campo "${fieldName}" deve ter pelo menos ${min} caracteres`
    }
    return error.message
  })
  if (errors.length > 3) {
    return `${friendlyErrors.join(". ")}. E mais ${errors.length - 3} erro(s)`
  }
  return friendlyErrors.join(". ")
}

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart()
  const { customer, lastOrder, loading: customerLoading } = useCustomer()
  const prefillDone = useRef(false)
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCep, setLoadingCep] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: "",
  })

  const total = getTotal()
  const loggedInCheckout = !!customer
  const loggedInSimple = loggedInCheckout && !showEditForm
  const showDeliveryForm = !loggedInCheckout || showEditForm

  useEffect(() => {
    if (customerLoading) return
    if (!customer) {
      prefillDone.current = false
      return
    }
    if (prefillDone.current) return
    prefillDone.current = true
    const initial = buildCheckoutFormData(customer, lastOrder)
    setFormData(initial)
    setShowEditForm(false)
    void enrichCheckoutFromCep(initial).then(setFormData)
  }, [customer, lastOrder, customerLoading])

  async function saveCustomerProfile(data: typeof formData) {
    if (!customer) return
    try {
      await fetch("/api/customers/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.customer_name,
          phone: data.customer_phone,
          address: data.customer_address,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
        }),
      })
    } catch {
      /* não bloqueia pedido */
    }
  }

  const fetchAddressByCep = async (cepRaw: string) => {
    const cep = cepRaw.replace(/\D/g, "")
    if (cep.length !== 8) return
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (data.erro) return
      setFormData((prev) => ({
        ...prev,
        customer_address:
          prev.customer_address ||
          [data.logradouro, data.bairro].filter(Boolean).join(", ") ||
          prev.customer_address,
        city: prev.city || data.localidade || "",
        state: prev.state || data.uf || "",
        zip_code: prev.zip_code || cep.replace(/(\d{5})(\d{3})/, "$1-$2"),
      }))
    } catch {
      /* CEP opcional */
    } finally {
      setLoadingCep(false)
    }
  }

  if (customerLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-8">Adicione produtos ao carrinho para continuar</p>
          <Link href="/produtos">
            <Button size="lg">Ver Produtos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      let checkoutData = formData
      if (customer) {
        checkoutData = prepareOrderCheckoutData(
          await enrichCheckoutFromCep(formData)
        )
        setFormData(checkoutData)
        const missing = getMissingCheckoutFields(checkoutData)
        if (missing.length > 0) {
          setShowEditForm(true)
          toast({
            title: "Endereço incompleto",
            description:
              "Complete ou corrija seu endereço nos campos abaixo para finalizar o pedido.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }
      }

      // Criar pedido
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...checkoutData,
          skip_whatsapp: true,
          items: items.map((item) => ({
            product_id: item.id,
            product_name: item.name,
            product_price: Number(item.price),
            quantity: item.quantity,
            subtotal: Number(item.price) * item.quantity,
            image_url: item.image_url || null,
          })),
          total_amount: total,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await saveCustomerProfile(checkoutData)

        // Criar pagamento Pix (Efí / Gerencianet)
        try {
          const paymentResponse = await fetch("/api/efi/create-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: data.order.id,
              items: items.map((item) => ({
                product_id: item.id,
                product_name: item.name,
                product_price: Number(item.price),
                quantity: item.quantity,
                subtotal: Number(item.price) * item.quantity,
              })),
              total_amount: total,
              customer: {
                name: checkoutData.customer_name,
                email: checkoutData.customer_email,
                phone: checkoutData.customer_phone.replace(/\D/g, ""), // Apenas números
                address: checkoutData.customer_address,
                city: checkoutData.city,
                state: checkoutData.state,
                zip_code: checkoutData.zip_code,
              },
            }),
          })

          const paymentData = await paymentResponse.json()

          const pixCode = paymentData.pix_copia_cola || paymentData.qr_code

          if (paymentResponse.ok && pixCode) {
            clearCart()
            toast({
              title: "Pedido criado!",
              description: "Pague via Pix para confirmar o pedido.",
            })
            router.push(`/pedido/${data.order.id}?payment=pix`)
            return
          } else if (paymentResponse.ok && paymentData.payment_url) {
            window.location.href = paymentData.payment_url
            return
          } else if (paymentResponse.status === 400 && paymentData.error?.includes("não configurado")) {
            console.warn("Efí não configurado, pedido criado sem pagamento online")
          } else {
            console.error("Erro ao criar pagamento:", paymentData.error || "Erro desconhecido")
          }
        } catch (paymentError) {
          console.error("Erro ao criar pagamento:", paymentError)
          // Continuar mesmo se o pagamento falhar - o pedido já foi criado
        }

        // Se não conseguiu criar pagamento, apenas redirecionar para página do pedido
        clearCart()
        toast({
          title: "Pedido realizado!",
          description: "Seu pedido foi confirmado. Você receberá instruções de pagamento por email.",
        })
        router.push(`/pedido/${data.order.id}`)
      } else {
        // Processar erro amigável
        let errorMessage = "Não foi possível processar seu pedido. Por favor, verifique os dados informados e tente novamente."

        if (data.details && Array.isArray(data.details)) {
          errorMessage = processValidationErrors(data.details)
        } else if (data.error) {
          errorMessage = translateApiError(data.error, "order")
        }

        toast({
          title: "Não foi possível processar",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao processar pedido:", error)
      const errorMessage = translateApiError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "order"
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div
          className={
            loggedInSimple
              ? "max-w-xl mx-auto space-y-6"
              : "grid grid-cols-1 lg:grid-cols-3 gap-8"
          }
        >
          {showDeliveryForm && (
            <div className={loggedInSimple ? "" : "lg:col-span-2 space-y-6"}>
              <Card>
                <CardHeader>
                  <CardTitle>Dados de Entrega</CardTitle>
                  {!customer && (
                    <p className="text-sm text-muted-foreground font-normal">
                      Preencha seus dados para entrega ou{" "}
                      <Link href="/cliente" className="text-primary underline">
                        faça login
                      </Link>{" "}
                      para agilizar.
                    </p>
                  )}
                  {loggedInCheckout && showEditForm && (
                    <p className="text-sm text-muted-foreground font-normal">
                      Ajuste o endereço e volte ao resumo quando terminar.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer_name">Nome Completo *</Label>
                      <Input
                        id="customer_name"
                        required
                        value={formData.customer_name}
                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer_email">Email *</Label>
                      <Input
                        id="customer_email"
                        type="email"
                        required
                        value={formData.customer_email}
                        onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Telefone *</Label>
                    <Input
                      id="customer_phone"
                      required
                      value={formData.customer_phone}
                      onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                      placeholder="(34) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_address">Endereço Completo *</Label>
                    <Textarea
                      id="customer_address"
                      required
                      value={formData.customer_address}
                      onChange={(e) =>
                        setFormData({ ...formData, customer_address: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        required
                        maxLength={2}
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value.toUpperCase() })
                        }
                        placeholder="MG"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip_code">CEP *</Label>
                      <Input
                        id="zip_code"
                        required
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        onBlur={(e) => fetchAddressByCep(e.target.value)}
                        placeholder="38175-000"
                      />
                      {loadingCep && (
                        <p className="text-xs text-muted-foreground">Buscando endereço...</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Informações adicionais sobre a entrega..."
                    />
                  </div>
                  {loggedInCheckout && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEditForm(false)}
                    >
                      Voltar ao resumo
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className={loggedInSimple ? "" : "lg:col-span-1"}>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
                {loggedInSimple && (
                  <p className="text-sm text-muted-foreground font-normal">
                    Olá, {customer?.name?.split(" ")[0]}. Entrega com os dados da sua conta.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {loggedInSimple && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Entrega
                    </p>
                    <div className="rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-wrap">
                      {formatDeliverySummary(formData)}
                    </div>
                    <div>
                      <Label htmlFor="notes-inline">Observações (opcional)</Label>
                      <Textarea
                        id="notes-inline"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                        placeholder="Complemento, referência..."
                      />
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-sm"
                      onClick={() => setShowEditForm(true)}
                    >
                      Alterar endereço de entrega
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.name} x{item.quantity}
                      </span>
                      <span>R$ {(Number(item.price) * item.quantity).toFixed(2).replace(".", ",")}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {Number(total).toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span>Calculado após confirmação</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>R$ {Number(total).toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Finalizar Pedido"
                  )}
                </Button>
                <Link href="/carrinho">
                  <Button variant="outline" className="w-full">
                    Voltar ao Carrinho
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

