import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ServiceRequestActions } from "./components/request-actions"

export const dynamic = "force-dynamic"

export default async function ServiceRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!sql) {
    notFound()
  }

  const requests = (await sql!`SELECT * FROM service_requests WHERE id = ${id}`) as any[]

  if (requests.length === 0) {
    notFound()
  }

  const request = requests[0]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/solicitacoes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Solicitação #{request.id}</h1>
          <p className="text-muted-foreground">
            {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nome</p>
                <p className="font-medium">{request.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{request.customer_email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                <p className="font-medium">{request.customer_phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tipo de Serviço</p>
                <p className="font-medium">{request.service_type}</p>
              </div>
              {request.device_info && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Informações do Equipamento</p>
                  <p className="font-medium">{request.device_info}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descrição do Problema</p>
                <p className="font-medium whitespace-pre-wrap">{request.problem_description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Prioridade</p>
                <Badge
                  variant={
                    request.priority === "urgent"
                      ? "destructive"
                      : request.priority === "high"
                        ? "default"
                        : "secondary"
                  }
                >
                  {request.priority === "urgent"
                    ? "Urgente"
                    : request.priority === "high"
                      ? "Alta"
                      : request.priority === "normal"
                        ? "Normal"
                        : "Baixa"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status Atual</p>
                <Badge
                  variant={
                    request.status === "pending"
                      ? "secondary"
                      : request.status === "in_progress"
                        ? "default"
                        : request.status === "completed"
                          ? "default"
                          : "destructive"
                  }
                >
                  {request.status === "pending"
                    ? "Pendente"
                    : request.status === "in_progress"
                      ? "Em Andamento"
                      : request.status === "completed"
                        ? "Concluído"
                        : "Cancelado"}
                </Badge>
              </div>
              {request.estimated_cost && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Custo Estimado</p>
                  <p className="text-2xl font-bold">R$ {Number(request.estimated_cost).toFixed(2)}</p>
                </div>
              )}
              {request.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <ServiceRequestActions request={{
            id: request.id,
            status: request.status,
            estimated_cost: request.estimated_cost || null,
            notes: request.notes || null
          }} />
        </div>
      </div>
    </div>
  )
}

