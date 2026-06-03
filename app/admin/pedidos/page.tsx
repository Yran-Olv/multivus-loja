import { sql } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { OrderFilters } from "./components/order-filters"

export const dynamic = "force-dynamic"

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; payment_status?: string }>
}) {
  const params = await searchParams
  const { status, payment_status } = params

  if (!sql) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Pedidos</h1>
          <p className="text-muted-foreground">Banco de dados não disponível</p>
        </div>
      </div>
    )
  }

  let query = sql!`SELECT * FROM orders WHERE 1=1`

  if (status) {
    query = sql!`${query} AND status = ${status}`
  }

  if (payment_status) {
    query = sql!`${query} AND payment_status = ${payment_status}`
  }

  query = sql!`${query} ORDER BY created_at DESC`

  const orders = (await query) as unknown as any[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos realizados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderFilters />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {orders.length > 0 ? (
          orders.map((order: any) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">Pedido #{order.order_number}</h3>
                      <Badge variant={order.status === "confirmed" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                      <Badge variant={order.payment_status === "paid" ? "default" : "outline"}>
                        {order.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground mb-2">{order.customer_email}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold mb-2">R$ {Number(order.total_amount).toFixed(2)}</p>
                    <Link href={`/admin/pedidos/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

