import { sql, type Product } from "@/lib/db"
import { formatDbError, toIsoDate } from "@/lib/admin-db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ProductsTable } from "@/components/products-table"
import { AdminDbError } from "@/components/admin-db-error"

export const dynamic = "force-dynamic"

export default async function AdminProdutosPage() {
  if (!sql) {
    return (
      <div className="space-y-6">
        <AdminDbError title="Banco indisponível" message="Variáveis DB_* não configuradas no container." />
      </div>
    )
  }

  let productsForTable: {
    id: number
    name: string
    category: string
    price: string
    stock_quantity: number
    is_active: boolean
    created_at: string
  }[] = []
  let loadError: string | null = null

  try {
    const products = (await sql!`
      SELECT * FROM products 
      ORDER BY created_at DESC
    `) as unknown as Product[]

    productsForTable = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category || "",
      price: product.price != null ? String(product.price) : "0",
      stock_quantity: product.stock_quantity ?? 0,
      is_active: Boolean(product.is_active),
      created_at: toIsoDate(product.created_at),
    }))
  } catch (error) {
    console.error("[AdminProdutos]", error)
    loadError = formatDbError(error)
  }

  return (
    <div className="space-y-6">
      {loadError ? <AdminDbError title="Erro ao carregar produtos" message={loadError} /> : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Produtos</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova produtos do catálogo</p>
        </div>
        <Link href="/admin/produtos/novo">
          <Button className="gap-2" disabled={!!loadError}>
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {!loadError ? <ProductsTable products={productsForTable} /> : null}
        </CardContent>
      </Card>
    </div>
  )
}
