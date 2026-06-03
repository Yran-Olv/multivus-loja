"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ServiceRequestForm } from "./service-request-form"

interface ServiceRequestFormWrapperProps {
  defaultServiceType?: string
}

export function ServiceRequestFormWrapper({ defaultServiceType }: ServiceRequestFormWrapperProps = {}) {
  const searchParams = useSearchParams()
  const serviceTypeFromUrl = searchParams?.get("servico")
  
  // Usar o serviço da prop ou da URL, priorizando a prop
  const serviceType = defaultServiceType || serviceTypeFromUrl || undefined

  // Fazer scroll suave quando houver serviço na URL (apenas uma vez)
  useEffect(() => {
    if (serviceTypeFromUrl) {
      const timer = setTimeout(() => {
        const element = document.getElementById("solicitar-servico")
        if (element) {
          const yOffset = -80
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
          window.scrollTo({ top: y, behavior: "smooth" })
        }
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [serviceTypeFromUrl]) // Apenas quando serviceTypeFromUrl mudar

  return <ServiceRequestForm defaultServiceType={serviceType} />
}

