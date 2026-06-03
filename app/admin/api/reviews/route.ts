import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { z } from "zod"
import { sanitizeString } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

const reviewSchema = z.object({
  product_id: z.number(),
  customer_name: z.string().min(3),
  customer_email: z.string().email(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 3 })

    if (!limit.allowed) {
      return NextResponse.json({ error: "Muitas requisições" }, { status: 429 })
    }

    const body = await request.json()
    const validationResult = reviewSchema.safeParse({
      ...body,
      title: body.title ? sanitizeString(body.title) : undefined,
      comment: body.comment ? sanitizeString(body.comment) : undefined,
    })

    if (!validationResult.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validationResult.error.errors }, { status: 400 })
    }

    const { product_id, customer_name, customer_email, rating, title, comment } = validationResult.data

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const safeTitle = title ?? null
    const safeComment = comment ?? null

    await sql!`
      INSERT INTO reviews (product_id, customer_name, customer_email, rating, title, comment, is_approved)
      VALUES (${product_id}, ${customer_name}, ${customer_email}, ${rating}, ${safeTitle}, ${safeComment}, false)
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] Error creating review:", error)
    return NextResponse.json({ error: "Erro ao criar avaliação" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get("product_id")

    if (!productId) {
      return NextResponse.json({ error: "product_id é obrigatório" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const reviews = await sql!`
      SELECT * FROM reviews
      WHERE product_id = ${productId} AND is_approved = true
      ORDER BY created_at DESC
    `

    // Calcular média
    const avgResult = await sql!`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
      FROM reviews
      WHERE product_id = ${productId} AND is_approved = true
    `

    return NextResponse.json({
      reviews,
      average: avgResult[0]?.avg_rating || 0,
      total: avgResult[0]?.total_reviews || 0,
    })
  } catch (error) {
    console.error("[API] Error fetching reviews:", error)
    return NextResponse.json({ error: "Erro ao buscar avaliações" }, { status: 500 })
  }
}

