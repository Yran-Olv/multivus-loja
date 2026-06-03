"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Monitor, LayoutDashboard, Package, Wrench, MessageSquare, FileText, Code, LogOut, ShoppingBag, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Produtos", href: "/admin/produtos", icon: Package },
  { name: "Softwares", href: "/admin/softwares", icon: Code },
  { name: "Serviços", href: "/admin/servicos", icon: Wrench },
  { name: "Solicitações", href: "/admin/solicitacoes", icon: FileText },
  { name: "Mensagens", href: "/admin/mensagens", icon: MessageSquare },
  { name: "Pedidos", href: "/admin/pedidos", icon: ShoppingBag },
  { name: "Blog", href: "/admin/blog", icon: FileText },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/admin/login")
      router.refresh()
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <Monitor className="h-6 w-6 text-primary" />
          <span>
            MULTI<span className="text-primary">VUS</span>
          </span>
        </Link>
        <p className="text-xs text-muted-foreground mt-2">Painel Administrativo</p>
      </div>

      <nav className="space-y-1 px-3 flex-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 space-y-2 border-t border-border">
        <Link
          href="/admin/perfil"
          className={cn(
            "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md",
            pathname === "/admin/perfil"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <User className="h-4 w-4" />
          Meu Perfil
        </Link>
        <Link
          href="/home"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
        >
          Ver Site
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
