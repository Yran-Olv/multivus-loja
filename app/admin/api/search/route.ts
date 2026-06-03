import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { createSearchTerms } from "@/lib/search-helpers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json({ results: [] })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ results: [] })
    }

    const searchQuery = query.trim()
    const searchLower = searchQuery.toLowerCase()
    
    // Dividir em palavras individuais para busca mais flexível
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0)
    
    if (searchWords.length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Criar padrões de busca para cada palavra
    // Busca por palavras parciais (ex: "manu" encontra "Manutenção")
    // E também busca pelo termo completo
    const allPatterns: string[] = []
    const allStartsWith: string[] = []
    
    // Adicionar padrões para cada palavra individual
    for (const word of searchWords) {
      if (word.length >= 2) {
        allPatterns.push(`%${word}%`)
        allStartsWith.push(`${word}%`)
      }
    }
    
    // Adicionar padrão para o termo completo também
    if (searchQuery.length >= 2) {
      allPatterns.push(`%${searchLower}%`)
      allStartsWith.push(`${searchLower}%`)
    }

    // Construir condições SQL simples e eficiente
    // Busca flexível: aceita qualquer palavra parcial ou completa
    const mainPattern = `%${searchLower}%`
    const mainStartsWith = `${searchLower}%`
    
    // Para cada palavra individual também
    const wordPatterns = searchWords
      .filter(w => w.length >= 2)
      .map(w => `%${w}%`)
    
    // Construir condições para produtos
    let productWhere = sql!`is_active = true AND (
      name ILIKE ${mainPattern} 
      OR description ILIKE ${mainPattern} 
      OR category ILIKE ${mainPattern}
      OR name ILIKE ${mainStartsWith}
    `
    
    // Adicionar condições para cada palavra individual
    for (const wordPattern of wordPatterns) {
      productWhere = sql!`${productWhere} 
        OR name ILIKE ${wordPattern} 
        OR description ILIKE ${wordPattern} 
        OR category ILIKE ${wordPattern}
      `
    }
    
    productWhere = sql!`${productWhere})`
    
    // Construir condições para serviços
    let serviceWhere = sql!`is_active = true AND (
      name ILIKE ${mainPattern} 
      OR description ILIKE ${mainPattern}
      OR name ILIKE ${mainStartsWith}
    `
    
    // Adicionar condições para cada palavra individual
    for (const wordPattern of wordPatterns) {
      serviceWhere = sql!`${serviceWhere} 
        OR name ILIKE ${wordPattern} 
        OR description ILIKE ${wordPattern}
      `
    }
    
    serviceWhere = sql!`${serviceWhere})`

    // Buscar produtos com busca flexível
    const products = await sql!`
      SELECT 
        id,
        name,
        description,
        price,
        category,
        'product' as type,
        CASE 
          WHEN LOWER(name) LIKE LOWER(${mainStartsWith}) THEN 1
          WHEN LOWER(name) LIKE LOWER(${mainPattern}) THEN 2
          WHEN LOWER(description) LIKE LOWER(${mainPattern}) THEN 3
          WHEN LOWER(category) LIKE LOWER(${mainPattern}) THEN 4
          ELSE 5
        END as relevance
      FROM products
      WHERE ${productWhere}
      ORDER BY 
        relevance ASC,
        name ASC
      LIMIT 10
    `

    // Buscar serviços com busca flexível
    const services = await sql!`
      SELECT 
        id,
        name,
        description,
        price_from as price,
        NULL as category,
        'service' as type,
        CASE 
          WHEN LOWER(name) LIKE LOWER(${mainStartsWith}) THEN 1
          WHEN LOWER(name) LIKE LOWER(${mainPattern}) THEN 2
          WHEN LOWER(description) LIKE LOWER(${mainPattern}) THEN 3
          ELSE 4
        END as relevance
      FROM services
      WHERE ${serviceWhere}
      ORDER BY 
        relevance ASC,
        name ASC
      LIMIT 10
    `

    const results = [
      ...products.map((p: any) => ({
        type: "product" as const,
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
      })),
      ...services.map((s: any) => ({
        type: "service" as const,
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price,
        category: null,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[Search API] Erro:", error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}

