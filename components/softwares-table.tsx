"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toggleSoftwareStatus, deleteSoftware } from "@/app/actions/softwares"

interface Software {
  id: number
  name: string
  category: string
  price: string
  is_featured: boolean
  is_active: boolean
  created_at: string
}

export function SoftwaresTable({ softwares }: { softwares: Software[] }) {
  const [items, setItems] = useState(softwares)

  const handleToggleStatus = async (id: number) => {
    await toggleSoftwareStatus(id)
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_active: !item.is_active } : item)))
  }

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este software?")) {
      await deleteSoftware(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4">Software</th>
            <th className="text-left py-3 px-4">Categoria</th>
            <th className="text-left py-3 px-4">Preço</th>
            <th className="text-left py-3 px-4">Destaque</th>
            <th className="text-left py-3 px-4">Status</th>
            <th className="text-right py-3 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((software) => (
            <tr key={software.id} className="border-b hover:bg-accent/50">
              <td className="py-3 px-4 font-medium">{software.name}</td>
              <td className="py-3 px-4 text-muted-foreground">{software.category}</td>
              <td className="py-3 px-4">R$ {Number(software.price).toFixed(2)}</td>
              <td className="py-3 px-4">
                {software.is_featured ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Sim</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Não</span>
                )}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${software.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                >
                  {software.is_active ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(software.id)}
                    title={software.is_active ? "Desativar" : "Ativar"}
                  >
                    {software.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Link href={`/admin/softwares/${software.id}`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(software.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum software cadastrado</p>}
    </div>
  )
}
