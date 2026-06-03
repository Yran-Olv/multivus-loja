"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function CartButton() {
  const { getItemCount } = useCart()
  const itemCount = getItemCount()

  return (
    <Link href="/carrinho" className="relative">
      <Button variant="outline" size="icon">
        <ShoppingCart className="h-4 w-4" />
        {itemCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {itemCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}

