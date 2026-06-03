"use client"

import { ServicePromoCard } from "@/components/service-promo-card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import type { Service } from "@/lib/db"

interface BlogAdInsertProps {
  service: Service
  position?: "inline" | "sidebar"
}

export function BlogAdInsert({ service, position = "inline" }: BlogAdInsertProps) {
  if (position === "sidebar") {
    return (
      <div className="sticky top-20">
        <ServicePromoCard service={service} />
      </div>
    )
  }

  // Anúncio inline (dentro do conteúdo) - estilo Google Ads
  return (
    <div className="my-8 mx-auto max-w-md">
      <div className="bg-muted/50 border border-border rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] px-2 py-0.5">
            <Sparkles className="h-2 w-2 mr-1" />
            Anúncio
          </Badge>
          <span className="text-[10px] text-muted-foreground/70">Publicidade</span>
        </div>
        <ServicePromoCard service={service} />
      </div>
    </div>
  )
}

