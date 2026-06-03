"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

interface CartItem {
  id: number
  name: string
  price: number
  image_url: string | null
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: { id: number; name: string; price: number; image_url: string | null }) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Carregar carrinho do localStorage ao montar
  useEffect(() => {
    const saved = localStorage.getItem("cart")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Garantir que todos os preços sejam números
        const normalized = parsed.map((item: CartItem) => ({
          ...item,
          price: Number(item.price),
        }))
        setItems(normalized)
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error)
      }
    }
  }, [])

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])

  const addItem = useCallback((product: { id: number; name: string; price: number; image_url: string | null }) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    localStorage.removeItem("cart")
  }, [])

  const getTotal = useCallback(() => {
    return items.reduce((total, item) => total + Number(item.price) * item.quantity, 0)
  }, [items])

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }, [items])

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

