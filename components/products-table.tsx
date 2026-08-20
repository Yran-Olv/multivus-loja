"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, EyeOff, PackageMinus } from "lucide-react"
import Link from "next/link"
import { toggleProductStatus, deleteProduct, writeOffProduct } from "@/app/actions/products"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: number
  name: string
  category: string
  price: string
  stock_quantity: number
  is_active: boolean
  has_orders: boolean
  created_at: string
}

export function ProductsTable({ products }: { products: Product[] }) {
  const { toast } = useToast()
  const [items, setItems] = useState(products)
  const [deleting, setDeleting] = useState(false)
  const [writingOff, setWritingOff] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; productId: number | null }>({
    open: false,
    productId: null,
  })
  const [writeOffDialog, setWriteOffDialog] = useState<{ open: boolean; productId: number | null }>({
    open: false,
    productId: null,
  })

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleProductStatus(id)
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_active: !item.is_active } : item)))
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleWriteOff = async () => {
    if (!writeOffDialog.productId || writingOff) return

    setWritingOff(true)
    try {
      const result = await writeOffProduct(writeOffDialog.productId)
      if (!result.ok) {
        toast({
          title: "Não foi possível dar baixa",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === writeOffDialog.productId
            ? { ...item, stock_quantity: 0, is_active: false }
            : item
        )
      )
      setWriteOffDialog({ open: false, productId: null })
      toast({
        title: "Baixa registrada",
        description: "Estoque zerado e produto desativado (venda externa).",
      })
    } finally {
      setWritingOff(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.productId || deleting) return

    setDeleting(true)
    try {
      const result = await deleteProduct(deleteDialog.productId)
      if (!result.ok) {
        toast({
          title: "Não foi possível excluir",
          description: result.error,
          variant: "destructive",
        })
        return
      }
      setItems((prev) => prev.filter((item) => item.id !== deleteDialog.productId))
      setDeleteDialog({ open: false, productId: null })
      toast({ title: "Produto excluído" })
    } catch (error: any) {
      toast({
        title: "Não foi possível excluir",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const productToDelete = items.find((p) => p.id === deleteDialog.productId)
  const productToWriteOff = items.find((p) => p.id === writeOffDialog.productId)

  const deleteDescription = (() => {
    if (!productToDelete) return ""
    if (productToDelete.is_active && productToDelete.has_orders) {
      return `“${productToDelete.name}” já teve pedidos no site. Desative ou use “Baixa (venda externa)” antes de excluir.`
    }
    if (!productToDelete.is_active && productToDelete.has_orders) {
      return `Excluir “${productToDelete.name}” do catálogo? Os pedidos antigos continuam no histórico com o nome do produto.`
    }
    return `Excluir “${productToDelete.name}” permanentemente? Esta ação não pode ser desfeita.`
  })()

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
                  {(product.is_active || product.stock_quantity > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setWriteOffDialog({ open: true, productId: product.id })}
                      title="Baixa — vendido fora do site (zera estoque e desativa)"
                    >
                      <PackageMinus className="h-4 w-4 text-amber-600" />
                    </Button>
                  )}
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
                    title="Excluir do catálogo"
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
        open={writeOffDialog.open}
        onOpenChange={(open) => setWriteOffDialog({ open, productId: null })}
        onConfirm={handleWriteOff}
        title="Baixa — venda externa"
        description={`Registrar que “${productToWriteOff?.name}” foi vendido fora do site? O estoque será zerado e o produto ficará inativo no catálogo.`}
        confirmLabel="Confirmar baixa"
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, productId: null })}
        onConfirm={handleDelete}
        title="Excluir produto"
        description={deleteDescription}
      />
    </div>
  )
}
