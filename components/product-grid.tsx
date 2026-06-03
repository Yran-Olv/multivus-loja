import Link from "next/link"
import { ImageWithWatermark } from "@/components/image-with-watermark"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/db"
import { Package } from "lucide-react"

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <Card key={product.id} className="card-glow flex flex-col h-full">
          <CardHeader className="p-3 sm:p-4">
            <div className="aspect-square relative bg-muted rounded-md mb-3 sm:mb-4 overflow-hidden max-h-[250px] sm:max-h-[280px] md:max-h-[300px]">
              {product.image_url && product.image_url.trim() !== "" ? (
                <ImageWithWatermark 
                  src={product.image_url} 
                  alt={product.name} 
                  fill 
                  className="object-cover"
                  showWatermark={true}
                  watermarkPosition="bottom-right"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <Badge variant="secondary" className="w-fit mb-2">
              {product.category}
            </Badge>
            <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
            <CardDescription className="line-clamp-2">{product.description}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 flex-1 flex flex-col">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    R$ {Number(product.price).toFixed(2).replace(".", ",")}
                  </p>
                  {product.stock_quantity > 0 ? (
                    <p className="text-xs text-muted-foreground">{product.stock_quantity} em estoque</p>
                  ) : (
                    <p className="text-xs text-destructive">Fora de estoque</p>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/produtos/${product.id}`} className="mt-auto">
              <Button className="w-full bg-transparent" variant="outline">
                Ver Detalhes
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
