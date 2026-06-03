"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toggleProductStatus, deleteProduct } from "@/app/actions/products"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

interface Product {
  id: number
  name: string
  category: string
  price: string
  stock_quantity: number
  is_active: boolean
  created_at: string
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [items, setItems] = useState(products)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: number | null }>({
    open: false,
    productId: null,
  })

  const handleToggleStatus = async (id: number) => {
    await toggleProductStatus(id)
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_active: !item.is_active } : item)))
  }

  const handleDelete = async () => {
    if (deleteDialog.productId) {
      await deleteProduct(deleteDialog.productId)
      setItems((prev) => prev.filter((item) => item.id !== deleteDialog.productId))
      setDeleteDialog({ open: false, productId: null })
    }
  }

  const productToDelete = items.find((p) => p.id === deleteDialog.productId)

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Produto</th>
            <th className="text-left py-3 px-4">Categoria</th>
            <th className="text-left py-3 px-4">Preço</th>
            <th className="text-left py-3 px-4">Estoque</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-right py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((product) => (
            <tr key={product.id} className="border-b hover:bg-accent/50">
              <td className="py-3 px-4 font-medium">{product.name}</td>
              <td className="py-3 px-4 text-muted-foreground">{product.category}</td>
              <td className="py-3 px-4">R$ {Number(product.price).toFixed(2)}</td>
              <td className="py-3 px-4">{product.stock_quantity}</td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${product.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                >
                  {product.is_active ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(product.id)}
                    title={product.is_active ? "Desativar" : "Ativar"}
                  >
                    {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Link href={`/admin/produtos/${product.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteDialog({ open: true, productId: product.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado</p>}

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, productId: null })}
        onConfirm={handleDelete}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${productToDelete?.name}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  )
}
