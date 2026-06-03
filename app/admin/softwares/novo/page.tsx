import { SoftwareForm } from "@/components/software-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NovoSoftwarePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Novo Software</h1>
        <p className="text-muted-foreground">Adicione um novo software ao catálogo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Software</CardTitle>
        </CardHeader>
        <CardContent>
          <SoftwareForm />
        </CardContent>
      </Card>
    </div>
  )
}
