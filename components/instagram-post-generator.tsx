"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Instagram, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface InstagramPostGeneratorProps {
  post: {
    title: string
    featured_image: string | null
    excerpt: string | null
    category: string | null
    author_name: string | null
    content: string
  }
}

interface GeneratedSlide {
  imageUrl: string
  index: number
  total: number
}

export function InstagramPostGenerator({ post }: InstagramPostGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [slides, setSlides] = useState<GeneratedSlide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const { toast } = useToast()

  // Função para extrair texto do HTML
  const extractTextFromHTML = (html: string): string => {
    if (!html) return ""
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html
    return (tempDiv.textContent || tempDiv.innerText || "")
      .replace(/\s+/g, " ")
      .trim()
  }

  // Função para quebrar texto em linhas que cabem no canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(" ")
    const lines: string[] = []
    let currentLine = ""

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? " " : "") + word
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    if (currentLine) {
      lines.push(currentLine)
    }
    return lines
  }

  // Função para desenhar uma seta no canvas
  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, direction: "left" | "right", size: number = 40) => {
    ctx.strokeStyle = "#3b82f6"
    ctx.fillStyle = "#3b82f6"
    ctx.lineWidth = 4
    
    if (direction === "right") {
      // Seta para direita (→)
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + size * 0.6, y)
      ctx.lineTo(x + size * 0.6, y - size * 0.3)
      ctx.lineTo(x + size, y)
      ctx.lineTo(x + size * 0.6, y + size * 0.3)
      ctx.lineTo(x + size * 0.6, y)
      ctx.closePath()
      ctx.fill()
    } else {
      // Seta para esquerda (←)
      ctx.beginPath()
      ctx.moveTo(x + size, y)
      ctx.lineTo(x + size * 0.4, y)
      ctx.lineTo(x + size * 0.4, y - size * 0.3)
      ctx.lineTo(x, y)
      ctx.lineTo(x + size * 0.4, y + size * 0.3)
      ctx.lineTo(x + size * 0.4, y)
      ctx.closePath()
      ctx.fill()
    }
  }

  // Função para gerar um slide individual
  const generateSlide = async (
    slideIndex: number,
    totalSlides: number,
    titleLines: string[],
    contentLines: string[],
    startLineIndex: number,
    endLineIndex: number
  ): Promise<string> => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Canvas não disponível")
    }

    const width = 1080
    const height = 1080
    canvas.width = width
    canvas.height = height

    // Fundo gradiente
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#0a0a0a")
    gradient.addColorStop(1, "#1a1a1a")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    let currentY = 60

    // Categoria (apenas no primeiro slide)
    if (slideIndex === 0 && post.category) {
      ctx.fillStyle = "#3b82f6"
      ctx.fillRect(40, currentY, 200, 50)
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 28px Arial"
      ctx.textAlign = "left"
      ctx.fillText(post.category.toUpperCase(), 60, currentY + 35)
      currentY += 80
    }

    // Título (apenas no primeiro slide)
    if (slideIndex === 0) {
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 42px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      
      const maxWidth = width - 120
      
      titleLines.forEach((line, index) => {
        const y = currentY + index * 60
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
        ctx.fillText(line, width / 2 + 2, y + 2, maxWidth)
        ctx.fillStyle = "#ffffff"
        ctx.fillText(line, width / 2, y, maxWidth)
      })
      
      currentY += titleLines.length * 60 + 30

      // Linha divisória após título
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(60, currentY)
      ctx.lineTo(width - 60, currentY)
      ctx.stroke()
      
      currentY += 40
    } else {
      // Nos outros slides, mostrar "Continuação..." no topo
      ctx.fillStyle = "#3b82f6"
      ctx.font = "bold 32px Arial"
      ctx.textAlign = "center"
      ctx.fillText("Continuação...", width / 2, currentY)
      currentY += 60
    }

    // Conteúdo do blog
    const contentMaxWidth = width - 120
    const linesToShow = contentLines.slice(startLineIndex, endLineIndex)
    const maxContentY = height - 200 // Espaço para marca d'água e indicadores
    const isLastSlide = slideIndex === totalSlides - 1

    ctx.fillStyle = "#e0e0e0"
    ctx.font = "24px Arial"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"

    // Desenhar todas as linhas
    // No último slide, desenhar todas mesmo que ultrapasse um pouco o limite
    linesToShow.forEach((line, index) => {
      const y = currentY + index * 32
      // No último slide, desenhar todas as linhas mesmo que ultrapasse
      // Nos outros slides, respeitar o limite
      if (isLastSlide || y + 32 <= maxContentY) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
        ctx.fillText(line, 62, y + 1, contentMaxWidth)
        ctx.fillStyle = "#e0e0e0"
        ctx.fillText(line, 60, y, contentMaxWidth)
      }
    })

    // Seta indicando que há mais conteúdo (se não for o último slide)
    if (slideIndex < totalSlides - 1) {
      drawArrow(ctx, width - 80, height / 2, "right", 50)
    }

    // Seta indicando que há conteúdo anterior (se não for o primeiro slide)
    if (slideIndex > 0) {
      drawArrow(ctx, 30, height / 2, "left", 50)
    }

    // Indicador de slide (ex: 1/3, 2/3)
    ctx.fillStyle = "rgba(59, 130, 246, 0.8)"
    ctx.fillRect(width / 2 - 60, height - 100, 120, 40)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 24px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${slideIndex + 1}/${totalSlides}`, width / 2, height - 75)

    // Marca d'água MULTIVUS (canto inferior direito)
    const watermarkWidth = 280
    const watermarkHeight = 80
    const watermarkX = width - watermarkWidth - 20
    const watermarkY = height - watermarkHeight - 20
    
    const watermarkGradient = ctx.createLinearGradient(watermarkX, watermarkY, watermarkX + watermarkWidth, watermarkY + watermarkHeight)
    watermarkGradient.addColorStop(0, "rgba(59, 130, 246, 0.9)")
    watermarkGradient.addColorStop(1, "rgba(37, 99, 235, 0.9)")
    ctx.fillStyle = watermarkGradient
    ctx.fillRect(watermarkX, watermarkY, watermarkWidth, watermarkHeight)
    
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
    ctx.lineWidth = 2
    ctx.strokeRect(watermarkX, watermarkY, watermarkWidth, watermarkHeight)
    
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 40px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("MULTIVUS", watermarkX + watermarkWidth / 2, watermarkY + watermarkHeight / 2)

    return canvas.toDataURL("image/png")
  }

  const generateInstagramPost = async () => {
    setGenerating(true)
    try {
      const width = 1080
      const height = 1080
      
      // Criar canvas temporário para medir texto
      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) {
        throw new Error("Canvas não disponível")
      }
      tempCanvas.width = width
      tempCanvas.height = height

      // Configurar fonte para medir
      tempCtx.font = "bold 42px Arial"
      const maxWidth = width - 120
      
      // Quebrar título em linhas
      const titleLines = wrapText(tempCtx, post.title, maxWidth)
      
      // Calcular espaço usado pelo título
      const titleHeight = titleLines.length * 60 + 30 + 40 // título + linha divisória + margem
      const categoryHeight = post.category ? 80 : 0
      const headerHeight = categoryHeight + titleHeight
      
      // Extrair e quebrar conteúdo em linhas
      const contentText = extractTextFromHTML(post.content)
      tempCtx.font = "24px Arial"
      const contentMaxWidth = width - 120
      const allContentLines = wrapText(tempCtx, contentText, contentMaxWidth)
      
      // Calcular quantas linhas cabem por slide
      const maxContentY = height - 200 // Espaço para marca d'água e indicadores (200px)
      const lineHeight = 32
      
      // Espaço disponível no primeiro slide (com título)
      const firstSlideStartY = headerHeight + 40 // Após título e linha divisória
      const firstSlideAvailableHeight = maxContentY - firstSlideStartY
      const firstSlideLines = Math.max(1, Math.floor(firstSlideAvailableHeight / lineHeight))
      
      // Espaço disponível nos slides seguintes (sem título, apenas "Continuação...")
      const subsequentSlideStartY = 100 // "Continuação..." + margem
      const subsequentSlideAvailableHeight = maxContentY - subsequentSlideStartY
      const subsequentSlideLines = Math.max(1, Math.floor(subsequentSlideAvailableHeight / lineHeight))
      
      // Calcular quantos slides são necessários
      let totalSlides = 1
      let remainingLines = allContentLines.length
      
      // Primeiro slide
      const firstSlideContentLines = Math.min(firstSlideLines, remainingLines)
      remainingLines -= firstSlideContentLines
      
      // Slides seguintes
      if (remainingLines > 0) {
        totalSlides += Math.ceil(remainingLines / subsequentSlideLines)
      }
      
      // Gerar todos os slides
      const generatedSlides: GeneratedSlide[] = []
      let currentLineIndex = 0
      
      for (let i = 0; i < totalSlides; i++) {
        let startLine = currentLineIndex
        let endLine = 0
        
        if (i === 0) {
          // Primeiro slide: título + primeiras linhas
          endLine = Math.min(startLine + firstSlideContentLines, allContentLines.length)
        } else if (i === totalSlides - 1) {
          // Último slide: incluir TODAS as linhas restantes
          endLine = allContentLines.length
        } else {
          // Slides seguintes: continuar de onde parou
          endLine = Math.min(startLine + subsequentSlideLines, allContentLines.length)
        }
        
        // Garantir que não ultrapasse o total de linhas
        endLine = Math.min(endLine, allContentLines.length)
        
        // Garantir que sempre processe pelo menos uma linha
        if (endLine <= startLine && startLine < allContentLines.length) {
          endLine = startLine + 1
        }
        
        // Debug: log para verificar
        if (i === totalSlides - 1) {
          console.log(`[Instagram] Último slide: linhas ${startLine} a ${endLine} de ${allContentLines.length} total`)
        }
        
        const slideUrl = await generateSlide(
          i,
          totalSlides,
          i === 0 ? titleLines : [],
          allContentLines,
          startLine,
          endLine
        )
        
        generatedSlides.push({
          imageUrl: slideUrl,
          index: i,
          total: totalSlides,
        })
        
        // Atualizar índice para próximo slide
        currentLineIndex = endLine
        
        // Se já processamos todas as linhas, parar
        if (currentLineIndex >= allContentLines.length) {
          break
        }
      }
      
      // Ajustar total de slides caso tenha gerado menos
      if (generatedSlides.length < totalSlides) {
        const actualTotal = generatedSlides.length
        // Regenerar slides com total correto
        for (let i = 0; i < generatedSlides.length; i++) {
          const slide = generatedSlides[i]
          let startLine = 0
          let endLine = 0
          
          if (i === 0) {
            startLine = 0
            endLine = Math.min(firstSlideContentLines, allContentLines.length)
          } else {
            let lineCount = firstSlideContentLines
            for (let j = 1; j < i; j++) {
              lineCount += subsequentSlideLines
            }
            startLine = lineCount
            endLine = Math.min(startLine + subsequentSlideLines, allContentLines.length)
          }
          
          const slideUrl = await generateSlide(
            i,
            actualTotal,
            i === 0 ? titleLines : [],
            allContentLines,
            startLine,
            endLine
          )
          
          slide.imageUrl = slideUrl
          slide.total = actualTotal
        }
      }

      // Debug: verificar se cada slide tem URL única
      generatedSlides.forEach((slide, idx) => {
        console.log(`[Instagram] Slide ${idx + 1}: URL length = ${slide.imageUrl?.length || 0}, index = ${slide.index}`)
      })

      setSlides(generatedSlides)
      setCurrentSlideIndex(0)

      toast({
        title: "Posts gerados!",
        description: `${generatedSlides.length} imagem${generatedSlides.length > 1 ? "ns" : ""} pronta${generatedSlides.length > 1 ? "s" : ""} para download.`,
      })
    } catch (error) {
      console.error("[Instagram] Error generating post:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar os posts do Instagram.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const downloadImage = (slideIndex?: number) => {
    if (slides.length === 0) return

    const slideToDownload = slideIndex !== undefined ? slides[slideIndex] : slides[currentSlideIndex]
    if (!slideToDownload) return

    const link = document.createElement("a")
    link.download = `instagram-post-${post.title.slice(0, 20).replace(/\s+/g, "-")}-${slideToDownload.index + 1}.png`
    link.href = slideToDownload.imageUrl
    link.click()

    toast({
      title: "Download iniciado!",
      description: `Imagem ${slideToDownload.index + 1}/${slideToDownload.total} foi salva.`,
    })
  }

  const downloadAll = async () => {
    if (slides.length === 0) return

    toast({
      title: "Downloads iniciados!",
      description: `${slides.length} imagem${slides.length > 1 ? "ns" : ""} serão baixadas sequencialmente.`,
    })

    // Download sequencial para garantir que cada um seja processado
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      
      // Verificar se a URL do slide é válida
      if (!slide.imageUrl) {
        console.error(`[Instagram] Slide ${i + 1} não tem imageUrl`)
        continue
      }
      
      // Criar link único para cada download
      const link = document.createElement("a")
      const fileName = `instagram-post-${post.title.slice(0, 20).replace(/\s+/g, "-")}-${slide.index + 1}.png`
      link.download = fileName
      link.href = slide.imageUrl
      
      // Adicionar ao DOM temporariamente
      link.style.display = "none"
      document.body.appendChild(link)
      
      // Trigger do download
      link.click()
      
      console.log(`[Instagram] Download ${i + 1}/${slides.length}: ${fileName} (slide ${slide.index + 1}/${slide.total})`)
      console.log(`[Instagram] URL length: ${slide.imageUrl.length}, starts with: ${slide.imageUrl.substring(0, 50)}...`)
      
      // Remover o link após um delay
      setTimeout(() => {
        try {
          if (link.parentNode && document.body.contains(link)) {
            document.body.removeChild(link)
          }
        } catch (error) {
          // Ignorar erro se o elemento já foi removido
          console.warn("[Instagram] Erro ao remover link de download:", error)
        }
      }, 1000)
      
      // Aguardar antes do próximo download (exceto no último)
      if (i < slides.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    toast({
      title: "Downloads concluídos!",
      description: `Todas as ${slides.length} imagem${slides.length > 1 ? "ns" : ""} foram enviadas para download.`,
    })
  }

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
    }
  }

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }

  return (
    <div className="border-t border-border pt-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Gerar Post para Instagram
          </h3>
          <p className="text-sm text-muted-foreground">
            Crie imagens prontas para postar no Instagram (carrossel se necessário)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {slides.length === 0 ? (
            <Button
              onClick={generateInstagramPost}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Instagram className="h-4 w-4" />
                  Gerar Post
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={downloadAll} className="gap-2" variant="outline">
                <Download className="h-4 w-4" />
                Baixar Todas
              </Button>
              <Button onClick={() => downloadImage()} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar Esta
              </Button>
            </div>
          )}
        </div>
      </div>

      {slides.length > 0 && (
        <div className="mt-4 border border-border rounded-lg overflow-hidden bg-muted/30">
          <div className="p-4 bg-muted/50 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Preview do Post:</p>
                <p className="text-xs text-muted-foreground">
                  {slides.length} imagem{slides.length > 1 ? "ns" : ""} • Tamanho: 1080x1080px
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevSlide}
                  disabled={currentSlideIndex === 0}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[50px] text-center">
                  {currentSlideIndex + 1}/{slides.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="p-4 flex justify-center bg-background">
            <div className="relative w-full max-w-md aspect-square">
              <Image
                src={slides[currentSlideIndex].imageUrl}
                alt={`Post do Instagram ${currentSlideIndex + 1}/${slides.length}`}
                fill
                className="object-contain rounded-lg"
              />
            </div>
          </div>
          {slides.length > 1 && (
            <div className="p-4 bg-muted/50 border-t border-border">
              <div className="flex items-center justify-center gap-2 mb-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlideIndex
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/30"
                    }`}
                    aria-label={`Ir para slide ${index + 1}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                💡 Dica: Arraste para o lado no Instagram para ver todas as imagens
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
