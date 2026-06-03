import { sql, type Product } from "@/lib/db"
import { ProductForm } from "@/components/product-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!sql) {
    notFound()
  }

  const products = (await sql!`SELECT * FROM products WHERE id = ${id}`) as unknown as Product[]

  if (products.length === 0) {
    notFound()
  }

  const product = products[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Editar Produto</h1>
        <p className="text-muted-foreground">Atualize as informações do produto</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm product={{
            id: product.id,
            name: product.name,
            description: product.description || "",
            price: product.price.toString(),
            category: product.category,
            image_url: product.image_url || "",
            stock_quantity: product.stock_quantity,
            specifications: product.specifications || {},
            warranty: product.warranty,
            delivery: product.delivery,
            support: product.support
          }} />
        </CardContent>
      </Card>
    </div>
  )
}
