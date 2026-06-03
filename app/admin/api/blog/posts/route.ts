import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { z } from "zod"
import { sanitizeString } from "@/lib/validation"
import { sanitizeAndFormatBlogContent } from "@/lib/blog-content-formatter"
import { verifyAuth } from "@/lib/middleware"

const postSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(10),
  category: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  featured_image: z.string().optional().nullable(),
  is_published: z.boolean(),
  published_at: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    
    // Preparar dados para validação
    // Normalizar featured_image: aceita URL completa, relativa, string vazia ou null
    let featuredImage = null
    if (body.featured_image) {
      const trimmed = body.featured_image.trim()
      if (trimmed.length > 0) {
        // Aceita URL completa (http/https) ou URL relativa (começa com /)
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
          featuredImage = trimmed
        }
        // Se não for URL válida, ignora (define como null)
      }
    }

    // Formatar e sanitizar o conteúdo do blog
    const formattedContent = sanitizeAndFormatBlogContent(body.content || "")

    const dataToValidate = {
      title: sanitizeString(body.title || ""),
      slug: body.slug || "",
      excerpt: body.excerpt ? sanitizeString(body.excerpt) : null,
      content: formattedContent,
      category: body.category || null,
      tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : null,
      featured_image: featuredImage,
      is_published: body.is_published === true || body.is_published === "true" || false,
      published_at: body.published_at || null,
    }

    const validationResult = postSchema.safeParse(dataToValidate)

    if (!validationResult.success) {
      console.error("[API] Validation errors:", validationResult.error.errors)
      return NextResponse.json(
        { 
          error: "Dados inválidos", 
          details: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const { title, slug, excerpt, content, category, tags, featured_image, is_published, published_at } =
      validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Verificar se slug já existe (apenas para novos posts)
    const existing = await sql!`SELECT id FROM posts WHERE slug = ${slug}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slug já existe. Escolha outro slug." }, { status: 400 })
    }

    // Converter tags array para formato PostgreSQL e garantir que valores undefined sejam null
    const tagsArray = tags && tags.length > 0 ? tags : null
    const safeExcerpt = excerpt ?? null
    const safeCategory = category ?? null
    const safeFeaturedImage = featured_image ?? null
    const safePublishedAt = published_at ?? null

    await sql!`
      INSERT INTO posts (
        title, slug, excerpt, content, category, tags, featured_image,
        author_id, is_published, published_at
      )
      VALUES (
        ${title}, ${slug}, ${safeExcerpt}, ${content}, ${safeCategory},
        ${tagsArray}, ${safeFeaturedImage}, ${auth.userId}, ${is_published}, ${safePublishedAt}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error creating post:", error)
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const published = searchParams.get("published")

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    let query = sql!`
      SELECT p.*, a.full_name as author_name
      FROM posts p
      LEFT JOIN admin_users a ON p.author_id = a.id
      WHERE 1=1
    `

    if (category) {
      query = sql!`${query} AND p.category = ${category}`
    }

    if (published === "true") {
      query = sql!`${query} AND p.is_published = true`
    }

    query = sql!`${query} ORDER BY p.created_at DESC`

    const posts = await query

    return NextResponse.json(posts)
  } catch (error) {
    console.error("[API] Error fetching posts:", error)
    return NextResponse.json({ error: "Erro ao buscar posts" }, { status: 500 })
  }
}

