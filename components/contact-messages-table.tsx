"use client"

import type { ContactMessage } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Eye, Mail, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export function ContactMessagesTable({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)

  async function handleMarkAsRead(id: number) {
    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      })

      if (response.ok) {
        toast({ title: "Marcada como lida" })
        router.refresh()
      }
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" })
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return

    try {
      const response = await fetch(`/api/contact/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({ title: "Mensagem excluída!" })
        router.refresh()
      }
    } catch (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { label: string; className: string }> = {
      new: { label: "Nova", className: "bg-blue-500/10 text-blue-500" },
      read: { label: "Lida", className: "bg-gray-500/10 text-gray-500" },
      responded: { label: "Respondida", className: "bg-green-500/10 text-green-500" },
    }
    const variant = variants[status] || variants.new
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
              <th className="text-left py-3 px-4 text-sm font-medium">Nome</th>
              <th className="text-left py-3 px-4 text-sm font-medium">E-mail</th>
              <th className="text-left py-3 px-4 text-sm font-medium">Assunto</th>
              <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium">Data</th>
              <th className="text-right py-3 px-4 text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr key={message.id} className="border-b last:border-0">
                <td className="py-3 px-4 text-sm font-medium">{message.name}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{message.email}</td>
                <td className="py-3 px-4 text-sm">{message.subject}</td>
                <td className="py-3 px-4">{getStatusBadge(message.status)}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {new Date(message.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/mensagens/${message.id}`}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (message.status === "new") {
                            handleMarkAsRead(message.id)
                          }
                        }}
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(message.id)} title="Excluir">
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
            <DialogTitle>Mensagem de Contato</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="text-sm font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <Label>E-mail</Label>
                  <p className="text-sm font-medium">{selectedMessage.email}</p>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <Label>Telefone</Label>
                    <p className="text-sm font-medium">{selectedMessage.phone}</p>
                  </div>
                )}
                <div>
                  <Label>Data</Label>
                  <p className="text-sm">{new Date(selectedMessage.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div>
                <Label>Assunto</Label>
                <p className="text-sm font-medium">{selectedMessage.subject}</p>
              </div>
              <div>
                <Label>Mensagem</Label>
                <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Responder por E-mail
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
