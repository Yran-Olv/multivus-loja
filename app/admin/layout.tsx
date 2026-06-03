import type React from "react"
import { AdminLayoutClient } from "@/components/admin-layout-client"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
