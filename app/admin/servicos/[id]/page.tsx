import { sql, type Service } from "@/lib/db"
import { ServiceForm } from "@/components/service-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"

export default async function EditServicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!sql) {
    notFound()
  }

  const services = (await sql!`SELECT * FROM services WHERE id = ${id}`) as unknown as Service[]

  if (services.length === 0) {
    notFound()
  }

  const service = services[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Editar Serviço</h1>
        <p className="text-muted-foreground">Atualize as informações do serviço</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm service={{
            id: service.id,
            name: service.name,
            description: service.description,
            icon: service.icon || "",
            features: Array.isArray(service.features) ? service.features : [],
            price_from: service.price_from?.toString() || ""
          }} />
        </CardContent>
      </Card>
    </div>
  )
}
