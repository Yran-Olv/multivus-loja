"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles } from "lucide-react"
import { getServiceIcon } from "@/lib/informatica-icons"

interface ServicePromoCardProps {
  service: {
    id: number
    name: string
    description: string
    icon: string | null
    price_from: number | null
  }
}

export function ServicePromoCard({ service }: ServicePromoCardProps) {
  const Icon = getServiceIcon(service.icon)

  return (
    <Card className="h-full flex flex-col overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group">
      <CardHeader className="relative p-4 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            Serviço
          </Badge>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">
              {service.name}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="text-xs leading-snug line-clamp-2">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col">
        <div className="flex-1">
          {service.price_from && (
            <div className="mb-6 p-2 bg-muted/50 rounded-md border border-border/50">
              <p className="text-[10px] text-muted-foreground mb-0.5">A partir de</p>
              <p className="text-lg font-bold text-primary">
                R$ {Number(service.price_from).toFixed(2).replace(".", ",")}
              </p>
            </div>
          )}
        </div>
        <Link href="/solicitar-servico" className="mt-auto">
          <Button size="sm" className="w-full text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Solicitar Orçamento
            <ArrowRight className="ml-1.5 h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

