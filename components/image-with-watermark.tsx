"use client"

import Image, { ImageProps } from "next/image"
import { Watermark } from "./watermark"
import { cn } from "@/lib/utils"

interface ImageWithWatermarkProps extends Omit<ImageProps, "className"> {
  className?: string
  showWatermark?: boolean
  watermarkPosition?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
}

export function ImageWithWatermark({
  className,
  showWatermark = true,
  watermarkPosition = "bottom-right",
  src,
  ...props
}: ImageWithWatermarkProps) {
  const positionClasses = {
    "bottom-right": "bottom-3 right-3 sm:bottom-4 sm:right-4",
    "bottom-left": "bottom-3 left-3 sm:bottom-4 sm:left-4",
    "top-right": "top-3 right-3 sm:top-4 sm:right-4",
    "top-left": "top-3 left-3 sm:top-4 sm:left-4",
  }

  // Verificar se src é válido (não vazio, não null, não undefined)
  const isValidSrc = src && typeof src === "string" && src.trim() !== "" && src !== "/placeholder.svg"

  if (!isValidSrc) {
    return null
  }

  // Verificar se é um upload (servido diretamente pelo Nginx, sem passar pelo Next.js)
  // Uploads começam com /uploads/ ou https://multivus.com/uploads/ ou https://multivus.com.br/uploads/
  const isUpload = typeof src === "string" && (
    src.startsWith("/uploads/") ||
    src.includes("/uploads/") ||
    src.startsWith("https://multivus.com/uploads/") ||
    src.startsWith("https://multivus.com.br/uploads/")
  )

  // Para uploads, usar <img> simples (servido diretamente pelo Nginx)
  // Para outras imagens, usar Image do Next.js (otimização)
  if (isUpload) {
    const { fill, ...imgProps } = props as any
    return (
      <div className="relative w-full h-full">
        <img 
          src={src} 
          alt={imgProps.alt || ""} 
          className={cn("object-cover w-full h-full", className)}
          loading={imgProps.priority ? "eager" : "lazy"}
        />
        {showWatermark && (
          <Watermark className={positionClasses[watermarkPosition]} />
        )}
      </div>
    )
  }

  // Para imagens não-upload, usar Image do Next.js
  return (
    <div className="relative w-full h-full">
      <Image {...props} src={src} className={cn("object-cover", className)} />
      {showWatermark && (
        <Watermark className={positionClasses[watermarkPosition]} />
      )}
    </div>
  )
}

