"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface ServiceRequestButtonProps {
  serviceName: string
}

export function ServiceRequestButton({ serviceName }: ServiceRequestButtonProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Atualizar URL com query param e hash
    const url = `/servicos?servico=${encodeURIComponent(serviceName)}#solicitar-servico`
    
    // Sempre usar router.push para garantir que os componentes sejam atualizados
    router.push(url)
    
    // Fazer scroll após navegação
    setTimeout(() => {
      const element = document.getElementById("solicitar-servico")
      if (element) {
        const yOffset = -80
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
        window.scrollTo({ top: y, behavior: "smooth" })
      }
    }, 300)
  }

  return (
    <Button className="w-full" variant="outline" onClick={handleClick} type="button">
      Solicitar Orçamento
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  )
}

