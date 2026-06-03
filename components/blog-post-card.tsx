"use client"

import Link from "next/link"
import { ImageWithWatermark } from "@/components/image-with-watermark"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Eye } from "lucide-react"

interface BlogPostCardProps {
  post: {
    id: number
    title: string
    slug: string
    excerpt: string | null
    content: string
    featured_image: string | null
    category: string | null
    author_name: string | null
    published_at: Date | null
    created_at: Date
    views: number
  }
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const publishedDate = new Date(post.published_at || post.created_at)
  const formattedDate = publishedDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-border/50 hover:border-primary/30 group-hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
        {/* Image */}
        {post.featured_image ? (
          <div className="relative aspect-[4/3] sm:aspect-video w-full overflow-hidden bg-muted max-h-[180px] sm:max-h-[200px] md:max-h-[220px]">
            <ImageWithWatermark
              src={post.featured_image}
              alt={post.title}
              fill
              className="group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              showWatermark={true}
              watermarkPosition="bottom-right"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            {post.category && (
              <div className="absolute top-4 left-4 z-20">
                <Badge variant="secondary" className="backdrop-blur-md bg-background/90 shadow-lg border border-border/50">
                  {post.category}
                </Badge>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="text-white text-xs font-medium">Ler mais →</div>
            </div>
          </div>
        ) : (
          <div className="relative aspect-video w-full bg-gradient-to-br from-primary/30 via-primary/10 to-primary/5 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            {post.category && (
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="secondary" className="backdrop-blur-md bg-background/90 shadow-lg">
                  {post.category}
                </Badge>
              </div>
            )}
            <div className="text-6xl text-primary/40 group-hover:scale-110 transition-transform duration-500">📝</div>
          </div>
        )}

        {/* Content */}
        <CardHeader className="flex-1 flex flex-col space-y-2 p-4">
          {!post.featured_image && post.category && (
            <Badge variant="secondary" className="w-fit text-xs mb-1">
              {post.category}
            </Badge>
          )}
          <CardTitle className="line-clamp-2 text-lg sm:text-xl font-bold group-hover:text-primary transition-colors duration-300 leading-tight">
            {post.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-xs sm:text-sm text-muted-foreground leading-snug">
            {post.excerpt || post.content?.substring(0, 120) + "..."}
          </CardDescription>
        </CardHeader>

        {/* Footer */}
        <CardContent className="pt-0 px-4 pb-4 border-t border-border/30 bg-muted/30">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <Calendar className="h-4 w-4 text-primary/70" />
                <span className="whitespace-nowrap font-medium">{formattedDate}</span>
              </div>
              {post.author_name && (
                <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <User className="h-4 w-4 text-primary/70" />
                  <span className="truncate max-w-[120px] sm:max-w-none font-medium">{post.author_name}</span>
                </div>
              )}
            </div>
            {post.views > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4 text-primary/70" />
                <span className="font-medium">{post.views}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

