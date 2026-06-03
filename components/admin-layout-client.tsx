"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const isLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login/")

  if (isLogin) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
