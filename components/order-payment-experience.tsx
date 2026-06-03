"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, Loader2, PartyPopper, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Props = {
  orderId: string
  orderNumber: string
  customerName: string
  totalAmount: number
  initialPaymentStatus: string
  initialOrderStatus: string
  initialPixCode: string
  showPixPanel: boolean
}

const statusMap: Record<string, string> = {
  pending: "Pendente",
  processing: "Em processamento",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
}

const paymentStatusMap: Record<string, string> = {
  pending: "Aguardando pagamento",
  paid: "Pago",
  failed: "Falhou",
}

export function OrderPaymentExperience({
  orderId,
  orderNumber,
  customerName,
  totalAmount,
  initialPaymentStatus,
  initialOrderStatus,
  initialPixCode,
  showPixPanel,
}: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const celebrated = useRef(false)
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus)
  const [pixCode, setPixCode] = useState(initialPixCode)
  const [copying, setCopying] = useState(false)
  const [checking, setChecking] = useState(false)

  const isPaid = paymentStatus === "paid"
  const firstName = customerName.split(" ")[0] || customerName

  const celebrate = useCallback(() => {
    if (celebrated.current) return
    celebrated.current = true
    toast({
      title: "Pagamento confirmado!",
      description: "Recebemos seu Pix. Obrigado pela compra!",
    })
    router.refresh()
  }, [toast, router])

  const fetchStatus = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-status`, { cache: "no-store" })
      if (!res.ok) return null
      const data = await res.json()
      if (data.pix_copia_cola) setPixCode(data.pix_copia_cola)
      setPaymentStatus((prev) => {
        if (prev !== "paid" && data.payment_status === "paid") {
          celebrate()
        }
        return data.payment_status
      })
      setOrderStatus(data.status)
      return data.payment_status as string
    } catch {
      return null
    }
  }, [orderId, celebrate])

  useEffect(() => {
    if (isPaid) return
    void fetchStatus()
    const t = setInterval(fetchStatus, 4000)
    return () => clearInterval(t)
  }, [isPaid, fetchStatus])

  const manualCheck = async () => {
    setChecking(true)
    const status = await fetchStatus()
    setChecking(false)
    if (status !== "paid") {
      toast({
        title: "Pagamento ainda não identificado",
        description: "Se você acabou de pagar, aguarde alguns segundos e tente novamente.",
      })
    }
  }

  const copyPix = async () => {
    if (!pixCode) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(pixCode)
      toast({ title: "Pix copiado!", description: "Cole no app do seu banco para pagar." })
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Selecione o código e copie manualmente.",
        variant: "destructive",
      })
    } finally {
      setCopying(false)
    }
  }

  const orderStatusText = statusMap[orderStatus] || orderStatus
  const paymentStatusText = paymentStatusMap[paymentStatus] || paymentStatus
  const qrUrl = pixCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`
    : ""

  return (
    <>
      <div className="text-center mb-8">
        {isPaid ? (
          <div className="rounded-2xl border border-green-500/40 bg-green-500/10 px-6 py-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-center gap-2 mb-4">
              <PartyPopper className="h-10 w-10 text-green-500" />
              <CheckCircle className="h-12 w-12 text-green-500" />
              <Sparkles className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-green-600 dark:text-green-400">
              Pagamento confirmado!
            </h1>
            <p className="text-lg text-muted-foreground mb-1">
              Obrigado, {firstName}! Seu pedido foi recebido com sucesso.
            </p>
            <p className="text-sm text-muted-foreground">
              Pedido <span className="font-semibold text-foreground">{orderNumber}</span> — em breve
              você receberá a confirmação por e-mail e WhatsApp.
            </p>
          </div>
        ) : (
          <>
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Pedido recebido!</h1>
            <p className="text-muted-foreground">
              Olá, {firstName}. Falta só o pagamento Pix para confirmarmos seu pedido.
            </p>
          </>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Detalhes do Pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Número do Pedido:</span>
            <span className="font-bold text-right">{orderNumber}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={orderStatus === "confirmed" || isPaid ? "default" : "secondary"}>
              {isPaid ? "Confirmado" : orderStatusText}
            </Badge>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Status do Pagamento:</span>
            <Badge
              variant={
                isPaid ? "default" : paymentStatus === "failed" ? "destructive" : "secondary"
              }
              className={isPaid ? "bg-green-600 hover:bg-green-600" : undefined}
            >
              {paymentStatusText}
            </Badge>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Total:</span>
            <span className="font-bold text-lg">
              R$ {totalAmount.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </CardContent>
      </Card>

      {showPixPanel && !isPaid && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle>Pagamento Pix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pixCode ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando dados do Pix...
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code ou copie o código. Após pagar, esta página atualiza sozinha em
                  poucos segundos.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="QR Code Pix"
                    width={220}
                    height={220}
                    className="rounded-lg border bg-white p-2"
                  />
                  <div className="flex-1 w-full space-y-3">
                    <p className="text-sm font-medium">
                      Valor: R$ {totalAmount.toFixed(2).replace(".", ",")}
                    </p>
                    <Button type="button" className="w-full" onClick={copyPix} disabled={copying}>
                      {copying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copiar código Pix
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={manualCheck}
                      disabled={checking}
                    >
                      {checking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        "Já paguei — verificar agora"
                      )}
                    </Button>
                  </div>
                </div>
                <pre className="text-xs bg-muted p-3 rounded-md break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {pixCode}
                </pre>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {isPaid && (
        <Card className="mb-6 border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 shrink-0 text-green-600" />
            <p className="text-sm text-muted-foreground">
              Pagamento recebido. Nossa equipe já foi notificada e em breve processará seu pedido.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
