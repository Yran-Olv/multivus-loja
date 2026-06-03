"use client"

import type React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"

interface ServiceFiltersProps {
  currentSearch?: string
}

export function ServiceFilters({ currentSearch }: ServiceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(currentSearch || "")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput.trim()) {
      params.set("busca", searchInput.trim())
    } else {
      params.delete("busca")
    }
    router.push(`/servicos?${params.toString()}`)
    setMobileFiltersOpen(false)
  }

  function clearFilters() {
    setSearchInput("")
    router.push("/servicos")
    setMobileFiltersOpen(false)
  }

  const hasFilters = currentSearch

  return (
    <div className="mb-8 space-y-6">
      {/* Desktop Search */}
      <div className="hidden md:block">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder="Buscar serviços..."
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
          <Button type="submit">Buscar</Button>
          {hasFilters && (
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </form>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder="Buscar serviços..."
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
          {hasFilters && (
            <Button type="button" variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  )
}

