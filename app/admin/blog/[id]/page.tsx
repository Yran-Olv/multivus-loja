"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ImageUpload } from "@/components/image-upload"

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [post, setPost] = useState<any>(null)
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

  const postId = params?.id as string | undefined

  useEffect(() => {
    if (postId) {
      fetchPost()
    } else {
      toast({
        title: "Erro",
        description: "ID do post não encontrado.",
        variant: "destructive",
      })
      router.push("/admin/blog")
    }
  }, [postId])

  async function fetchPost() {
    if (!postId) return
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
        setFormData({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          category: data.category || "",
          tags: data.tags?.join(", ") || "",
          featured_image: data.featured_image || "",
          is_published: data.is_published || false,
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar o post.",
          variant: "destructive",
        })
        router.push("/admin/blog")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao buscar o post.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
    setSaving(true)

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      if (!postId) {
        throw new Error("ID do post não encontrado")
      }

      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
          published_at: formData.is_published && !post?.published_at ? new Date().toISOString() : post?.published_at,
        }),
      })

      if (response.ok) {
        toast({
          title: "Post atualizado!",
          description: "O post foi salvo com sucesso.",
        })
        router.push("/admin/blog")
      } else {
        const data = await response.json()
        const errorMessage = data.details 
          ? `Erro de validação: ${data.details.map((d: any) => `${d.path.join('.')}: ${d.message}`).join(', ')}`
          : data.error || "Erro ao atualizar post"
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o post.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.")) {
      return
    }

    if (!postId) {
      toast({
        title: "Erro",
        description: "ID do post não encontrado.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Post excluído!",
          description: "O post foi removido com sucesso.",
        })
        router.push("/admin/blog")
      } else {
        throw new Error("Erro ao excluir post")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o post.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Editar Post</h1>
          <p className="text-muted-foreground">Atualize as informações do post</p>
        </div>
        <Link href="/admin/blog">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
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
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={saving}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

