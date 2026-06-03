import { sql } from "@/lib/db"
import type { Software } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, CheckCircle2 } from "lucide-react"
import * as Icons from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Softwares | MULTIVUS",
  description: "Conheça os softwares desenvolvidos pela MULTIVUS para gestão empresarial e suporte técnico",
}

async function getSoftware() {
  try {
    if (!sql) {
      console.warn("[Softwares] Database not available, returning empty list")
      return []
    }
    const result = await sql!<Software[]>`
      SELECT * FROM softwares 
      WHERE is_active = true 
      ORDER BY is_featured DESC, created_at DESC
    `
    return result
  } catch (error) {
    console.error("[Softwares] Error fetching software:", error)
    return []
  }
}

function getIconComponent(iconName: string | null) {
  if (!iconName) return Icons.Code2
  const IconComponent = Icons[iconName as keyof typeof Icons] as any
  return IconComponent || Icons.Code2
}

export default async function SoftwaresPage() {
  const softwareList = await getSoftware()
  const featuredSoftware = softwareList.filter((s) => s.is_featured)
  const otherSoftware = softwareList.filter((s) => !s.is_featured)

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="bg-gradient-to-b from-card to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge variant="secondary" className="mb-2">
              <Star className="mr-1 h-3 w-3" />
              Desenvolvido pela MULTIVUS
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Nossos <span className="text-primary">Softwares</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Soluções desenvolvidas pela MULTIVUS para otimizar a gestão do seu negócio e facilitar o trabalho técnico
            </p>
          </div>
        </div>
      </section>

      {/* Featured Software */}
      {featuredSoftware.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Em Destaque</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSoftware.map((software) => {
                const Icon = getIconComponent(software.icon)
                return (
                  <Card key={software.id} className="card-glow flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        {software.is_free && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Grátis
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{software.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">v{software.version}</p>
                      <CardDescription className="mt-2">
                        {software.short_description || software.description || "Sem descrição disponível"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                      {/* Features */}
                      {software.features && software.features.length > 0 && (
                        <div className="space-y-2">
                          {software.features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                              <span className="text-muted-foreground">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Platform & Price */}
                      <div className="mt-auto pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">{software.platform}</span>
                          {!software.is_free && software.price && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">A partir de</p>
                              <span className="text-2xl font-bold text-primary">R$ {Number(software.price).toFixed(2).replace(".", ",")}</span>
                            </div>
                          )}
                        </div>
                        <Link href={`/softwares/${software.id}`} className="block">
                          <Button className="w-full">Ver Detalhes</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Other Software */}
      {otherSoftware.length > 0 && (
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Outros Softwares</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherSoftware.map((software) => {
                const Icon = getIconComponent(software.icon)
                return (
                  <Card key={software.id} className="card-glow flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Icon className="h-8 w-8 text-primary" />
                        </div>
                        {software.is_free && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                            Grátis
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{software.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">v{software.version}</p>
                      <CardDescription className="mt-2">
                        {software.short_description || software.description || "Sem descrição disponível"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4">
                      {/* Platform & Price */}
                      <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-muted-foreground">{software.platform}</span>
                          {!software.is_free && software.price && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">A partir de</p>
                              <span className="text-xl font-bold text-primary">R$ {Number(software.price).toFixed(2).replace(".", ",")}</span>
                            </div>
                          )}
                        </div>
                        <Link href={`/softwares/${software.id}`} className="block">
                          <Button variant="outline" className="w-full bg-transparent">
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-balance">Precisa de um Software Personalizado?</h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              A MULTIVUS também desenvolve soluções sob medida para o seu negócio. Entre em contato e vamos conversar
              sobre suas necessidades!
            </p>
            <Link href="/contato">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Solicitar Orçamento
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
