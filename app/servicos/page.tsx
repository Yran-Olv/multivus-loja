import { sql } from "@/lib/db"
import type { Service } from "@/lib/db"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { getServiceIcon } from "@/lib/informatica-icons"
import { ServiceRequestFormWrapper } from "@/components/service-request-form-wrapper"
import { ServiceRequestButton } from "@/components/service-request-button"
import { ServiceFilters } from "@/components/service-filters"

export const dynamic = "force-dynamic"

export default async function ServicosPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string; busca?: string }>
}) {
  const params = await searchParams
  const selectedService = params.servico
  const busca = params.busca
  
  let services: Service[] = []
  
  try {
    if (!sql) {
      console.warn("[Servicos] Database not available, showing empty list")
    } else {
      let query
      if (busca) {
        // Busca flexível: palavras parciais e completas
        const searchWords = busca.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0)
        
        // Criar condições para cada palavra
        let searchConditions = sql!`(`
        for (let i = 0; i < searchWords.length; i++) {
          const word = searchWords[i]
          const wordPattern = `%${word}%`
          const startsWithPattern = `${word}%`
          
          if (i > 0) {
            searchConditions = sql!`${searchConditions} AND (`
          }
          
          searchConditions = sql!`${searchConditions} 
            (name ILIKE ${wordPattern} OR description ILIKE ${wordPattern} OR name ILIKE ${startsWithPattern})
          `
          
          if (i < searchWords.length - 1) {
            searchConditions = sql!`${searchConditions})`
          }
        }
        searchConditions = sql!`${searchConditions})`
        
        query = sql!`
          SELECT * FROM services 
          WHERE is_active = true 
          AND ${searchConditions}
          ORDER BY 
            CASE 
              WHEN LOWER(name) LIKE LOWER(${`${busca}%`}) THEN 1
              WHEN LOWER(name) LIKE LOWER(${`%${busca}%`}) THEN 2
              WHEN LOWER(description) LIKE LOWER(${`%${busca}%`}) THEN 3
              ELSE 4
            END,
            name
        `
      } else {
        query = sql!`
          SELECT * FROM services WHERE is_active = true ORDER BY id
        `
      }
      services = (await query) as unknown as Service[]
    }
  } catch (error) {
    console.error("[Servicos] Error fetching services:", error)
    services = []
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              Serviços
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Assistência Técnica <span className="text-primary">Especializada</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Soluções completas para manutenção, reparo e upgrade de equipamentos
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <ServiceFilters currentSearch={busca} />
          
          {services.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {services.length} {services.length === 1 ? "serviço encontrado" : "serviços encontrados"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service) => {
              const Icon = getServiceIcon(service.icon)
              return (
                <Card key={service.id} className="card-glow flex flex-col h-full">
                  <CardHeader>
                    <Icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                    <CardDescription className="leading-relaxed">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="flex-1">
                      {service.features && service.features.length > 0 && (
                        <ul className="mb-4 space-y-1.5 text-sm text-muted-foreground">
                          {service.features.slice(0, 4).map((feature) => (
                            <li key={feature} className="flex items-start gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                      {service.price_from && (
                        <div className="mb-6">
                          <p className="text-sm text-muted-foreground">A partir de</p>
                          <p className="text-3xl font-bold text-primary">
                            R$ {Number(service.price_from).toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-auto">
                      <ServiceRequestButton serviceName={service.name} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Nenhum serviço encontrado</p>
            </div>
          )}
        </div>
      </section>

      {/* Service Request Form Section */}
      <section id="solicitar-servico" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Solicite Seu Orçamento</h2>
              <p className="text-muted-foreground text-lg">
                Preencha o formulário abaixo e nossa equipe entrará em contato via WhatsApp em até 24 horas
              </p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Formulário de Solicitação</CardTitle>
                <CardDescription>
                  Descreva o problema do seu equipamento e receba um orçamento personalizado. Você receberá uma confirmação via WhatsApp após o envio.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServiceRequestFormWrapper defaultServiceType={selectedService} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Como Funciona</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-semibold mb-2">Contato</h3>
                <p className="text-sm text-muted-foreground">Entre em contato por WhatsApp ou formulário</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-semibold mb-2">Diagnóstico</h3>
                <p className="text-sm text-muted-foreground">Avaliamos o problema e fornecemos orçamento</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-semibold mb-2">Reparo</h3>
                <p className="text-sm text-muted-foreground">Realizamos o serviço com peças de qualidade</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="font-semibold mb-2">Entrega</h3>
                <p className="text-sm text-muted-foreground">Devolvemos o equipamento com garantia</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
