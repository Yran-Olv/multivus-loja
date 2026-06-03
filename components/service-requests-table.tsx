"use client"

import type { ServiceRequest } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function ServiceRequestsTable({ requests }: { requests: ServiceRequest[] }) {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)

  async function handleUpdate(formData: FormData) {
    if (!selectedRequest) return

    const data = {
      status: formData.get("status"),
      estimated_cost: formData.get("estimated_cost") ? Number(formData.get("estimated_cost")) : undefined,
      notes: formData.get("notes"),
    }

    try {
      const response = await fetch(`/api/service-requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({ title: "Solicitação atualizada!" })
        setIsEditOpen(false)
        router.refresh()
      } else {
        throw new Error("Erro ao atualizar")
      }
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" })
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta solicitação?")) return

    try {
      const response = await fetch(`/api/service-requests/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Solicitação excluída!" })
        router.refresh()
      } else {
        throw new Error("Erro ao excluir")
      }
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-yellow-500/10 text-yellow-500" },
      in_progress: { label: "Em Andamento", className: "bg-blue-500/10 text-blue-500" },
      completed: { label: "Concluído", className: "bg-green-500/10 text-green-500" },
      cancelled: { label: "Cancelado", className: "bg-red-500/10 text-red-500" },
    }
    const variant = variants[status] || variants.pending
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  function getPriorityBadge(priority: string) {
    const variants: Record<string, { label: string; className: string }> = {
      low: { label: "Baixa", className: "bg-gray-500/10 text-gray-500" },
      normal: { label: "Normal", className: "bg-blue-500/10 text-blue-500" },
      high: { label: "Alta", className: "bg-orange-500/10 text-orange-500" },
      urgent: { label: "Urgente", className: "bg-red-500/10 text-red-500" },
    }
    const variant = variants[priority] || variants.normal
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-medium">Cliente</th>
              <th className="text-left py-3 px-4 text-sm font-medium">Serviço</th>
              <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium">Urgência</th>
              <th className="text-left py-3 px-4 text-sm font-medium">Data</th>
              <th className="text-right py-3 px-4 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-b last:border-0">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-sm">{request.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{request.customer_email}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">{request.service_type}</td>
                <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                <td className="py-3 px-4">{getPriorityBadge(request.priority)}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/solicitacoes/${request.id}`}>
                      <Button size="sm" variant="ghost" title="Ver detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRequest(request)
                        setIsEditOpen(true)
                      }}
                      title="Editar rapidamente"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(request.id)} title="Excluir">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="text-sm font-medium">{selectedRequest.customer_name}</p>
                </div>
                <div>
                  <Label>E-mail</Label>
                  <p className="text-sm font-medium">{selectedRequest.customer_email}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm font-medium">{selectedRequest.customer_phone}</p>
                </div>
                <div>
                  <Label>Serviço</Label>
                  <p className="text-sm font-medium">{selectedRequest.service_type}</p>
                </div>
              </div>
              {selectedRequest.device_info && (
                <div>
                  <Label>Equipamento</Label>
                  <p className="text-sm">{selectedRequest.device_info}</p>
                </div>
              )}
              <div>
                <Label>Descrição do Problema</Label>
                <p className="text-sm">{selectedRequest.problem_description}</p>
              </div>
              {selectedRequest.notes && (
                <div>
                  <Label>Observações</Label>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}
              {selectedRequest.estimated_cost && (
                <div>
                  <Label>Custo Estimado</Label>
                  <p className="text-sm font-medium text-primary">
                    R$ {selectedRequest.estimated_cost.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Solicitação</DialogTitle>
            <DialogDescription>Altere o status e adicione informações</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <form action={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedRequest.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Custo Estimado (R$)</Label>
                <Input
                  id="estimated_cost"
                  name="estimated_cost"
                  type="number"
                  step="0.01"
                  defaultValue={selectedRequest.estimated_cost || ""}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" defaultValue={selectedRequest.notes || ""} rows={4} />
              </div>
              <Button type="submit" className="w-full">
                Salvar Alterações
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
