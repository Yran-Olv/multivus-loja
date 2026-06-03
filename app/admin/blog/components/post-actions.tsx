"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { togglePostStatus } from "@/app/actions/blog"
import { useRouter } from "next/navigation"

interface PostActionsProps {
  post: {
    id: number
    slug: string
    is_published: boolean
  }
  onDelete: (id: number) => void
}

export function PostActions({ post, onDelete }: PostActionsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggleStatus = async () => {
    setLoading(true)
    try {
      await togglePostStatus(post.id)
      toast({
        title: post.is_published ? "Post despublicado" : "Post publicado",
        description: `O post foi ${post.is_published ? "despublicado" : "publicado"} com sucesso.`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do post.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/blog/${post.slug}`} target="_blank">
        <Button variant="ghost" size="icon" title="Visualizar">
          <Eye className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleStatus}
        disabled={loading}
        title={post.is_published ? "Despublicar" : "Publicar"}
      >
        {post.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Link href={`/admin/blog/${post.id}`}>
        <Button variant="ghost" size="icon" title="Editar">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={() => onDelete(post.id)}
        title="Excluir"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

