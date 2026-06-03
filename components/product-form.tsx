"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createProduct, updateProduct } from "@/app/actions/products"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/image-upload"
import { Plus, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ProductFormProps {
  product?: {
    id: number
    name: string
    description: string
    price: string
    category: string
    image_url: string
    stock_quantity: number
    specifications: any
    warranty?: string | null
    delivery?: string | null
    support?: string | null
  }
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productName, setProductName] = useState(product?.name || "")
  const [imageUrl, setImageUrl] = useState(product?.image_url || "")
  
  // Estado para especificações técnicas (chave-valor)
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>(() => {
    if (product?.specifications && typeof product.specifications === 'object') {
      return Object.entries(product.specifications)
        .filter(([key, value]) => key && value && key !== "" && value !== "")
        .map(([key, value]) => ({ key, value: String(value) }))
    }
    return [{ key: "", value: "" }]
  })

  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }])
  }

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const updateSpecification = (index: number, field: "key" | "value", value: string) => {
    const updated = [...specifications]
    updated[index] = { ...updated[index], [field]: value }
    setSpecifications(updated)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Construir objeto de especificações a partir do estado
      const specsObj: Record<string, string> = {}
      specifications.forEach((spec) => {
        if (spec.key && spec.value && spec.key.trim() !== "" && spec.value.trim() !== "") {
          specsObj[spec.key.trim()] = spec.value.trim()
        }
      })

      // Validar campos obrigatórios
      const name = (formData.get("name") as string)?.trim()
      const description = (formData.get("description") as string)?.trim()
      const price = formData.get("price") as string
      const category = (formData.get("category") as string)?.trim()
      const stock_quantity = formData.get("stock_quantity") as string
      // Usar o estado controlado em vez de FormData para garantir que o valor seja capturado
      const image_url = imageUrl.trim() || ""

      if (!name || name.length < 3) {
        setError("Nome do produto deve ter pelo menos 3 caracteres")
        setLoading(false)
        return
      }

      if (!description || description.length < 10) {
        setError("Descrição deve ter pelo menos 10 caracteres")
        setLoading(false)
        return
      }

      if (!category) {
        setError("Categoria é obrigatória")
        setLoading(false)
        return
      }

      const priceNum = Number.parseFloat(price)
      if (isNaN(priceNum) || priceNum <= 0) {
        setError("Preço deve ser um número maior que zero")
        setLoading(false)
        return
      }

      const stockNum = Number.parseInt(stock_quantity)
      if (isNaN(stockNum) || stockNum < 0) {
        setError("Quantidade em estoque deve ser um número maior ou igual a zero")
        setLoading(false)
        return
      }

      const data = {
        name,
        description,
        price: priceNum,
        category,
        image_url: image_url && image_url.trim() !== "" ? image_url.trim() : null,
        stock_quantity: stockNum,
        specifications: specsObj,
        warranty: (formData.get("warranty") as string)?.trim() || null,
        delivery: (formData.get("delivery") as string)?.trim() || null,
        support: (formData.get("support") as string)?.trim() || null,
      }

      if (product) {
        await updateProduct(product.id, data)
      } else {
        await createProduct(data)
      }
      
      router.push("/admin/produtos")
      router.refresh()
    } catch (error) {
      console.error("[ProductForm] Erro ao salvar produto:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar produto"
      setError(errorMessage)
      
      // Scroll para o topo para mostrar o erro
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Produto</Label>
          <Input 
            id="name" 
            name="name" 
            defaultValue={product?.name} 
            onChange={(e) => setProductName(e.target.value)}
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input id="category" name="category" defaultValue={product?.category} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Preço (R$)</Label>
          <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
          <Input
            id="stock_quantity"
            name="stock_quantity"
            type="number"
            defaultValue={product?.stock_quantity}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={product?.description} required />
      </div>

      <div>
        <ImageUpload
          value={imageUrl}
          onChange={(url) => {
            setImageUrl(url)
          }}
          label="Imagem do Produto"
          imageType="product"
          title={productName || product?.name || undefined}
        />
        <Input id="image_url" name="image_url" type="hidden" value={imageUrl} />
      </div>

      {/* Especificações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle>Especificações Técnicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {specifications.map((spec, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Nome da especificação (ex: Processador)"
                value={spec.key}
                onChange={(e) => updateSpecification(index, "key", e.target.value)}
              />
              <Input
                placeholder="Valor (ex: Intel Core i7)"
                value={spec.value}
                onChange={(e) => updateSpecification(index, "value", e.target.value)}
              />
              {specifications.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeSpecification(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSpecification} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Especificação
          </Button>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warranty">Garantia</Label>
              <Input
                id="warranty"
                name="warranty"
                placeholder="Ex: 12 meses"
                defaultValue={product?.warranty || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery">Entrega</Label>
              <Input
                id="delivery"
                name="delivery"
                placeholder="Ex: Consultar, 5-7 dias"
                defaultValue={product?.delivery || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support">Suporte</Label>
              <Input
                id="support"
                name="support"
                placeholder="Ex: Especializado, 24/7"
                defaultValue={product?.support || ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : product ? "Atualizar Produto" : "Criar Produto"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
