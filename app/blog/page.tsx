import { sql } from "@/lib/db"
import { BlogPostCard } from "@/components/blog-post-card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const params = await searchParams
  const { categoria } = params

  let posts: any[] = []
  let categories: string[] = []
  
  try {
    if (sql) {
      // Construir query corretamente baseado na categoria
      // Buscar apenas posts publicados (is_published = true)
      if (categoria) {
        posts = await sql!`
          SELECT p.*, a.full_name as author_name
          FROM posts p
          LEFT JOIN admin_users a ON p.author_id = a.id
          WHERE p.is_published = true
            AND p.category = ${categoria}
          ORDER BY COALESCE(p.published_at, p.created_at) DESC
        ` as any[]
      } else {
        posts = await sql!`
          SELECT p.*, a.full_name as author_name
          FROM posts p
          LEFT JOIN admin_users a ON p.author_id = a.id
          WHERE p.is_published = true
          ORDER BY COALESCE(p.published_at, p.created_at) DESC
        ` as any[]
      }
      
      console.log(`[Blog] Found ${posts.length} published posts (categoria: ${categoria || 'todas'})`)

      // Buscar categorias
      const categoriesResult = await sql!`
        SELECT DISTINCT category 
        FROM posts 
        WHERE is_published = true AND category IS NOT NULL 
        ORDER BY category
      ` as Array<{ category: string | null }>
      categories = categoriesResult.map((row) => row.category || "Sem categoria")
    } else {
      console.warn("[Blog] Database not available, showing empty list")
    }
  } catch (error) {
    console.error("[Blog] Error fetching posts:", error)
    posts = []
    categories = []
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-card py-3 md:py-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-2">
            <Badge variant="secondary" className="mb-1 text-xs px-2.5 py-0.5">
              Blog MULTIVUS
            </Badge>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-balance leading-tight">
              Artigos e <span className="text-primary">Notícias</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Dicas, tutoriais e novidades sobre tecnologia e informática
            </p>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <section className="sticky top-0 z-10 bg-background/98 backdrop-blur-md border-b border-border/50 py-2 shadow-lg shadow-black/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <Link href="/blog" className="flex-shrink-0">
                <Badge 
                  variant={!categoria ? "default" : "outline"} 
                  className="px-3 py-1.5 text-xs font-medium hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  📚 Todos
                </Badge>
              </Link>
              {categories.map((cat: string) => (
                <Link key={cat} href={`/blog?categoria=${encodeURIComponent(cat)}`} className="flex-shrink-0">
                  <Badge 
                    variant={categoria === cat ? "default" : "outline"}
                    className="px-3 py-1.5 text-xs font-medium hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    {cat}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section className="py-3 md:py-4 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {posts.map((post: any, index: number) => (
                <div 
                  key={post.id}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                >
                  <BlogPostCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full text-center py-16 md:py-24">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-muted-foreground text-lg md:text-xl font-semibold">Nenhum artigo encontrado</p>
                <p className="text-sm text-muted-foreground/70">
                  {categoria ? `Não há posts na categoria "${categoria}"` : "Ainda não há posts publicados"}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
