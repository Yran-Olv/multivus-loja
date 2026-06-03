"use client"

import { ServicePromoCard } from "@/components/service-promo-card"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import type { Service } from "@/lib/db"
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog"

interface BlogAdPopupProps {
  service: Service
  isOpen: boolean
  onClose: () => void
}

export function BlogAdPopup({ service, isOpen, onClose }: BlogAdPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Anúncio
              </Badge>
              <span className="text-xs text-muted-foreground">Publicidade</span>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-2">
          <ServicePromoCard service={service} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

