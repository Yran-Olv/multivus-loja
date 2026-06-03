"use client"

import { Monitor } from "lucide-react"

interface WatermarkProps {
  className?: string
}

export function Watermark({ className = "" }: WatermarkProps) {
  return (
    <div className={`absolute z-10 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg backdrop-blur-md bg-background/85 border border-border/50 shadow-lg ${className}`}>
      <Monitor className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
      <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
        MULTI<span className="text-primary">VUS</span>
      </span>
    </div>
  )
}

