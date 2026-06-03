"use client"

import type React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"

interface AdvancedProductFiltersProps {
  categories: string[]
  currentCategory?: string
  currentSearch?: string
  currentMinPrice?: string
  currentMaxPrice?: string
  currentSort?: string
}

export function AdvancedProductFilters({
  categories,
  currentCategory,
  currentSearch,
  currentMinPrice,
  currentMaxPrice,
  currentSort,
}: AdvancedProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentSearch || "")
  const [minPrice, setMinPrice] = useState(currentMinPrice || "")
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice || "")
  const [sort, setSort] = useState(currentSort || "recent")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  function updateFilters() {
    const params = new URLSearchParams()

    if (searchInput.trim()) {
      params.set("busca", searchInput.trim())
    }
    if (currentCategory) {
      params.set("categoria", currentCategory)
    }
    if (minPrice) {
      params.set("preco_min", minPrice)
    }
    if (maxPrice) {
      params.set("preco_max", maxPrice)
    }
    if (sort && sort !== "recent") {
      params.set("ordenar", sort)
    }

    router.push(`/produtos?${params.toString()}`)
    setMobileFiltersOpen(false)
  }

  function handleCategoryFilter(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (currentCategory === category) {
      params.delete("categoria")
    } else {
      params.set("categoria", category)
      params.delete("preco_min")
      params.delete("preco_max")
      params.delete("ordenar")
    }
    router.push(`/produtos?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateFilters()
  }

  function clearFilters() {
    setSearchInput("")
    setMinPrice("")
    setMaxPrice("")
    setSort("recent")
    router.push("/produtos")
    setMobileFiltersOpen(false)
  }

  const hasFilters = currentCategory || currentSearch || currentMinPrice || currentMaxPrice || (currentSort && currentSort !== "recent")

  const filterContent = (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" className="hidden sm:inline-flex">Buscar</Button>
      </form>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Faixa de Preço</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="min-price" className="text-xs text-muted-foreground">
              Mínimo
            </Label>
            <Input
              id="min-price"
              type="number"
              placeholder="R$ 0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max-price" className="text-xs text-muted-foreground">
              Máximo
            </Label>
            <Input
              id="max-price"
              type="number"
              placeholder="R$ 9999"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={updateFilters}
          className="w-full"
        >
          Aplicar Preço
        </Button>
      </div>

      {/* Sort */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Ordenar por</Label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Mais Recentes</SelectItem>
            <SelectItem value="price_asc">Menor Preço</SelectItem>
            <SelectItem value="price_desc">Maior Preço</SelectItem>
            <SelectItem value="name_asc">Nome A-Z</SelectItem>
            <SelectItem value="name_desc">Nome Z-A</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={updateFilters}
          className="w-full"
        >
          Aplicar Ordenação
        </Button>
      </div>

      {/* Category Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Categorias</Label>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={currentCategory === category ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm px-3 py-1"
              onClick={() => handleCategoryFilter(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="mb-8 space-y-6">
      {/* Desktop Filters */}
      <div className="hidden lg:block">{filterContent}</div>

      {/* Mobile Filters */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2 mb-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Buscar produtos..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchInput("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros</SheetTitle>
                <SheetDescription>
                  Aplique filtros para encontrar exatamente o que procura
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">{filterContent}</div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Quick Category Filters Mobile */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Categorias</Label>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={currentCategory === category ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-sm px-3 py-1 whitespace-nowrap"
                onClick={() => handleCategoryFilter(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

