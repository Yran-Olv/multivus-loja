"use client"

import { getServiceIcon } from "@/lib/informatica-icons"
import { cn } from "@/lib/utils"

interface ServiceIconProps {
  name: string | null | undefined
  className?: string
}

export function ServiceIcon({ name, className }: ServiceIconProps) {
  const Icon = getServiceIcon(name)
  return <Icon className={cn("shrink-0", className)} />
}
