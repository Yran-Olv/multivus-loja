"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface AddToCartButtonProps {
  product: {
    id: number
    name: string
    price: number
    image_url: string | null
    stock_quantity: number
  }
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleAddToCart = () => {
    if (product.stock_quantity === 0) {
      toast({
        title: "Produto fora de estoque",
        description: "Este produto não está disponível no momento.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price), // Garantir que seja número
      image_url: product.image_url,
    })

    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    })

    setLoading(false)
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleAddToCart}
      disabled={product.stock_quantity === 0 || loading}
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {loading ? "Adicionando..." : "Adicionar ao Carrinho"}
    </Button>
  )
}

