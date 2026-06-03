import { sql } from "@/lib/db"
import type { Software } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, Laptop, HardDrive, Cpu, Monitor } from "lucide-react"
import * as Icons from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SoftwareRequestForm } from "@/components/software-request-form"

async function getSoftware(id: string) {
  try {
    if (!sql) {
      return null
    }
    const result = (await sql!`
      SELECT * FROM softwares WHERE id = ${id} AND is_active = true LIMIT 1
    `) as unknown as Software[]
    return result[0] || null
  } catch (error) {
    console.error("[Software] Error fetching software:", error)
    return null
  }
}

function getIconComponent(iconName: string | null) {
  if (!iconName) return Icons.Code2
  const IconComponent = Icons[iconName as keyof typeof Icons] as any
  return IconComponent || Icons.Code2
}

export default async function SoftwareDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const software = await getSoftware(id)

  if (!software) {
    notFound()
  }

  const Icon = getIconComponent(software.icon)
  const requirements = software.system_requirements || {}

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-b from-card to-background py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-6 bg-primary/10 rounded-2xl">
                <Icon className="h-16 w-16 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-bold">{software.name}</h1>
                  {software.is_free && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Grátis
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-lg">
                  {software.short_description || software.description || "Sem descrição disponível"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">v{software.version}</Badge>
                  <Badge variant="outline">{software.platform}</Badge>
                  {software.category && <Badge variant="outline">{software.category}</Badge>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Software</CardTitle>
              </CardHeader>
              <CardContent>
                {software.description ? (
                  <p className="text-muted-foreground leading-relaxed">{software.description}</p>
                ) : (
                  <p className="text-muted-foreground leading-relaxed italic">
                    Descrição não disponível. Entre em contato para mais informações.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            {software.features && software.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Funcionalidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {software.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Requirements */}
            {Object.keys(requirements).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requisitos do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requirements.os && (
                      <div className="flex items-start gap-3">
                        <Laptop className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Sistema Operacional</p>
                          <p className="text-sm text-muted-foreground">{requirements.os}</p>
                        </div>
                      </div>
                    )}
                    {requirements.processor && (
                      <div className="flex items-start gap-3">
                        <Cpu className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Processador</p>
                          <p className="text-sm text-muted-foreground">{requirements.processor}</p>
                        </div>
                      </div>
                    )}
                    {requirements.ram && (
                      <div className="flex items-start gap-3">
                        <Monitor className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Memória RAM</p>
                          <p className="text-sm text-muted-foreground">{requirements.ram}</p>
                        </div>
                      </div>
                    )}
                    {requirements.storage && (
                      <div className="flex items-start gap-3">
                        <HardDrive className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium">Armazenamento</p>
                          <p className="text-sm text-muted-foreground">{requirements.storage}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase/Download Card */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="text-center">
                  {software.is_free ? "Download Gratuito" : "Adquirir Software"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!software.is_free && software.price && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">A partir de</p>
                    <p className="text-4xl font-bold text-primary">R$ {Number(software.price).toFixed(2).replace(".", ",")}</p>
                    <p className="text-sm text-muted-foreground mt-1">pagamento único</p>
                  </div>
                )}
                
                <SoftwareRequestForm
                  softwareId={software.id}
                  softwareName={software.name}
                  softwarePrice={software.price}
                  isFree={software.is_free}
                />
                {software.documentation_url && (
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <a href={software.documentation_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Documentação
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Precisa de Ajuda?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nossa equipe está pronta para ajudar com instalação, configuração e suporte.
                </p>
                <Link href="/contato">
                  <Button variant="outline" className="w-full bg-transparent">
                    Falar com Suporte
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
