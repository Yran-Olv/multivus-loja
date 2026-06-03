"use client"

import Link from "next/link"
import { ImageWithWatermark } from "@/components/image-with-watermark"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Eye, Share2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

interface BlogPostCardInstagramProps {
  post: {
    id: number
    title: string
    slug: string
    excerpt: string | null
    featured_image: string | null
    category: string | null
    author_name: string | null
    published_at: Date | null
    created_at: Date
    views: number
  }
}

export function BlogPostCardInstagram({ post }: BlogPostCardInstagramProps) {
  const [copied, setCopied] = useState(false)
  const [postUrl, setPostUrl] = useState("")
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPostUrl(`${window.location.origin}/blog/${post.slug}`)
    }
  }, [post.slug])
  
  const publishedDate = new Date(post.published_at || post.created_at)
  const formattedDate = publishedDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  })

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || "",
          url: postUrl,
        })
      } catch (err) {
        console.log("Erro ao compartilhar:", err)
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(postUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Header - estilo Instagram */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {post.author_name || "MULTIVUS"}
            </p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleShare}
          title="Compartilhar"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Imagem - formato Instagram */}
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden max-h-[300px] sm:max-h-[350px]">
          {post.featured_image ? (
            <ImageWithWatermark
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              showWatermark={true}
              watermarkPosition="bottom-right"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="text-6xl text-primary/40">📝</div>
            </div>
          )}
          {post.category && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="secondary" className="backdrop-blur-md bg-background/90 shadow-lg">
                {post.category}
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Conteúdo - estilo Instagram */}
      <div className="p-4 space-y-3">
        {/* Ações */}
        <div className="flex items-center gap-4">
          <Link href={`/blog/${post.slug}`} className="hover:opacity-70 transition-opacity">
            <Eye className="h-5 w-5 text-foreground" />
          </Link>
          <span className="text-sm font-semibold text-foreground">{post.views || 0}</span>
          <div className="flex-1" />
          <Link 
            href={`/blog/${post.slug}`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver post completo
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Título e descrição */}
        <div>
          <Link href={`/blog/${post.slug}`}>
            <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2 hover:text-primary transition-colors">
              {post.title}
            </h3>
          </Link>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Link para compartilhar no Instagram */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Compartilhe no Instagram:
          </p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all flex-1">
              {postUrl || `/blog/${post.slug}`}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                const url = postUrl || (typeof window !== "undefined" ? `${window.location.origin}/blog/${post.slug}` : `/blog/${post.slug}`)
                navigator.clipboard.writeText(url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

