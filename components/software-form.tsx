"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { createSoftware, updateSoftware } from "@/app/actions/softwares"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/image-upload"

interface SoftwareFormProps {
  software?: {
    id: number
    name: string
    description: string
    short_description?: string | null
    version?: string | null
    price: string
    category: string
    image_url: string
    features: string[]
    system_requirements: any
    is_featured: boolean
  }
}

export function SoftwareForm({ software }: SoftwareFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isFeatured, setIsFeatured] = useState(software?.is_featured || false)
  const [softwareName, setSoftwareName] = useState(software?.name || "")
  const [imageUrl, setImageUrl] = useState(software?.image_url || "")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const features = (formData.get("features") as string).split("\n").filter((f) => f.trim())

    // Usar o estado controlado em vez de FormData para garantir que o valor seja capturado
    const imageUrlValue = imageUrl.trim() || ""
    const shortDescription = formData.get("short_description") as string
    const version = formData.get("version") as string
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      short_description: shortDescription && shortDescription.trim() !== "" ? shortDescription : null,
      version: version && version.trim() !== "" ? version : null,
      price: Number.parseFloat(formData.get("price") as string),
      category: formData.get("category") as string,
      image_url: imageUrlValue && imageUrlValue.trim() !== "" ? imageUrlValue : null,
      features,
      system_requirements: {},
      is_featured: isFeatured,
    }

    try {
      if (software) {
        await updateSoftware(software.id, data)
      } else {
        await createSoftware(data)
      }
      router.push("/admin/softwares")
      router.refresh()
    } catch (error) {
      alert("Erro ao salvar software")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Software</Label>
          <Input 
            id="name" 
            name="name" 
            defaultValue={software?.name} 
            onChange={(e) => setSoftwareName(e.target.value)}
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" name="category" defaultValue={software?.category} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Versão</Label>
          <Input id="version" name="version" defaultValue={software?.version || ""} placeholder="Ex: 1.0.0, 2.5.0" />
          <p className="text-xs text-muted-foreground">Versão atual do software (opcional)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço a partir de (R$)</Label>
          <Input id="price" name="price" type="number" step="0.01" defaultValue={software?.price} placeholder="0.00" required />
          <p className="text-xs text-muted-foreground">Preço mínimo ou valor base do software</p>
        </div>

        <div className="space-y-2 flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_featured"
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
            />
            <Label htmlFor="is_featured" className="cursor-pointer">
              Software em Destaque
            </Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_description">Descrição Curta (Opcional)</Label>
        <Textarea 
          id="short_description" 
          name="short_description" 
          rows={2} 
          defaultValue={software?.short_description || ""} 
          placeholder="Breve descrição que aparecerá nos cards de listagem"
        />
        <p className="text-xs text-muted-foreground">
          Se não preenchida, será usada a descrição completa
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição Completa *</Label>
        <Textarea 
          id="description" 
          name="description" 
          rows={6} 
          defaultValue={software?.description} 
          placeholder="Descrição detalhada do software"
          required 
        />
        <p className="text-xs text-muted-foreground">
          Descrição completa que aparecerá na página de detalhes
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">Funcionalidades (uma por linha)</Label>
        <Textarea
          id="features"
          name="features"
          rows={6}
          defaultValue={software?.features?.join("\n")}
          placeholder="Funcionalidade 1&#10;Funcionalidade 2&#10;Funcionalidade 3"
          required
        />
      </div>

      <div>
        <ImageUpload
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url)
          }}
          label="Imagem/Ícone do Software"
          imageType="product"
          title={softwareName || software?.name || undefined}
        />
        <Input id="image_url" name="image_url" type="hidden" value={imageUrl} />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : software ? "Atualizar Software" : "Criar Software"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
