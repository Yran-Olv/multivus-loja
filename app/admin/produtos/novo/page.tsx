import { ProductForm } from "@/components/product-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NovoProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Novo Produto</h1>
        <p className="text-muted-foreground">Adicione um novo produto ao catálogo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm />
        </CardContent>
      </Card>
    </div>
  )
}
