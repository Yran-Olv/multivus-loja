import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OrderPaymentExperience } from "@/components/order-payment-experience"

export const dynamic = "force-dynamic"

export default async function OrderPage({ 
  params,
  searchParams,
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment?: string; success?: string; qr_code?: string }>
}) {
  const { id } = await params
  const search = await searchParams
  const pixFromUrl = search.qr_code ? decodeURIComponent(search.qr_code) : ""

  if (!sql) {
    notFound()
  }

  const orders = (await sql!`
    SELECT * FROM orders WHERE id = ${id}
  `) as any[]

  if (orders.length === 0) {
    notFound()
  }

  const order = orders[0]

  const items = (await sql!`
    SELECT * FROM order_items WHERE order_id = ${id}
  `) as any[]

  const showPixPanel =
    (search.payment === "pix" || order.pix_copia_cola || order.payment_method === "efi_pix") &&
    order.payment_status !== "paid"

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <OrderPaymentExperience
          orderId={id}
          orderNumber={order.order_number}
          customerName={order.customer_name}
          totalAmount={Number(order.total_amount)}
          initialPaymentStatus={order.payment_status}
          initialOrderStatus={order.status}
          initialPixCode={pixFromUrl || order.pix_copia_cola || ""}
          showPixPanel={showPixPanel}
        />

        <Card className="mb-6">
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

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Dados de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-muted-foreground">{order.customer_email}</p>
            <p className="text-muted-foreground">{order.customer_phone}</p>
            <p className="text-muted-foreground">{order.customer_address}</p>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          {order.payment_status === "paid" ? (
            <p className="text-muted-foreground">
              ✅ Pagamento confirmado! Você receberá um email de confirmação em breve. Nossa equipe processará seu pedido.
            </p>
          ) : order.payment_method === "efi_pix" || order.pix_copia_cola ? (
            <p className="text-muted-foreground">
              Pague o Pix acima para confirmar o pedido automaticamente. Você também receberá o código no WhatsApp, se informou o telefone.
            </p>
          ) : (
            <p className="text-muted-foreground">
              Você receberá um email de confirmação em breve. Nossa equipe entrará em contato para finalizar o pagamento.
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Link href="/produtos">
              <Button variant="outline">Continuar Comprando</Button>
            </Link>
            <Link href="/">
              <Button>Voltar ao Início</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

