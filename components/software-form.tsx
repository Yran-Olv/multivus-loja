"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X, Link2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  createSoftware,
  updateSoftware,
  deleteSoftwareActivationLink,
  type SoftwareAvailableLinkRow,
} from "@/app/actions/softwares"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/image-upload"
import { useToast } from "@/hooks/use-toast"
import {
  DEFAULT_SOFTWARE_ACTIVATION_TEMPLATE,
  DEFAULT_SOLD_OUT_MESSAGE,
  SOFTWARE_DELIVERY_PLACEHOLDERS,
  normalizeActivationUrl,
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
  availableLinkRows?: SoftwareAvailableLinkRow[]
}

const truncateUrl = (url: string, max = 72) =>
  url.length <= max ? url : `${url.slice(0, max)}…`

const parsePriceInput = (raw: string): number => {
  const text = String(raw ?? "")
    .trim()
    .replace(/[^\d,.-]/g, "")
  if (!text) return Number.NaN
  if (text.includes(",")) {
    return Number.parseFloat(text.replace(/\./g, "").replace(",", "."))
  }
  return Number.parseFloat(text)
}

const buildLinkFeedback = (result: {
  inserted: number
  skipped: number
  invalid: number
}) => {
  const parts: string[] = []
  if (result.inserted > 0) {
    parts.push(`${result.inserted} link(s) adicionado(s)`)
  }
  if (result.skipped > 0) {
    parts.push(`${result.skipped} duplicado(s) ignorado(s)`)
  }
  if (result.invalid > 0) {
    parts.push(`${result.invalid} inválido(s) — use URLs https://...`)
  }
  return parts.join(" · ")
}

export function SoftwareForm({
  software,
  linkStats,
  availableLinkRows = [],
}: SoftwareFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deletingLinkId, setDeletingLinkId] = useState<number | null>(null)
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

  const normalizeLinkField = (index: number) => {
    setNewActivationLinks(prev =>
      prev.map((link, i) => (i === index ? normalizeActivationUrl(link) : link))
    )
  }

  const handleDeleteStockLink = async (linkId: number) => {
    if (!software) return
    if (!window.confirm("Excluir este link do estoque? Essa ação não pode ser desfeita.")) {
      return
    }

    setDeletingLinkId(linkId)
    try {
      await deleteSoftwareActivationLink(software.id, linkId)
      toast({ title: "Link excluído", description: "Removido do estoque com sucesso." })
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Não foi possível excluir o link",
        variant: "destructive",
      })
    } finally {
      setDeletingLinkId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const features = (formData.get("features") as string).split("\n").filter(f => f.trim())

    const imageUrlValue = imageUrl.trim() || ""
    const shortDescription = formData.get("short_description") as string
    const version = formData.get("version") as string
    const priceRaw = formData.get("price") as string

    const linksToAdd = newActivationLinks
      .map(link => normalizeActivationUrl(link))
      .filter(Boolean)

    if (!software && linksToAdd.length === 0) {
      toast({
        title: "Link obrigatório",
        description: "Informe ao menos um link de ativação.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const price = parsePriceInput(priceRaw)
    if (!Number.isFinite(price) || price < 0) {
      toast({
        title: "Preço inválido",
        description: "Use formato como 99,90",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      short_description: shortDescription && shortDescription.trim() !== "" ? shortDescription : null,
      version: version && version.trim() !== "" ? version : null,
      price,
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
        const linkResult = await updateSoftware(software.id, data)
        const feedback = buildLinkFeedback(linkResult)

        if (linksToAdd.length && linkResult.inserted === 0) {
          toast({
            title: "Software atualizado",
            description:
              feedback ||
              "Nenhum link novo foi adicionado (verifique duplicados ou URLs inválidas).",
            variant: linkResult.skipped || linkResult.invalid ? "destructive" : "default",
          })
        } else {
          toast({
            title: "Software atualizado",
            description: feedback || "Alterações salvas com sucesso.",
          })
        }

        setNewActivationLinks([""])
        router.refresh()
      } else {
        const linkResult = await createSoftware(data)
        toast({
          title: "Software criado",
          description: buildLinkFeedback(linkResult) || "Cadastro concluído.",
        })
        router.push("/admin/softwares")
        router.refresh()
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro ao salvar software",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
            type="text"
            inputMode="decimal"
            defaultValue={software?.price}
            placeholder="99,90"
            required
          />
          <p className="text-xs text-muted-foreground">Use vírgula para centavos (ex: 1,00)</p>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="features">Funcionalidades (uma por linha)</Label>
        <Textarea
          id="features"
          name="features"
          rows={6}
          defaultValue={software?.features?.join("\n")}
          placeholder="Funcionalidade 1&#10;Funcionalidade 2"
          required
        />
      </div>

      <div>
        <ImageUpload
          value={imageUrl}
          onChange={url => setImageUrl(url)}
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
            Cada venda consome <strong>um link diferente</strong>. Depois de alterar links, clique{" "}
            <strong>Atualizar Software</strong> e sincronize em <strong>/product-catalog</strong>.
          </p>
          {linkStats ? (
            <p className="text-sm mt-2 font-medium">
              Estoque: {linkStats.available} disponível(is) · {linkStats.used} vendido(s) ·{" "}
              {linkStats.total} total
            </p>
          ) : null}
        </div>

        {software && availableLinkRows.length > 0 ? (
          <div className="space-y-2">
            <Label>Links no estoque (disponíveis)</Label>
            <ul className="space-y-2">
              {availableLinkRows.map(row => (
                <li
                  key={row.id}
                  className="flex items-center gap-2 rounded-md border bg-background px-3 py-2"
                >
                  <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate font-mono text-xs" title={row.url}>
                    {truncateUrl(row.url)}
                  </span>
                  <Badge variant="secondary">disponível</Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    disabled={deletingLinkId === row.id || loading}
                    onClick={() => handleDeleteStockLink(row.id)}
                    aria-label="Excluir link do estoque"
                  >
                    {deletingLinkId === row.id ? (
                      <span className="text-xs">…</span>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Links vendidos não aparecem aqui. Você pode excluir links disponíveis que ainda não
              foram usados.
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
                  type="text"
                  value={link}
                  onChange={e => updateActivationLinkField(index, e.target.value)}
                  onBlur={() => normalizeLinkField(index)}
                  placeholder="https://serviceactivation.google.com/..."
                  aria-label={`Link de ativação ${index + 1}`}
                />
                {newActivationLinks.length > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeActivationLinkField(index)}
                    aria-label="Remover campo de link"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addActivationLinkField} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar outro campo de link
          </Button>

          <p className="text-xs text-muted-foreground">
            Cole o link (pode incluir emoji 🔗 — será limpo automaticamente). Depois clique{" "}
            <strong>Atualizar Software</strong> para salvar no estoque.
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
