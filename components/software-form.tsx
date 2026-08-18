"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createSoftware, updateSoftware } from "@/app/actions/softwares"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/image-upload"
import {
  DEFAULT_SOFTWARE_ACTIVATION_TEMPLATE,
  DEFAULT_SOLD_OUT_MESSAGE,
  SOFTWARE_DELIVERY_PLACEHOLDERS,
} from "@/lib/software-delivery"

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
    activation_url?: string | null
    activation_message_template?: string | null
    order_id_prefix?: string | null
    link_validity_days?: number | null
    sold_out_message?: string | null
  }
  linkStats?: { available: number; used: number; total: number }
  availableLinks?: string[]
}

const truncateUrl = (url: string, max = 72) =>
  url.length <= max ? url : `${url.slice(0, max)}…`

export function SoftwareForm({ software, linkStats, availableLinks = [] }: SoftwareFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isFeatured, setIsFeatured] = useState(software?.is_featured || false)
  const [softwareName, setSoftwareName] = useState(software?.name || "")
  const [imageUrl, setImageUrl] = useState(software?.image_url || "")
  const [newActivationLinks, setNewActivationLinks] = useState<string[]>([""])

  const addActivationLinkField = () => {
    setNewActivationLinks(prev => [...prev, ""])
  }

  const removeActivationLinkField = (index: number) => {
    setNewActivationLinks(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const updateActivationLinkField = (index: number, value: string) => {
    setNewActivationLinks(prev => prev.map((link, i) => (i === index ? value : link)))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const features = (formData.get("features") as string).split("\n").filter(f => f.trim())

    const imageUrlValue = imageUrl.trim() || ""
    const shortDescription = formData.get("short_description") as string
    const version = formData.get("version") as string

    const linksToAdd = newActivationLinks.map(link => link.trim()).filter(Boolean)

    if (!software && linksToAdd.length === 0) {
      alert("Informe ao menos um link de ativação.")
      setLoading(false)
      return
    }

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
      activation_url: null,
      activation_message_template:
        String(formData.get("activation_message_template") || "").trim() || null,
      order_id_prefix: String(formData.get("order_id_prefix") || "LNK").trim() || "LNK",
      link_validity_days: Number(formData.get("link_validity_days") || 7) || 7,
      sold_out_message: String(formData.get("sold_out_message") || "").trim() || null,
      activation_links_bulk: linksToAdd.length ? linksToAdd.join("\n") : null,
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
      const message = error instanceof Error ? error.message : "Erro ao salvar software"
      alert(message)
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
            onChange={e => setSoftwareName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" name="category" defaultValue={software?.category} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Versão</Label>
          <Input
            id="version"
            name="version"
            defaultValue={software?.version || ""}
            placeholder="Ex: 1.0.0, 2.5.0"
          />
          <p className="text-xs text-muted-foreground">Versão atual do software (opcional)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço a partir de (R$)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            defaultValue={software?.price}
            placeholder="0.00"
            required
          />
          <p className="text-xs text-muted-foreground">Preço mínimo ou valor base do software</p>
        </div>

        <div className="space-y-2 flex items-end pb-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_featured"
              checked={isFeatured}
              onCheckedChange={checked => setIsFeatured(checked as boolean)}
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
          onChange={url => {
            setImageUrl(url)
          }}
          label="Imagem/Ícone do Software"
          imageType="product"
          title={softwareName || software?.name || undefined}
        />
        <Input id="image_url" name="image_url" type="hidden" value={imageUrl} />
      </div>

      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-base">Entrega automática WhatsApp (Whaticket)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cada venda consome <strong>um link diferente</strong> da lista. Quando acabar, o cliente
            recebe a mensagem de alta demanda / suporte. Sincronize em{" "}
            <strong>/product-catalog</strong> no Whaticket.
          </p>
          {linkStats ? (
            <p className="text-sm mt-2 font-medium">
              Estoque: {linkStats.available} disponível(is) · {linkStats.used} vendido(s) ·{" "}
              {linkStats.total} total
            </p>
          ) : null}
        </div>

        {software && availableLinks.length > 0 ? (
          <div className="space-y-2">
            <Label>Links no estoque (disponíveis)</Label>
            <ul className="space-y-2">
              {availableLinks.map((url, index) => (
                <li
                  key={`stock-${index}`}
                  className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
                >
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-mono text-xs" title={url}>
                    {truncateUrl(url)}
                  </span>
                  <Badge variant="secondary">disponível</Badge>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Links já vendidos não aparecem aqui e não podem ser reutilizados.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          <Label>
            {software ? "Adicionar novos links ao estoque" : "Links de ativação (cada campo = 1 venda)"}
          </Label>

          <div className="space-y-2">
            {newActivationLinks.map((link, index) => (
              <div key={`new-link-${index}`} className="flex gap-2">
                <Input
                  type="url"
                  value={link}
                  onChange={e => updateActivationLinkField(index, e.target.value)}
                  placeholder="https://serviceactivation.google.com/..."
                  aria-label={`Link de ativação ${index + 1}`}
                />
                {newActivationLinks.length > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeActivationLinkField(index)}
                    aria-label="Remover link"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addActivationLinkField} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar link
          </Button>

          <p className="text-xs text-muted-foreground">
            {software
              ? "Preencha só os links novos que deseja incluir no estoque."
              : "Use o botão + para cadastrar quantos links quiser. Cada link = uma venda."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="order_id_prefix">Prefixo do pedido</Label>
            <Input
              id="order_id_prefix"
              name="order_id_prefix"
              defaultValue={software?.order_id_prefix || "LNK"}
              placeholder="LNK"
              maxLength={16}
            />
            <p className="text-xs text-muted-foreground">Ex: LNK → LNKABC123XYZ0</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="link_validity_days">Validade do link (dias)</Label>
            <Input
              id="link_validity_days"
              name="link_validity_days"
              type="number"
              min={1}
              max={365}
              defaultValue={software?.link_validity_days ?? 7}
            />
            <p className="text-xs text-muted-foreground">Usado na cobrança Pix e na mensagem</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="activation_message_template">Mensagem pós-pagamento (opcional)</Label>
          <Textarea
            id="activation_message_template"
            name="activation_message_template"
            rows={8}
            defaultValue={software?.activation_message_template || ""}
            placeholder={DEFAULT_SOFTWARE_ACTIVATION_TEMPLATE}
          />
          <p className="text-xs text-muted-foreground">
            Placeholders: {SOFTWARE_DELIVERY_PLACEHOLDERS}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sold_out_message">Mensagem quando links esgotarem (opcional)</Label>
          <Textarea
            id="sold_out_message"
            name="sold_out_message"
            rows={6}
            defaultValue={software?.sold_out_message || ""}
            placeholder={DEFAULT_SOLD_OUT_MESSAGE}
          />
          <p className="text-xs text-muted-foreground">
            Enviada se o pagamento for confirmado mas não houver link disponível no estoque.
          </p>
        </div>
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
