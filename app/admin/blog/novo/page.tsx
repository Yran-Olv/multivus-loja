"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"

export default function NewBlogPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    featured_image: "",
    is_published: false,
  })

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      const response = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray.length > 0 ? tagsArray : null,
          featured_image: formData.featured_image || null,
          published_at: formData.is_published ? new Date().toISOString() : null,
        }),
      })

      const responseData = await response.json()

      if (response.ok) {
        toast({
          title: "Post criado!",
          description: "O post foi salvo com sucesso.",
        })
        router.push("/admin/blog")
      } else {
        const errorMessage = responseData.details 
          ? responseData.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ')
          : responseData.error || "Erro ao criar post"
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar post:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o post. Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Novo Post</h1>
        <p className="text-muted-foreground">Crie um novo artigo para o blog</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="url-amigavel-do-post"
                  />
                </div>
                <div>
                  <Label htmlFor="excerpt">Resumo</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
                    placeholder="Breve descrição do post..."
                  />
                </div>
                <div>
                  <Label htmlFor="content">Conteúdo *</Label>
                  <Textarea
                    id="content"
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={15}
                    placeholder="Conteúdo do post (HTML permitido)..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Tecnologia"
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="dicas, tutorial, hardware"
                  />
                </div>
                <div>
                  <ImageUpload
                    value={formData.featured_image}
                    onChange={(url) => setFormData({ ...formData, featured_image: url })}
                    label="Imagem de Destaque"
                    imageType="blog-featured"
                    title={formData.title || undefined}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="is_published" className="font-semibold">
                      {formData.is_published ? "✅ Publicar Post" : "📝 Salvar como Rascunho"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.is_published 
                        ? "O post será visível em /blog após salvar" 
                        : "O post não será visível publicamente"}
                    </p>
                  </div>
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Post"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

