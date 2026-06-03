"use client"

import { useEffect, useRef } from "react"

interface BlogContentFormatterProps {
  content: string
  className?: string
}

export function BlogContentFormatter({ content, className = "" }: BlogContentFormatterProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    const element = contentRef.current

    // Função para formatar o conteúdo HTML
    const formatContent = () => {
      // Garantir que parágrafos tenham espaçamento adequado
      const paragraphs = element.querySelectorAll("p")
      paragraphs.forEach((p) => {
        if (p.textContent?.trim()) {
          if (!p.classList.contains("mb-4")) {
            p.classList.add("mb-4", "leading-relaxed", "text-foreground/90")
          }
          // Normalizar espaços múltiplos
          if (p.textContent) {
            const normalized = p.textContent.trim().replace(/\s+/g, " ")
            if (p.textContent !== normalized) {
              p.textContent = normalized
            }
          }
        } else {
          // Remover parágrafos vazios apenas se ainda estiverem no DOM
          if (p.parentNode && p.parentNode.contains(p)) {
            try {
              p.remove()
            } catch (error) {
              // Ignorar erro se o React já removeu
              console.warn("[BlogContentFormatter] Erro ao remover parágrafo vazio:", error)
            }
          }
        }
      })

      // Garantir que listas tenham espaçamento adequado
      const lists = element.querySelectorAll("ul, ol")
      lists.forEach((list) => {
        list.classList.add("my-4", "ml-6", "space-y-2")
        const items = list.querySelectorAll("li")
        items.forEach((item) => {
          item.classList.add("leading-relaxed")
        })
      })

      // Garantir que títulos tenham hierarquia correta
      const headings = element.querySelectorAll("h1, h2, h3, h4, h5, h6")
      headings.forEach((heading) => {
        const level = parseInt(heading.tagName.charAt(1))
        
        // Converter h1 para h2 (já temos h1 no layout)
        if (level === 1 && heading.tagName === "H1") {
          // Verificar se o heading ainda está no DOM antes de substituir
          if (!heading.parentNode || !heading.parentNode.contains(heading)) {
            return
          }
          
          try {
            const h2 = document.createElement("h2")
            h2.innerHTML = heading.innerHTML
            heading.replaceWith(h2)
            h2.classList.add("font-bold", "mt-8", "mb-4", "text-2xl", "md:text-3xl", "text-foreground")
          } catch (error) {
            // Ignorar erro se o React já modificou o DOM
            console.warn("[BlogContentFormatter] Erro ao converter H1:", error)
          }
          return
        }
        
        if (!heading.classList.contains("font-bold")) {
          heading.classList.add("font-bold", "mt-6", "mb-3", "text-foreground")
        }
        
        if (level === 2) {
          heading.classList.add("text-2xl", "md:text-3xl")
        } else if (level === 3) {
          heading.classList.add("text-xl", "md:text-2xl")
        } else {
          heading.classList.add("text-lg", "md:text-xl")
        }
      })

      // Garantir que imagens sejam responsivas
      const images = element.querySelectorAll("img")
      images.forEach((img) => {
        img.classList.add("rounded-lg", "shadow-lg", "my-6", "w-full", "h-auto", "max-w-full")
        if (!img.hasAttribute("loading")) {
          img.setAttribute("loading", "lazy")
        }
      })

      // Garantir que links sejam destacados
      const links = element.querySelectorAll("a")
      links.forEach((link) => {
        link.classList.add("text-primary", "underline", "hover:text-primary/80", "transition-colors")
        if (!link.hasAttribute("target")) {
          link.setAttribute("target", "_blank")
          link.setAttribute("rel", "noopener noreferrer")
        }
      })

      // Garantir que código seja formatado
      const codeBlocks = element.querySelectorAll("code")
      codeBlocks.forEach((code) => {
        if (code.parentElement?.tagName !== "PRE") {
          code.classList.add("bg-muted", "px-1.5", "py-0.5", "rounded", "text-sm", "font-mono", "text-primary")
        }
      })

      const preBlocks = element.querySelectorAll("pre")
      preBlocks.forEach((pre) => {
        pre.classList.add("bg-muted", "p-4", "rounded-lg", "overflow-x-auto", "my-4", "border", "border-border")
      })

      // Garantir que citações sejam destacadas
      const blockquotes = element.querySelectorAll("blockquote")
      blockquotes.forEach((quote) => {
        quote.classList.add("border-l-4", "border-primary", "pl-4", "my-4", "italic", "text-muted-foreground")
      })

      // Garantir que tabelas sejam responsivas
      const tables = element.querySelectorAll("table")
      tables.forEach((table) => {
        // Verificar se a tabela ainda está no DOM e se já não tem wrapper
        if (!table.parentElement || table.parentElement.classList.contains("overflow-x-auto")) {
          return
        }
        
        table.classList.add("w-full", "border-collapse", "my-4")
        const wrapper = document.createElement("div")
        wrapper.className = "overflow-x-auto my-4"
        
        // Verificar se o parentNode ainda existe antes de manipular
        const parent = table.parentNode
        if (parent && parent.contains(table)) {
          try {
            parent.insertBefore(wrapper, table)
            wrapper.appendChild(table)
          } catch (error) {
            // Ignorar erros de manipulação DOM se o React já modificou
            console.warn("[BlogContentFormatter] Erro ao envolver tabela:", error)
          }
        }
      })

      // Remover espaços em branco desnecessários
      const textNodes = Array.from(element.childNodes).filter(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === ""
      )
      textNodes.forEach((node) => {
        // Verificar se o nó ainda está no DOM antes de remover
        if (node.parentNode && node.parentNode.contains(node)) {
          try {
            node.remove()
          } catch (error) {
            // Ignorar erros se o React já removeu o nó
            console.warn("[BlogContentFormatter] Erro ao remover nó de texto:", error)
          }
        }
      })
    }

    formatContent()

    // Observar mudanças no DOM apenas se necessário
    // Usar um flag para evitar loops infinitos
    let isFormatting = false
    
    const observer = new MutationObserver((mutations) => {
      // Ignorar mutações causadas pela própria formatação
      if (isFormatting) return
      
      // Verificar se ainda há mudanças relevantes
      const hasRelevantChanges = mutations.some((mutation) => {
        return mutation.type === "childList" && mutation.addedNodes.length > 0
      })
      
      if (hasRelevantChanges) {
        isFormatting = true
        try {
          formatContent()
        } finally {
          // Usar setTimeout para garantir que o flag seja resetado após o React processar
          setTimeout(() => {
            isFormatting = false
          }, 0)
        }
      }
    })
    
    observer.observe(element, {
      childList: true,
      subtree: true,
    })

    return () => {
      observer.disconnect()
    }
  }, [content])

  return (
    <div
      ref={contentRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

