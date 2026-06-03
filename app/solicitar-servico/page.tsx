import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ServiceRequestForm } from "@/components/service-request-form"
import { Clock, Shield, Award } from "lucide-react"

export default function SolicitarServicoPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              Solicitar Assistência
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Orçamento <span className="text-primary">Gratuito</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Preencha o formulário e nossa equipe entrará em contato em até 24 horas
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Form */}
            <div className="lg:col-span-2">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="text-2xl">Formulário de Solicitação</CardTitle>
                  <CardDescription>Descreva o problema do seu equipamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ServiceRequestForm />
                </CardContent>
              </Card>
            </div>

            {/* Info Cards */}
            <div className="space-y-6">
              <Card className="card-glow">
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary mb-3" />
                  <CardTitle>Resposta Rápida</CardTitle>
                  <CardDescription>
                    Analisamos sua solicitação e entramos em contato em até 24 horas úteis
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-3" />
                  <CardTitle>Orçamento Sem Compromisso</CardTitle>
                  <CardDescription>Você não paga nada pela avaliação inicial e orçamento detalhado</CardDescription>
                </CardHeader>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <Award className="h-10 w-10 text-primary mb-3" />
                  <CardTitle>30 Dias de Garantia</CardTitle>
                  <CardDescription>Todos os nossos serviços incluem garantia de 30 dias</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
