import { sql } from "@/lib/db"
import type { Product } from "@/lib/db"
import { notFound } from "next/navigation"
import { ImageWithWatermark } from "@/components/image-with-watermark"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, Check } from "lucide-react"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { ProductReviews } from "@/components/product-reviews"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!sql) {
    notFound()
  }

  const products = (await sql!`
    SELECT * FROM products WHERE id = ${id} AND is_active = true
  `) as unknown as Product[]

  if (products.length === 0) {
    notFound()
  }

  const product = products[0]

  return (
    <div className="flex flex-col">
      {/* Breadcrumb */}
      <section className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/produtos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Produtos
          </Link>
        </div>
      </section>

      {/* Product Details */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-6xl mx-auto">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-square relative bg-card rounded-lg overflow-hidden border max-w-full max-h-[500px] sm:max-h-[600px] md:max-h-[700px] mx-auto">
                {product.image_url && product.image_url.trim() !== "" ? (
                  <ImageWithWatermark
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    showWatermark={true}
                    watermarkPosition="bottom-right"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-24 w-24 sm:h-32 sm:w-32 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="secondary" className="mb-3">
                  {product.category}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">{product.description}</p>
              </div>

              <div className="border-t border-b py-6">
                <p className="text-4xl font-bold text-primary mb-2">R$ {Number(product.price).toFixed(2).replace(".", ",")}</p>
                {product.stock_quantity > 0 ? (
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {product.stock_quantity} unidades em estoque
                  </p>
                ) : (
                  <p className="text-destructive">Produto fora de estoque</p>
                )}
              </div>

              <div className="space-y-3">
                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image_url: product.image_url,
                    stock_quantity: product.stock_quantity,
                  }}
                />
                <Link href="/contato">
                  <Button variant="outline" size="lg" className="w-full">
                    Solicitar Orçamento
                  </Button>
                </Link>
              </div>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Especificações Técnicas</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.specifications && 
                   typeof product.specifications === 'object' && 
                   product.specifications !== null &&
                   Object.keys(product.specifications).length > 0 ? (
                    <dl className="space-y-3">
                      {Object.entries(product.specifications).map(([key, value]) => {
                        // Ignorar chaves numéricas vazias ou valores inválidos
                        if (!key || !value || value === "" || value === null) {
                          return null
                        }
                        return (
                          <div
                            key={key}
                            className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                          >
                            <dt className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</dt>
                            <dd className="font-medium text-right">{String(value)}</dd>
                          </div>
                        )
                      })}
                    </dl>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nenhuma especificação técnica cadastrada para este produto.</p>
                  )}
                </CardContent>
              </Card>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium">Garantia</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.warranty || "12 meses"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium">Entrega</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.delivery || "Consultar"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium">Suporte</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.support || "Especializado"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </section>
    </div>
  )
}
