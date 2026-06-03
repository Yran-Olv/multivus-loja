"use client"

import { BlogContentFormatter } from "./blog-content-formatter"
import { BlogAdBanner } from "./blog-ad-banner"
import type { Service } from "@/lib/db"
import { useMemo } from "react"

interface BlogContentWithAdsProps {
  content: string
  services: Service[]
}

export function BlogContentWithAds({ content, services }: BlogContentWithAdsProps) {
  const proseClasses = "prose prose-invert prose-lg sm:prose-xl max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:text-base prose-p:md:text-lg prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium prose-strong:text-foreground prose-strong:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-li:text-foreground/90 prose-li:leading-relaxed prose-img:rounded-xl prose-img:shadow-2xl prose-img:w-full prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-foreground/80 prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto prose-hr:border-border prose-hr:my-6 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-border prose-th:p-2 prose-th:bg-muted prose-td:border prose-td:border-border prose-td:p-2"

  // Dividir o conteúdo e inserir banners de anúncios
  const contentWithAds = useMemo(() => {
    if (!content) {
      return []
    }

    if (services.length === 0) {
      return [{ type: "content" as const, data: content }]
    }

    // Dividir por tags de fechamento de parágrafo
    const parts = content.split(/(<\/p>)/)
    const paragraphs: string[] = []
    let currentParagraph = ""

    for (let i = 0; i < parts.length; i++) {
      currentParagraph += parts[i]
      if (parts[i] === "</p>") {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph)
        }
        currentParagraph = ""
      }
    }
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph)
    }

    // Se não houver parágrafos suficientes, retornar conteúdo sem anúncios
    if (paragraphs.length < 3) {
      return [{ type: "content" as const, data: content }]
    }

    // Calcular posições para anúncios (25%, 50%, 75% do conteúdo)
    const adPositions = [
      Math.max(1, Math.floor(paragraphs.length * 0.25)),
      Math.max(2, Math.floor(paragraphs.length * 0.5)),
      Math.max(3, Math.floor(paragraphs.length * 0.75)),
    ].filter((pos, index, arr) => {
      // Garantir que as posições sejam únicas e não muito próximas
      return pos > 0 && pos < paragraphs.length && (index === 0 || pos - arr[index - 1] > 2)
    }).slice(0, services.length)

    // Inserir anúncios nas posições calculadas
    const result: Array<{ type: "content" | "ad"; data: string | Service; index?: number }> = []
    let adIndex = 0

    for (let i = 0; i < paragraphs.length; i++) {
      result.push({ type: "content", data: paragraphs[i] })

      // Inserir banner de anúncio após este parágrafo se estiver em uma posição de anúncio
      if (adPositions.includes(i) && adIndex < services.length) {
        result.push({ type: "ad", data: services[adIndex], index: adIndex })
        adIndex++
      }
    }

    return result
  }, [content, services])

  if (contentWithAds.length === 1 && contentWithAds[0].type === "content") {
    return (
      <BlogContentFormatter
        content={content}
        className={proseClasses}
      />
    )
  }

  return (
    <div className={proseClasses}>
      {contentWithAds.map((item, index) => {
        if (item.type === "ad") {
          return (
            <BlogAdBanner key={`ad-${item.index}-${index}`} service={item.data as Service} />
          )
        }
        return (
          <div
            key={`content-${index}`}
            dangerouslySetInnerHTML={{ __html: item.data as string }}
          />
        )
      })}
    </div>
  )
}
