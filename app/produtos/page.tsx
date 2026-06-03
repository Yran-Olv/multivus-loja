import { sql } from "@/lib/db"
import type { Product } from "@/lib/db"
import { ProductGrid } from "@/components/product-grid"
import { AdvancedProductFilters } from "@/components/advanced-product-filters"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busca?: string; preco_min?: string; preco_max?: string; ordenar?: string }>
}) {
  const params = await searchParams
  const { categoria, busca, preco_min, preco_max, ordenar } = params

  // Fetch products with optional filtering
  let products: Product[] = []
  let categories: string[] = []
  
  try {
    if (!sql) {
      console.warn("[Produtos] Database not available, showing empty list")
    } else {
        // Construir query base
        let baseQuery = sql!`SELECT * FROM products WHERE is_active = true`
        
        if (categoria) {
          baseQuery = sql!`${baseQuery} AND category = ${categoria}`
        }

        if (busca) {
          // Busca flexível: palavras parciais e completas
          const searchWords = busca.trim().toLowerCase().split(/\s+/).filter(w => w.length > 0)
          
          // Criar condições para cada palavra
          let searchConditions = sql!`(`
          for (let i = 0; i < searchWords.length; i++) {
            const word = searchWords[i]
            const wordPattern = `%${word}%`
            const startsWithPattern = `${word}%`
            
            if (i > 0) {
              searchConditions = sql!`${searchConditions} AND (`
            }
            
            searchConditions = sql!`${searchConditions} 
              (name ILIKE ${wordPattern} OR description ILIKE ${wordPattern} OR name ILIKE ${startsWithPattern})
            `
            
            if (i < searchWords.length - 1) {
              searchConditions = sql!`${searchConditions})`
            }
          }
          searchConditions = sql!`${searchConditions})`
          
          baseQuery = sql!`${baseQuery} AND ${searchConditions}`
        }

        if (preco_min) {
          const minPrice = parseFloat(preco_min)
          if (!isNaN(minPrice)) {
            baseQuery = sql!`${baseQuery} AND price >= ${minPrice}`
          }
        }

        if (preco_max) {
          const maxPrice = parseFloat(preco_max)
          if (!isNaN(maxPrice)) {
            baseQuery = sql!`${baseQuery} AND price <= ${maxPrice}`
          }
        }

        // Adicionar ordenação
        if (ordenar === "price_asc") {
          baseQuery = sql!`${baseQuery} ORDER BY price ASC`
        } else if (ordenar === "price_desc") {
          baseQuery = sql!`${baseQuery} ORDER BY price DESC`
        } else if (ordenar === "name_asc") {
          baseQuery = sql!`${baseQuery} ORDER BY name ASC`
        } else if (ordenar === "name_desc") {
          baseQuery = sql!`${baseQuery} ORDER BY name DESC`
        } else {
          baseQuery = sql!`${baseQuery} ORDER BY created_at DESC`
        }
        
        products = (await baseQuery) as unknown as Product[]

        // Get all categories
        const categoriesResult = await sql!`
          SELECT DISTINCT category FROM products WHERE is_active = true ORDER BY category
        ` as Array<{ category: string }>
        categories = categoriesResult.map((row) => row.category)
      }
  } catch (error) {
    console.error("[Produtos] Error fetching products:", error)
    products = []
    categories = []
  }

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              Produtos
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Equipamentos de <span className="text-primary">Qualidade</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Notebooks, desktops, periféricos e componentes das melhores marcas
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <AdvancedProductFilters 
            categories={categories} 
            currentCategory={categoria} 
            currentSearch={busca}
            currentMinPrice={preco_min}
            currentMaxPrice={preco_max}
            currentSort={ordenar}
          />

          {products.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-muted-foreground">
                  {products.length} {products.length === 1 ? "produto encontrado" : "produtos encontrados"}
                </p>
              </div>
              <ProductGrid products={products} />
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
