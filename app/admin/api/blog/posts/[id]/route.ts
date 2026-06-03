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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const posts = await sql!`
      SELECT p.*, a.full_name as author_name
      FROM posts p
      LEFT JOIN admin_users a ON p.author_id = a.id
      WHERE p.id = ${id}
    `

    if (posts.length === 0) {
      return NextResponse.json({ error: "Post não encontrado" }, { status: 404 })
    }

    return NextResponse.json(posts[0])
  } catch (error) {
    console.error("[API] Error fetching post:", error)
    return NextResponse.json({ error: "Erro ao buscar post" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAuth(request)
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()

    // Pre-processar dados: normalizar valores vazios para null
    // Formatar e sanitizar o conteúdo do blog
    const formattedContent = sanitizeAndFormatBlogContent(body.content || "")

    const processedData = {
      title: sanitizeString(body.title || ""),
      slug: body.slug || "",
      excerpt: body.excerpt?.trim() || null,
      content: formattedContent,
      category: body.category?.trim() || null,
      tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : null,
      featured_image: body.featured_image?.trim() || null,
      is_published: body.is_published ?? false,
      published_at: body.published_at || null,
    }

    const validationResult = postSchema.safeParse(processedData)

    if (!validationResult.success) {
      console.error("[API] Validation errors:", validationResult.error.errors)
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.errors }, { status: 400 })
    }

    const validatedData = validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Verificar se slug já existe em outro post
    const existing = await sql!`SELECT id FROM posts WHERE slug = ${validatedData.slug} AND id != ${id}`
    if (existing.length > 0) {
      return NextResponse.json({ error: "Slug já existe em outro post" }, { status: 400 })
    }

    // Garantir que valores undefined sejam null
    const safeExcerpt = validatedData.excerpt ?? null
    const safeCategory = validatedData.category ?? null
    const safeTags = validatedData.tags ?? null
    const safeFeaturedImage = validatedData.featured_image ?? null
    const safePublishedAt = validatedData.published_at ?? null

    await sql!`
      UPDATE posts
      SET title = ${validatedData.title},
          slug = ${validatedData.slug},
          excerpt = ${safeExcerpt},
          content = ${validatedData.content},
          category = ${safeCategory},
          tags = ${safeTags},
          featured_image = ${safeFeaturedImage},
          is_published = ${validatedData.is_published},
          published_at = ${safePublishedAt},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error updating post:", error)
    return NextResponse.json({ error: "Erro ao atualizar post" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    await sql!`DELETE FROM posts WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error deleting post:", error)
    return NextResponse.json({ error: "Erro ao excluir post" }, { status: 500 })
  }
}

