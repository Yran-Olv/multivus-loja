import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { ImageWithWatermark } from "@/components/image-with-watermark"
import { BlogContentWithAds } from "@/components/blog-content-with-ads"
import { InstagramPostGenerator } from "@/components/instagram-post-generator"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { incrementPostViews } from "@/app/actions/blog"
import type { Service } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!sql) {
    notFound()
  }

  const posts = (await sql!`
    SELECT p.*, a.full_name as author_name
    FROM posts p
    LEFT JOIN admin_users a ON p.author_id = a.id
    WHERE p.slug = ${slug} AND p.is_published = true
  `) as any[]

  if (posts.length === 0) {
    notFound()
  }

  const post = posts[0]

  // Incrementar visualizações (não bloqueia o render)
  incrementPostViews(slug).catch((error) => {
    console.error("[Blog] Error incrementing views:", error)
  })

  // Buscar serviços ativos para exibir como anúncios
  let services: Service[] = []
  try {
    if (sql) {
      const servicesResult = (await sql!`
        SELECT * FROM services WHERE is_active = true
      `) as unknown as Service[]
      // Embaralhar e pegar até 3 serviços
      services = servicesResult.sort(() => Math.random() - 0.5).slice(0, 3)
    }
  } catch (error) {
    console.error("[Blog] Error fetching services:", error)
  }

  const publishedDate = new Date(post.published_at || post.created_at)
  const formattedDate = publishedDate.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Back Button */}
      <section className="bg-card/50 border-b sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="hover:bg-primary/10 h-8 text-xs">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Voltar</span>
              <span className="sm:hidden">←</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* Article */}
      <article className="flex-1 py-4 sm:py-6 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Category Badge */}
            {post.category && (
              <Badge variant="secondary" className="mb-2 text-xs">
                {post.category}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 leading-tight text-balance">
              {post.title}
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mb-4 pb-3 border-b border-border flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{formattedDate}</span>
              </div>
              {post.author_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{post.author_name}</span>
                </div>
              )}
            </div>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="relative w-full mb-4 rounded-lg overflow-hidden shadow-lg max-w-full">
                <div className="relative aspect-[4/3] max-h-[250px] sm:max-h-[280px] md:max-h-[300px]">
                  <ImageWithWatermark 
                    src={post.featured_image} 
                    alt={post.title} 
                    fill 
                    className="object-cover" 
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
                    showWatermark={true}
                    watermarkPosition="bottom-right"
                  />
                </div>
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-base sm:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed font-medium">
                {post.excerpt}
              </p>
            )}

            {/* Content with Ads */}
            <BlogContentWithAds content={post.content} services={services} />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-border">
                <p className="text-sm sm:text-base font-semibold text-foreground mb-4">Tags:</p>
                <div className="flex gap-2 sm:gap-3 flex-wrap">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs sm:text-sm px-3 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Instagram Post Generator */}
            <InstagramPostGenerator 
              post={{
                title: post.title,
                featured_image: post.featured_image,
                excerpt: post.excerpt,
                category: post.category,
                author_name: post.author_name,
                content: post.content,
              }} 
            />
          </div>
        </div>
      </article>
    </div>
  )
}

