"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  ALL_INFORMATICA_ICONS,
  INFORMATICA_ICON_GROUPS,
  INFORMATICA_ICON_MAP,
  type InformaticaIconSlug,
} from "@/lib/informatica-icons"

interface LucideIconPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onSelect: (slug: string) => void
}

export function LucideIconPicker({ open, onOpenChange, value, onSelect }: LucideIconPickerProps) {
  const [search, setSearch] = useState("")

  const normalizedSearch = search.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    if (!normalizedSearch) return INFORMATICA_ICON_GROUPS

    return INFORMATICA_ICON_GROUPS.map((group) => ({
      ...group,
      icons: group.icons.filter(
        (icon) =>
          icon.label.toLowerCase().includes(normalizedSearch) ||
          icon.slug.includes(normalizedSearch) ||
          icon.slug.replace(/-/g, " ").includes(normalizedSearch),
      ),
    })).filter((group) => group.icons.length > 0)
  }, [normalizedSearch])

  const handleOpenChange = (next: boolean) => {
    if (!next) setSearch("")
    onOpenChange(next)
  }

  const handleSelect = (slug: InformaticaIconSlug) => {
    onSelect(slug)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "!flex w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0",
          "h-[min(88dvh,760px)] max-h-[min(88dvh,760px)]",
          "sm:h-[min(85vh,720px)] sm:max-h-[min(85vh,720px)]",
        )}
      >
        {/* Cabeçalho fixo */}
        <div className="shrink-0 space-y-4 border-b px-5 pt-5 pb-4 pr-12">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle>Escolher ícone do serviço</DialogTitle>
            <DialogDescription>
              Ícones para informática, suporte técnico e TI. O ícone aparece na página de serviços da loja.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar: notebook, wifi, backup..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Grade rolável — ocupa o espaço restante */}
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="space-y-6 pb-2">
            {filteredGroups.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhum ícone encontrado para &quot;{search}&quot;.
              </p>
            ) : (
              filteredGroups.map((group) => (
                <section key={group.id}>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {group.icons.map((icon) => {
                      const Icon = INFORMATICA_ICON_MAP[icon.slug]
                      const selected = value === icon.slug
                      return (
                        <button
                          key={icon.slug}
                          type="button"
                          title={icon.label}
                          onClick={() => handleSelect(icon.slug)}
                          className={cn(
                            "flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-lg border p-2 transition-colors",
                            "hover:border-primary/40 hover:bg-accent",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            selected && "border-primary bg-primary/10 ring-1 ring-primary/30",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0 text-primary sm:h-6 sm:w-6" />
                          <span className="line-clamp-2 text-center text-[10px] leading-tight text-muted-foreground">
                            {icon.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>

        {/* Rodapé fixo */}
        <div className="shrink-0 border-t bg-muted/40 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{ALL_INFORMATICA_ICONS.length}</span> ícones
            disponíveis
            {value ? (
              <>
                {" "}
                · selecionado: <code className="rounded bg-background px-1 py-0.5 text-foreground">{value}</code>
              </>
            ) : null}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Role para ver todas as categorias</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
