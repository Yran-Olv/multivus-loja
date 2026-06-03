import { ServiceForm } from "@/components/service-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NovoServicoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Novo Serviço</h1>
        <p className="text-muted-foreground">Adicione um novo serviço oferecido</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm />
        </CardContent>
      </Card>
    </div>
  )
}
