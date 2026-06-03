import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { OrderActions } from "./components/order-actions"
import { OrderPixPanel } from "./components/order-pix-panel"

export const dynamic = "force-dynamic"

export default async function AdminPedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!sql) {
    notFound()
  }

  const orders = (await sql!`SELECT * FROM orders WHERE id = ${id}`) as any[]

  if (orders.length === 0) {
    notFound()
  }

  const order = orders[0]

  const items = (await sql!`SELECT * FROM order_items WHERE order_id = ${id}`) as any[]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/pedidos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Pedido #{order.order_number}</h1>
          <p className="text-muted-foreground">
            {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x R$ {Number(item.product_price).toFixed(2)}
                      </p>
                    </div>
                    <p className="font-bold">R$ {Number(item.subtotal).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status do Pedido</p>
                <Badge variant={order.status === "confirmed" ? "default" : "secondary"}>
                  {order.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status do Pagamento</p>
                <Badge variant={order.payment_status === "paid" ? "default" : "outline"}>
                  {order.payment_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold">R$ {Number(order.total_amount).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-sm text-muted-foreground">{order.customer_email}</p>
              <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
              <p className="text-sm text-muted-foreground mt-4">{order.customer_address}</p>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          <OrderPixPanel
            orderId={Number(order.id)}
            pixCopiaCola={order.pix_copia_cola || null}
            totalAmount={Number(order.total_amount)}
            paymentStatus={order.payment_status}
            paymentIntentId={order.payment_intent_id || null}
          />

          <OrderActions order={{
            id: order.id,
            status: order.status,
            payment_status: order.payment_status,
            notes: order.notes || null
          }} />
        </div>
      </div>
    </div>
  )
}

