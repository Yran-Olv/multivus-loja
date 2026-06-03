"use client"

import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X } from "lucide-react"
import { useState } from "react"

interface ProductFiltersProps {
  categories: string[]
  currentCategory?: string
  currentSearch?: string
}

export function ProductFilters({ categories, currentCategory, currentSearch }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentSearch || "")

  function handleCategoryFilter(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (currentCategory === category) {
      params.delete("categoria")
    } else {
      params.set("categoria", category)
    }
    router.push(`/produtos?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput) {
      params.set("busca", searchInput)
    } else {
      params.delete("busca")
    }
    router.push(`/produtos?${params.toString()}`)
  }

  function clearFilters() {
    setSearchInput("")
    router.push("/produtos")
  }

  const hasFilters = currentCategory || currentSearch

  return (
    <div className="mb-8 space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Buscar</Button>
      </form>

      {/* Category Filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Categorias</h3>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={currentCategory === category ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => handleCategoryFilter(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
