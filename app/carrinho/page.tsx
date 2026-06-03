"use client"

import { useCart } from "@/contexts/CartContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { ImageWithWatermark } from "@/components/image-with-watermark"

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart()
  const total = getTotal()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h1>
          <p className="text-muted-foreground mb-8">Adicione produtos ao carrinho para continuar</p>
          <Link href="/produtos">
            <Button size="lg">Ver Produtos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Carrinho de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Itens */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {item.image_url && (
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-md overflow-hidden border">
                      <ImageWithWatermark
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        showWatermark={true}
                        watermarkPosition="bottom-right"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                    <p className="text-primary font-bold mb-4">R$ {Number(item.price).toFixed(2).replace(".", ",")}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      R$ {(Number(item.price) * item.quantity).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {Number(total).toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>Calculado no checkout</span>
              </div>
              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>R$ {Number(total).toFixed(2).replace(".", ",")}</span>
              </div>
              <Link href="/checkout" className="block">
                <Button className="w-full" size="lg">
                  Finalizar Compra
                </Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={clearCart}>
                Limpar Carrinho
              </Button>
              <Link href="/produtos" className="block">
                <Button variant="ghost" className="w-full">
                  Continuar Comprando
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

