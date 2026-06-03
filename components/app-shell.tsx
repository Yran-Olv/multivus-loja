"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/contexts/CartContext"
import { CustomerProvider } from "@/contexts/CustomerContext"
import { ChatWidget } from "@/components/chat-widget"
import { GoogleAnalytics } from "@/components/google-analytics"

function needsCustomerSession(pathname: string): boolean {
  return (
    pathname.startsWith("/cliente") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/carrinho") ||
    pathname.startsWith("/servicos") ||
    pathname.startsWith("/softwares")
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const isAdmin = pathname.startsWith("/admin")
  const checkCustomer = !isAdmin && needsCustomerSession(pathname)
  const hideChat =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/carrinho") ||
    pathname.startsWith("/pedido")

  if (isAdmin) {
    return (
      <CartProvider>
        {children}
        <Toaster />
      </CartProvider>
    )
  }

  return (
    <CustomerProvider checkSession={checkCustomer}>
      <CartProvider>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        {!hideChat && <ChatWidget />}
        <Toaster />
        <GoogleAnalytics />
      </CartProvider>
    </CustomerProvider>
  )
}
