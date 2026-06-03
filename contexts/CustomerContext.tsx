"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface Customer {
  id: number
  email: string
  name: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
}

export type CustomerRegisterData = {
  name: string
  email: string
  phone: string
  password: string
  address: string
  city: string
  state: string
  zip_code: string
}

export type CustomerLastOrder = {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  notes: string | null
}

interface CustomerContextType {
  customer: Customer | null
  lastOrder: CustomerLastOrder | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: CustomerRegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshCustomer: () => Promise<void>
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({
  children,
  checkSession = true,
}: {
  children: ReactNode
  /** false em páginas que não precisam de sessão de cliente (ex.: /produtos) */
  checkSession?: boolean
}) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [lastOrder, setLastOrder] = useState<CustomerLastOrder | null>(null)
  const [loading, setLoading] = useState(checkSession)

  const fetchCustomer = async () => {
    try {
      const response = await fetch("/api/customers/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setCustomer(data.customer ?? null)
        setLastOrder(data.last_order ?? null)
      } else {
        setCustomer(null)
        setLastOrder(null)
      }
    } catch (error) {
      console.error("[CustomerContext] Error fetching customer:", error)
      setCustomer(null)
      setLastOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!checkSession) {
      setLoading(false)
      return
    }
    fetchCustomer()
  }, [checkSession])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/customers/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        await fetchCustomer()
        return { success: true }
      } else {
        return { success: false, error: data.error || "Erro ao fazer login" }
      }
    } catch (error) {
      return { success: false, error: "Erro ao conectar com o servidor" }
    }
  }

  const register = async (data: CustomerRegisterData) => {
    try {
      const response = await fetch("/api/customers/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        await fetchCustomer()
        return { success: true }
      } else {
        return { success: false, error: result.error || "Erro ao criar conta" }
      }
    } catch (error) {
      return { success: false, error: "Erro ao conectar com o servidor" }
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/customers/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setCustomer(null)
      setLastOrder(null)
    } catch (error) {
      console.error("[CustomerContext] Error logging out:", error)
    }
  }

  const refreshCustomer = async () => {
    await fetchCustomer()
  }

  return (
    <CustomerContext.Provider value={{ customer, lastOrder, loading, login, register, logout, refreshCustomer }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomer() {
  const context = useContext(CustomerContext)
  if (context === undefined) {
    throw new Error("useCustomer must be used within a CustomerProvider")
  }
  return context
}

