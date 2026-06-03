"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Loader2, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type OrderPixPanelProps = {
  orderId: number
  pixCopiaCola: string | null
  totalAmount: number
  paymentStatus: string
  paymentIntentId: string | null
}

export function OrderPixPanel({
  orderId,
  pixCopiaCola,
  totalAmount,
  paymentStatus,
  paymentIntentId,
}: OrderPixPanelProps) {
  const { toast } = useToast()
  const [sending, setSending] = useState(false)

  if (!pixCopiaCola && !paymentIntentId) return null

  const copyPix = async () => {
    if (!pixCopiaCola) return
    try {
      await navigator.clipboard.writeText(pixCopiaCola)
      toast({ title: "Pix copiado" })
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" })
    }
  }

  const resendWhatsApp = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/resend-pix`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast({ title: "Pix reenviado no WhatsApp" })
      } else {
        throw new Error(data.error || "Erro")
      }
    } catch (e) {
      toast({
        title: "Não foi possível reenviar",
        description: e instanceof Error ? e.message : "Erro",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento Pix (Efí)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {paymentIntentId && (
          <p className="text-xs text-muted-foreground">
            TXID: <code>{paymentIntentId}</code>
          </p>
        )}
        <p className="text-sm">
          Status: <strong>{paymentStatus}</strong> — R${" "}
          {Number(totalAmount).toFixed(2).replace(".", ",")}
        </p>
        {pixCopiaCola ? (
          <>
            <pre className="text-xs bg-muted p-2 rounded max-h-28 overflow-y-auto break-all whitespace-pre-wrap">
              {pixCopiaCola}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={copyPix}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar Pix
              </Button>
              {paymentStatus !== "paid" && (
                <Button type="button" size="sm" onClick={resendWhatsApp} disabled={sending}>
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-1" />
                  )}
                  Reenviar no WhatsApp
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Código Pix não salvo neste pedido.</p>
        )}
      </CardContent>
    </Card>
  )
}
