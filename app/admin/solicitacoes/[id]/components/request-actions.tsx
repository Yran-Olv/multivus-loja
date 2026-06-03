"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface RequestActionsProps {
  request: {
    id: number
    status: string
    estimated_cost: number | null
    notes: string | null
  }
}

export function ServiceRequestActions({ request }: RequestActionsProps) {
  const [status, setStatus] = useState(request.status)
  const [estimatedCost, setEstimatedCost] = useState(request.estimated_cost?.toString() || "")
  const [notes, setNotes] = useState(request.notes || "")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleStatusUpdate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/service-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Status atualizado!",
          description: "O status da solicitação foi atualizado com sucesso.",
        })
        router.refresh()
      } else {
        throw new Error("Erro ao atualizar")
      }
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

  const handleCostUpdate = async () => {
    setLoading(true)
    try {
      const cost = estimatedCost ? parseFloat(estimatedCost) : null
      const response = await fetch(`/api/service-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimated_cost: cost }),
      })

      if (response.ok) {
        toast({
          title: "Custo atualizado!",
          description: "O custo estimado foi atualizado com sucesso.",
        })
        router.refresh()
      } else {
        throw new Error("Erro ao atualizar")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o custo.",
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
          <Label htmlFor="status">Alterar Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleStatusUpdate}
            disabled={loading || status === request.status}
            className="w-full mt-2"
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar Status"}
          </Button>
        </div>

        <div>
          <Label htmlFor="estimated_cost">Custo Estimado (R$)</Label>
          <div className="flex gap-2">
            <Input
              id="estimated_cost"
              type="number"
              step="0.01"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="0.00"
            />
            <Button
              onClick={handleCostUpdate}
              disabled={loading || estimatedCost === (request.estimated_cost?.toString() || "")}
              size="sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Adicione observações sobre a solicitação..."
          />
          <Button
            onClick={async () => {
              setLoading(true)
              try {
                const response = await fetch(`/api/service-requests/${request.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ notes }),
                })

                if (response.ok) {
                  toast({
                    title: "Observações salvas!",
                    description: "As observações foram atualizadas com sucesso.",
                  })
                  router.refresh()
                } else {
                  throw new Error("Erro ao salvar")
                }
              } catch (error) {
                toast({
                  title: "Erro",
                  description: "Não foi possível salvar as observações.",
                  variant: "destructive",
                })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading || notes === (request.notes || "")}
            className="w-full mt-2"
            size="sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Observações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

