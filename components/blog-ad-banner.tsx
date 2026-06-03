"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import type { Service } from "@/lib/db"
import { BlogAdPopup } from "./blog-ad-popup"
import Link from "next/link"

interface BlogAdBannerProps {
  service: Service
}

export function BlogAdBanner({ service }: BlogAdBannerProps) {
  const [showPopup, setShowPopup] = useState(false)

  return (
    <>
      <div 
        className="w-[300px] h-[50px] mx-auto my-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-lg cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex items-center justify-between px-4 group"
        onClick={() => setShowPopup(true)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0.5 flex-shrink-0">
            <Sparkles className="h-2 w-2 mr-0.5" />
            Anúncio
          </Badge>
          <span className="text-xs text-foreground/80 font-medium truncate group-hover:text-primary transition-colors">
            {service.name}
          </span>
        </div>
        {service.price_from && (
          <span className="text-xs font-bold text-primary ml-2 flex-shrink-0">
            R$ {Number(service.price_from).toFixed(2).replace(".", ",")}
          </span>
        )}
      </div>

      <BlogAdPopup
        service={service}
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </>
  )
}

