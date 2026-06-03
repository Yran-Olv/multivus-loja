"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Monitor, Wrench, Menu, ShoppingCart } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/contexts/CartContext"
import { Badge } from "@/components/ui/badge"
import { GlobalSearch } from "@/components/global-search"

export function Header() {
  const { getItemCount } = useCart()
  const itemCount = getItemCount()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2 font-bold text-xl">
            <Monitor className="h-6 w-6 text-primary" />
            <span className="text-foreground">
              MULTI<span className="text-primary">VUS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            <GlobalSearch />
            <Link
              href="/home"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </Link>
            <Link
              href="/produtos"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Produtos
            </Link>
            <Link
              href="/servicos"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Serviços
            </Link>
            <Link
              href="/softwares"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Softwares
            </Link>
            <Link
              href="/sobre"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sobre
            </Link>
            <Link
              href="/contato"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contato
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/cliente"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Área do Cliente
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/carrinho" className="relative">
              <Button variant="outline" size="icon">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/solicitar-servico">
              <Button>
                <Wrench className="mr-2 h-4 w-4" />
                Solicitar Assistência
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/home" className="text-lg font-medium hover:text-primary transition-colors">
                  Início
                </Link>
                <Link href="/produtos" className="text-lg font-medium hover:text-primary transition-colors">
                  Produtos
                </Link>
                <Link href="/servicos" className="text-lg font-medium hover:text-primary transition-colors">
                  Serviços
                </Link>
                <Link href="/softwares" className="text-lg font-medium hover:text-primary transition-colors">
                  Softwares
                </Link>
                <Link href="/sobre" className="text-lg font-medium hover:text-primary transition-colors">
                  Sobre
                </Link>
                <Link href="/contato" className="text-lg font-medium hover:text-primary transition-colors">
                  Contato
                </Link>
                <Link href="/blog" className="text-lg font-medium hover:text-primary transition-colors">
                  Blog
                </Link>
                <Link href="/cliente" className="text-lg font-medium hover:text-primary transition-colors">
                  Área do Cliente
                </Link>
                <Link href="/carrinho" className="mt-4">
                  <Button variant="outline" className="w-full relative">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Carrinho
                    {itemCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                        {itemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <Link href="/solicitar-servico" className="mt-2">
                  <Button className="w-full">
                    <Wrench className="mr-2 h-4 w-4" />
                    Solicitar Assistência
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
