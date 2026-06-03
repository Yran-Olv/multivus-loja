"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface OrderActionsProps {
  order: {
    id: number
    status: string
    payment_status: string
    notes: string | null
  }
}

export function OrderActions({ order }: OrderActionsProps) {
  const [status, setStatus] = useState(order.status)
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status)
  const [notes, setNotes] = useState(order.notes || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          payment_status: paymentStatus,
          notes: notes || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Pedido atualizado!",
          description: "As informações do pedido foram atualizadas com sucesso.",
        })
        router.refresh()
      } else {
        throw new Error("Erro ao atualizar pedido")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pedido.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="status">Status do Pedido</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="payment_status">Status do Pagamento</Label>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger id="payment_status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="failed">Falhou</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Adicione observações sobre o pedido..."
          />
        </div>

        <Button
          onClick={handleUpdate}
          disabled={loading || (status === order.status && paymentStatus === order.payment_status && notes === (order.notes || ""))}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

