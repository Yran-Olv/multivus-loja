"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; postId: number | null }>({
    open: false,
    postId: null,
  })
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const response = await fetch("/api/blog/posts")
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os posts.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteDialog.postId) return

    try {
      const response = await fetch(`/api/blog/posts/${deleteDialog.postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Post excluído!",
          description: "O post foi removido com sucesso.",
        })
        fetchPosts()
        setDeleteDialog({ open: false, postId: null })
      } else {
        throw new Error("Erro ao excluir post")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o post.",
        variant: "destructive",
      })
    }
  }

  const postToDelete = posts.find((p) => p.id === deleteDialog.postId)

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
          <h1 className="text-3xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground">Gerencie artigos e posts do blog</p>
        </div>
        <Link href="/admin/blog/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Post
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {posts.length > 0 ? (
          posts.map((post: any) => (
            <Card key={post.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{post.title}</h3>
                      {post.is_published ? (
                        <Badge variant="default">Publicado</Badge>
                      ) : (
                        <Badge variant="secondary">Rascunho</Badge>
                      )}
                      {post.category && <Badge variant="outline">{post.category}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {post.excerpt || post.content?.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Criado em: {format(new Date(post.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {post.author_name && <span>Por: {post.author_name}</span>}
                      {post.views > 0 && <span>{post.views} visualizações</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!post.is_published && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/blog/posts/${post.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                ...post,
                                is_published: true,
                                published_at: post.published_at || new Date().toISOString(),
                              }),
                            })
                            if (response.ok) {
                              toast({
                                title: "Post publicado!",
                                description: "O post foi publicado com sucesso e agora está visível em /blog",
                              })
                              fetchPosts()
                            } else {
                              throw new Error("Erro ao publicar")
                            }
                          } catch (error) {
                            toast({
                              title: "Erro",
                              description: "Não foi possível publicar o post.",
                              variant: "destructive",
                            })
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Publicar
                      </Button>
                    )}
                    <Link href={`/blog/${post.slug}`} target="_blank">
                      <Button variant="ghost" size="icon" title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/blog/${post.id}`}>
                      <Button variant="ghost" size="icon" title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setDeleteDialog({ open: true, postId: post.id })}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum post criado ainda</p>
              <Link href="/admin/blog/novo">
                <Button className="mt-4">Criar Primeiro Post</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, postId: null })}
        onConfirm={handleDelete}
        title="Excluir Post"
        description={`Tem certeza que deseja excluir "${postToDelete?.title}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  )
}

