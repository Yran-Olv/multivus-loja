"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"

export function SearchBox() {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Ignorar o primeiro render para evitar redirecionamento ao carregar a página
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Só redirecionar se o usuário realmente digitou algo
    if (debouncedSearch && debouncedSearch.trim()) {
      router.push(`/produtos?busca=${encodeURIComponent(debouncedSearch)}`)
    }
    // Não redirecionar quando a busca está vazia - deixar o usuário na página atual
  }, [debouncedSearch, router])

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar produtos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-10 pr-10"
      />
      {search && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
          onClick={() => setSearch("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

