"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { ServiceIcon } from "@/components/service-icon"
import Link from "next/link"
import { toggleServiceStatus, deleteService } from "@/app/actions/services"
import { useToast } from "@/hooks/use-toast"

interface Service {
  id: number
  name: string
  icon: string
  price_from: string
  is_active: boolean
  created_at: string
}

export function ServicesTable({ services }: { services: Service[] }) {
  const { toast } = useToast()
  const [items, setItems] = useState(services)

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleServiceStatus(id)
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_active: !item.is_active } : item)))
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return

    try {
      await deleteService(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      toast({ title: "Serviço excluído" })
    } catch (error: any) {
      toast({
        title: "Não foi possível excluir",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Serviço</th>
            <th className="text-left py-3 px-4">Ícone</th>
            <th className="text-left py-3 px-4">Preço a partir de</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-right py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((service) => (
            <tr key={service.id} className="border-b hover:bg-accent/50">
              <td className="py-3 px-4 font-medium">{service.name}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ServiceIcon name={service.icon} className="h-4 w-4 text-primary" />
                  <span className="text-xs">{service.icon}</span>
                </div>
              </td>
              <td className="py-3 px-4">
                {(() => {
                  const raw = service.price_from
                  const value = raw ? Number(raw) : 0
                  if (!value || value <= 0) return "Sobre orçamento"
                  return `A partir de R$ ${value.toFixed(2)}`
                })()}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${service.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                >
                  {service.is_active ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(service.id)}
                    title={service.is_active ? "Desativar" : "Ativar"}
                  >
                    {service.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Link href={`/admin/servicos/${service.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum serviço cadastrado</p>}
    </div>
  )
}
