"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, ShoppingBag, FileText, MessageSquare, TrendingUp, Users } from "lucide-react"

interface StatsProps {
  stats: {
    totalProducts: number
    totalOrders: number
    totalPosts: number
    totalMessages: number
    totalRequests: number
    totalCustomers: number
  }
}

export function DashboardStats({ stats }: StatsProps) {
  const statCards = [
    {
      title: "Produtos",
      value: stats.totalProducts,
      icon: Package,
      description: "Produtos cadastrados",
      color: "text-blue-500",
    },
    {
      title: "Pedidos",
      value: stats.totalOrders,
      icon: ShoppingBag,
      description: "Pedidos realizados",
      color: "text-green-500",
    },
    {
      title: "Posts",
      value: stats.totalPosts,
      icon: FileText,
      description: "Posts do blog",
      color: "text-purple-500",
    },
    {
      title: "Mensagens",
      value: stats.totalMessages,
      icon: MessageSquare,
      description: "Mensagens de contato",
      color: "text-orange-500",
    },
    {
      title: "Solicitações",
      value: stats.totalRequests,
      icon: TrendingUp,
      description: "Solicitações de serviço",
      color: "text-pink-500",
    },
    {
      title: "Clientes",
      value: stats.totalCustomers,
      icon: Users,
      description: "Clientes cadastrados",
      color: "text-cyan-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

