"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function OrderFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleStatusChange = (status: string) => {
    if (!searchParams) return
    const params = new URLSearchParams(searchParams.toString())
    if (status === "all") {
      params.delete("status")
    } else {
      params.set("status", status)
    }
    router.push(`/admin/pedidos?${params.toString()}`)
  }

  const handlePaymentStatusChange = (paymentStatus: string) => {
    if (!searchParams) return
    const params = new URLSearchParams(searchParams.toString())
    if (paymentStatus === "all") {
      params.delete("payment_status")
    } else {
      params.set("payment_status", paymentStatus)
    }
    router.push(`/admin/pedidos?${params.toString()}`)
  }

  return (
    <div className="flex gap-4 items-end">
      <div className="flex-1">
        <Label htmlFor="status-filter">Status do Pedido</Label>
        <Select
          value={searchParams?.get("status") || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger id="status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="processing">Processando</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label htmlFor="payment-filter">Status do Pagamento</Label>
        <Select
          value={searchParams?.get("payment_status") || "all"}
          onValueChange={handlePaymentStatusChange}
        >
          <SelectTrigger id="payment-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="refunded">Reembolsado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

