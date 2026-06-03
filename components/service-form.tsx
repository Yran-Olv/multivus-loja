"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ServiceIconField } from "@/components/service-icon-field"
import { createService, updateService } from "@/app/actions/services"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface ServiceFormProps {
  service?: {
    id: number
    name: string
    description: string
    icon: string
    features: string[]
    price_from: string
  }
}

export function ServiceForm({ service }: ServiceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const features = (formData.get("features") as string).split("\n").filter((f) => f.trim())
    const priceValue = formData.get("price_from") as string

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
      features,
      price_from: priceValue ? Number.parseFloat(priceValue) : null,
    }

    if (!data.icon?.trim()) {
      toast({
        title: "Ícone obrigatório",
        description: "Clique em Escolher e selecione um ícone antes de salvar.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const result = service ? await updateService(service.id, data) : await createService(data)

      if (!result.ok) {
        toast({
          title: "Erro ao salvar serviço",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({ title: service ? "Serviço atualizado" : "Serviço criado" })
      router.push("/admin/servicos")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado"
      toast({
        title: "Erro ao salvar serviço",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Serviço</Label>
          <Input id="name" name="name" defaultValue={service?.name} required />
        </div>

        <ServiceIconField defaultValue={service?.icon} required />

        <div className="space-y-2">
          <Label htmlFor="price_from">Preço a partir de (R$)</Label>
          <Input
            id="price_from"
            name="price_from"
            type="number"
            step="0.01"
            defaultValue={service?.price_from}
            placeholder="Deixe vazio para 'Sob consulta'"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={service?.description} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">Recursos/Características (uma por linha)</Label>
        <Textarea
          id="features"
          name="features"
          rows={6}
          defaultValue={service?.features?.join("\n")}
          placeholder="Recurso 1&#10;Recurso 2&#10;Recurso 3"
          required
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : service ? "Atualizar Serviço" : "Criar Serviço"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
