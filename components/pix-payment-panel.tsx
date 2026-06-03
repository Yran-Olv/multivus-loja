"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type PixPaymentPanelProps = {
  orderId: string
  initialPixCode?: string
  totalAmount: number
  initialPaymentStatus: string
}

export function PixPaymentPanel({
  orderId,
  initialPixCode = "",
  totalAmount,
  initialPaymentStatus,
}: PixPaymentPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [pixCode, setPixCode] = useState(initialPixCode)
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [copying, setCopying] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/payment-status`)
      if (!res.ok) return
      const data = await res.json()
      if (data.pix_copia_cola) setPixCode(data.pix_copia_cola)
      setPaymentStatus(data.payment_status)
      if (data.payment_status === "paid") {
        router.refresh()
      }
    } catch {
      /* ignore */
    }
  }, [orderId, router])

  useEffect(() => {
    if (!initialPixCode) fetchStatus()
  }, [initialPixCode, fetchStatus])

  useEffect(() => {
    if (paymentStatus === "paid") return
    const t = setInterval(fetchStatus, 5000)
    return () => clearInterval(t)
  }, [paymentStatus, fetchStatus])

  const copyPix = async () => {
    if (!pixCode) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(pixCode)
      toast({ title: "Pix copiado!", description: "Cole no app do seu banco para pagar." })
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Selecione o código abaixo e copie manualmente.",
        variant: "destructive",
      })
    } finally {
      setCopying(false)
    }
  }

  if (paymentStatus === "paid") {
    return (
      <Card className="mb-6 border-green-500/50">
        <CardContent className="pt-6 flex items-center gap-3 text-green-600">
          <CheckCircle className="h-8 w-8 shrink-0" />
          <div>
            <p className="font-semibold">Pagamento recebido!</p>
            <p className="text-sm text-muted-foreground">Seu pedido foi confirmado automaticamente.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pixCode) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando dados do Pix...
        </CardContent>
      </Card>
    )
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pixCode)}`

  return (
    <Card className="mb-6 border-primary">
      <CardHeader>
        <CardTitle>Pagamento Pix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code ou copie o código no app do seu banco. A confirmação é automática em alguns segundos.
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
          </div>
        </div>
        <pre className="text-xs bg-muted p-3 rounded-md break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
          {pixCode}
        </pre>
      </CardContent>
    </Card>
  )
}
