import { Metadata } from "next"
import { sql } from "@/lib/db"
import { generateMetadata as genMeta } from "@/lib/metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  try {
    if (!sql) {
      return genMeta({
        title: "Produto - MULTIVUS",
        description: "Confira nossos produtos",
      })
    }

    const products = (await sql!`SELECT name, description, image_url FROM products WHERE id = ${id} AND is_active = true`) as any[]

    if (products.length === 0) {
      return genMeta({
        title: "Produto não encontrado - MULTIVUS",
        description: "O produto que você está procurando não foi encontrado.",
      })
    }

    const product = products[0]

    return genMeta({
      title: `${product.name} - MULTIVUS`,
      description: product.description || `Confira ${product.name} na MULTIVUS`,
      image: product.image_url || undefined,
      url: `/produtos/${id}`,
    })
  } catch (error) {
    return genMeta({
      title: "Produto - MULTIVUS",
      description: "Confira nossos produtos",
    })
  }
}

