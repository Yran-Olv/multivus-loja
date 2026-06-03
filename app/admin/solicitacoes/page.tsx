import { sql } from "@/lib/db"
import type { ServiceRequest } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceRequestsTable } from "@/components/service-requests-table"

export const dynamic = "force-dynamic"

export default async function AdminSolicitacoesPage() {
  if (!sql) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Solicitações de Serviço</h1>
          <p className="text-muted-foreground">Banco de dados não disponível</p>
        </div>
      </div>
    )
  }

  const requests = (await sql!`
    SELECT * FROM service_requests 
    ORDER BY created_at DESC
  `) as unknown as ServiceRequest[]

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Solicitações de Serviço</h1>
        <p className="text-muted-foreground">Gerencie todas as solicitações de assistência técnica</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.in_progress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Solicitações</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceRequestsTable requests={requests} />
        </CardContent>
      </Card>
    </div>
  )
}
