import { sql, type Service } from "@/lib/db"
import { formatDbError, toIsoDate } from "@/lib/admin-db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ServicesTable } from "@/components/services-table"
import { AdminDbError } from "@/components/admin-db-error"

export const dynamic = "force-dynamic"

export default async function AdminServicosPage() {
  if (!sql) {
    return (
      <div className="space-y-6">
        <AdminDbError title="Banco indisponível" message="Variáveis DB_* não configuradas no container." />
      </div>
    )
  }

  let servicesForTable: {
    id: number
    name: string
    icon: string
    price_from: string
    is_active: boolean
    created_at: string
  }[] = []
  let loadError: string | null = null

  try {
    const services = (await sql!`
      SELECT * FROM services 
      ORDER BY created_at DESC
    `) as unknown as Service[]

    servicesForTable = services.map((service) => ({
      id: service.id,
      name: service.name,
      icon: service.icon || "",
      price_from: service.price_from != null ? String(service.price_from) : "",
      is_active: Boolean(service.is_active),
      created_at: toIsoDate(service.created_at),
    }))
  } catch (error) {
    console.error("[AdminServicos]", error)
    loadError = formatDbError(error)
  }

  return (
    <div className="space-y-6">
      {loadError ? <AdminDbError title="Erro ao carregar serviços" message={loadError} /> : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Serviços</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova serviços oferecidos</p>
        </div>
        <Link href="/admin/servicos/novo">
          <Button className="gap-2" disabled={!!loadError}>
            <Plus className="h-4 w-4" />
            Novo Serviço
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Serviços Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {!loadError ? <ServicesTable services={servicesForTable} /> : null}
        </CardContent>
      </Card>
    </div>
  )
}
