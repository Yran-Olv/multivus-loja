"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { updateContactMessageStatus } from "@/app/actions/contact-messages"
import { Loader2, Mail } from "lucide-react"

interface MessageActionsProps {
  message: {
    id: number
    status: string
    email: string
    subject?: string
  }
}

export function MessageActions({ message }: MessageActionsProps) {
  const [status, setStatus] = useState(message.status)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleStatusUpdate = async () => {
    setLoading(true)
    try {
      await updateContactMessageStatus(message.id, status)
      toast({
        title: "Status atualizado!",
        description: "O status da mensagem foi atualizado com sucesso.",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Nova</SelectItem>
              <SelectItem value="read">Lida</SelectItem>
              <SelectItem value="responded">Respondida</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleStatusUpdate}
            disabled={loading || status === message.status}
            className="w-full mt-2"
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Status"}
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.location.href = `mailto:${message.email}?subject=Re: ${message.subject || 'Contato'}`}
        >
          <Mail className="mr-2 h-4 w-4" />
          Responder por Email
        </Button>
      </CardContent>
    </Card>
  )
}

