"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, X, Package, Wrench, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface SearchResult {
  type: "product" | "service"
  id: number
  name: string
  description?: string
  price?: number
  category?: string
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedSearch = useDebounce(search, 200)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => {
      try {
        document.removeEventListener("keydown", down)
      } catch (error) {
        // Ignorar erro se o listener já foi removido
        console.warn("[GlobalSearch] Erro ao remover listener:", error)
      }
    }
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.trim().length < 1) {
      setResults([])
      return
    }

    async function searchItems() {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearch)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
        }
      } catch (error) {
        console.error("Erro na busca:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    searchItems()
  }, [debouncedSearch])

  function handleSelect(result: SearchResult) {
    // Fechar o diálogo primeiro para evitar conflitos de DOM
    setOpen(false)
    setSearch("")
    
    // Usar setTimeout para garantir que o DOM seja atualizado antes da navegação
    setTimeout(() => {
      if (result.type === "product") {
        router.push(`/produtos/${result.id}`)
      } else {
        router.push(`/servicos?servico=${encodeURIComponent(result.name)}#solicitar-servico`)
      }
    }, 100)
  }

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-64 lg:w-80"
        )}
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar produtos e serviços...</span>
        <span className="lg:hidden">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar produtos e serviços..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && results.length === 0 && debouncedSearch && (
            <CommandEmpty>
              {debouncedSearch.length < 1
                ? "Digite para buscar..."
                : "Nenhum resultado encontrado"}
            </CommandEmpty>
          )}
          {!loading && results.length > 0 && (
            <>
              <CommandGroup heading="Produtos">
                {results
                  .filter((r) => r.type === "product")
                  .slice(0, 5)
                  .map((result) => (
                    <CommandItem
                      key={`product-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3"
                    >
                      <Package className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {result.description}
                          </div>
                        )}
                        {result.price && (
                          <div className="text-xs font-semibold text-primary">
                            R$ {Number(result.price).toFixed(2).replace(".", ",")}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
              <CommandGroup heading="Serviços">
                {results
                  .filter((r) => r.type === "service")
                  .slice(0, 5)
                  .map((result) => (
                    <CommandItem
                      key={`service-${result.id}`}
                      onSelect={() => handleSelect(result)}
                      className="flex items-center gap-3"
                    >
                      <Wrench className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        {result.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {result.description}
                          </div>
                        )}
                        {result.type === "service" ? (
                          <div className="text-xs font-semibold text-primary">
                            {Number(result.price) > 0
                              ? `A partir de R$ ${Number(result.price).toFixed(2).replace(".", ",")} — sob orçamento`
                              : "Sobre orçamento"}
                          </div>
                        ) : result.price ? (
                          <div className="text-xs font-semibold text-primary">
                            R$ {Number(result.price).toFixed(2).replace(".", ",")}
                          </div>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

