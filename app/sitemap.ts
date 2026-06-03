import { MetadataRoute } from "next"
import { sql } from "@/lib/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.FRONTEND_DOMAIN || "http://localhost:3000"

  // Páginas estáticas
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/produtos`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/servicos`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/softwares`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sobre`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
  ]

  // Produtos
  let products: any[] = []
  try {
    if (sql) {
      products = (await sql!`SELECT id FROM products WHERE is_active = true`) as any[]
    }
  } catch (error) {
    console.error("Erro ao buscar produtos para sitemap:", error)
  }

  const productPages = products.map((product) => ({
    url: `${baseUrl}/produtos/${product.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Softwares
  let softwares: any[] = []
  try {
    if (sql) {
      softwares = (await sql!`SELECT id FROM softwares WHERE is_active = true`) as any[]
    }
  } catch (error) {
    console.error("Erro ao buscar softwares para sitemap:", error)
  }

  const softwarePages = softwares.map((software) => ({
    url: `${baseUrl}/softwares/${software.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Posts do blog (tabela opcional - pode não existir)
  let posts: any[] = []
  try {
    if (sql) {
      posts = (await sql!`SELECT slug FROM posts WHERE is_published = true`) as any[]
    }
  } catch (error: any) {
    // Tabela posts pode não existir ainda - não é crítico
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.warn("[Sitemap] Posts table not found (optional):", error.message)
    } else {
      console.error("Erro ao buscar posts para sitemap:", error)
    }
  }

  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...softwarePages, ...blogPages]
}

