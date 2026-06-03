"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageWithWatermark } from "@/components/image-with-watermark"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  label?: string
  imageType?: "product" | "blog-card" | "blog-featured" | "general"
  title?: string // Título do contexto (ex: nome do produto) para usar se houver duplicata
}

export function ImageUpload({ value, onChange, label = "Imagem", imageType = "general", title }: ImageUploadProps) {
  const imageRecommendations = {
    product: {
      dimensions: "800px × 800px (quadrado)",
      maxSize: "250KB",
      aspectRatio: "1:1",
      format: "JPG (85%) ou WebP",
    },
    "blog-card": {
      dimensions: "800px × 600px (4:3)",
      maxSize: "200KB",
      aspectRatio: "4:3",
      format: "JPG (85%) ou WebP",
    },
    "blog-featured": {
      dimensions: "1200px × 675px (16:9)",
      maxSize: "300KB",
      aspectRatio: "16:9",
      format: "JPG (85-90%) ou WebP",
    },
    general: {
      dimensions: "800px × 450px (16:9)",
      maxSize: "200KB",
      aspectRatio: "16:9",
      format: "JPG (85%) ou WebP",
    },
  }

  const recommendation = imageRecommendations[imageType]
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Sincronizar preview com value quando value mudar (importante para edição)
  useEffect(() => {
    if (value !== preview) {
      setPreview(value || "")
    }
  }, [value])
  const [validation, setValidation] = useState<{
    dimensions: { valid: boolean; message: string }
    fileSize: { valid: boolean; message: string }
    aspectRatio: { valid: boolean; message: string }
    format: { valid: boolean; message: string }
    fileName: { valid: boolean; message: string }
  } | null>(null)

  const validateImage = (file: File): Promise<{
    dimensions: { valid: boolean; message: string }
    fileSize: { valid: boolean; message: string }
    aspectRatio: { valid: boolean; message: string }
    format: { valid: boolean; message: string }
    fileName: { valid: boolean; message: string }
  }> => {
    return new Promise((resolve) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        const width = img.width
        const height = img.height
        const aspectRatio = width / height

        // Validar formato
        const validFormats = ["image/jpeg", "image/jpg", "image/webp", "image/png"]
        const formatValid = validFormats.includes(file.type.toLowerCase())
        const formatMessage = formatValid
          ? `Formato válido: ${file.type.split("/")[1].toUpperCase()}`
          : "Formato não recomendado. Use JPG ou WebP para melhor compressão"

        // Validar nome do arquivo
        const fileNameValid = !file.name.includes(" ")
        const fileNameMessage = fileNameValid
          ? "Nome do arquivo válido"
          : "Nome contém espaços. Recomendado: usar hífens ou underscores"

        // Validar dimensões baseado no tipo
        let dimensionsValid = true
        let dimensionsMessage = ""
        let aspectRatioValid = true
        let aspectRatioMessage = ""

        if (imageType === "product") {
          // Produto: 800x800 (quadrado), tolerância de 50px
          const targetSize = 800
          const tolerance = 50
          dimensionsValid = Math.abs(width - targetSize) <= tolerance && Math.abs(height - targetSize) <= tolerance
          dimensionsMessage = dimensionsValid
            ? `Dimensões ideais: ${width}×${height}px`
            : `Recomendado: 800×800px. Atual: ${width}×${height}px`

          // Aspect ratio 1:1 (tolerância de 0.1)
          aspectRatioValid = Math.abs(aspectRatio - 1) <= 0.1
          aspectRatioMessage = aspectRatioValid
            ? "Aspect ratio correto (1:1)"
            : "Aspect ratio deve ser 1:1 (quadrado)"
        } else if (imageType === "blog-featured") {
          // Blog featured: 1200x675 (16:9), tolerância maior
          const targetWidth = 1200
          const targetHeight = 675
          const tolerance = 100
          dimensionsValid =
            Math.abs(width - targetWidth) <= tolerance && Math.abs(height - targetHeight) <= tolerance
          dimensionsMessage = dimensionsValid
            ? `Dimensões ideais: ${width}×${height}px`
            : `Recomendado: 1200×675px. Atual: ${width}×${height}px`

          // Aspect ratio 16:9 (tolerância de 0.2)
          const targetAspect = 16 / 9
          aspectRatioValid = Math.abs(aspectRatio - targetAspect) <= 0.2
          aspectRatioMessage = aspectRatioValid
            ? "Aspect ratio correto (16:9)"
            : "Aspect ratio deve ser 16:9"
        } else if (imageType === "blog-card") {
          // Blog card: 800x600 (4:3)
          const targetWidth = 800
          const targetHeight = 600
          const tolerance = 50
          dimensionsValid =
            Math.abs(width - targetWidth) <= tolerance && Math.abs(height - targetHeight) <= tolerance
          dimensionsMessage = dimensionsValid
            ? `Dimensões ideais: ${width}×${height}px`
            : `Recomendado: 800×600px. Atual: ${width}×${height}px`

          // Aspect ratio 4:3 (tolerância de 0.15)
          const targetAspect = 4 / 3
          aspectRatioValid = Math.abs(aspectRatio - targetAspect) <= 0.15
          aspectRatioMessage = aspectRatioValid
            ? "Aspect ratio correto (4:3)"
            : "Aspect ratio deve ser 4:3"
        } else {
          // General: 800x450 (16:9)
          const targetWidth = 800
          const targetHeight = 450
          const tolerance = 50
          dimensionsValid =
            Math.abs(width - targetWidth) <= tolerance && Math.abs(height - targetHeight) <= tolerance
          dimensionsMessage = dimensionsValid
            ? `Dimensões ideais: ${width}×${height}px`
            : `Recomendado: 800×450px. Atual: ${width}×${height}px`

          const targetAspect = 16 / 9
          aspectRatioValid = Math.abs(aspectRatio - targetAspect) <= 0.2
          aspectRatioMessage = aspectRatioValid
            ? "Aspect ratio correto (16:9)"
            : "Aspect ratio deve ser 16:9"
        }

        // Validar tamanho do arquivo
        const maxSizeKB = parseInt(recommendation.maxSize.replace("KB", ""))
        const fileSizeKB = file.size / 1024
        const fileSizeValid = fileSizeKB <= maxSizeKB
        const fileSizeMessage = fileSizeValid
          ? `Tamanho OK: ${fileSizeKB.toFixed(0)}KB (máx: ${maxSizeKB}KB)`
          : `Tamanho grande: ${fileSizeKB.toFixed(0)}KB. Recomendado: máximo ${maxSizeKB}KB. Comprima a imagem.`

        URL.revokeObjectURL(objectUrl)

        resolve({
          dimensions: { valid: dimensionsValid, message: dimensionsMessage },
          fileSize: { valid: fileSizeValid, message: fileSizeMessage },
          aspectRatio: { valid: aspectRatioValid, message: aspectRatioMessage },
          format: { valid: formatValid, message: formatMessage },
          fileName: { valid: fileNameValid, message: fileNameMessage },
        })
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        resolve({
          dimensions: { valid: false, message: "Erro ao ler dimensões da imagem" },
          fileSize: { valid: false, message: "Erro ao validar tamanho" },
          aspectRatio: { valid: false, message: "Erro ao validar aspect ratio" },
          format: { valid: false, message: "Erro ao validar formato" },
          fileName: { valid: false, message: "Erro ao validar nome" },
        })
      }

      img.src = objectUrl
    })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo básico
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      })
      return
    }

    // Validar tamanho máximo absoluto (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      })
      return
    }

    // Validar nome do arquivo (sem espaços)
    if (file.name.includes(" ")) {
      toast({
        title: "Aviso",
        description: "O nome do arquivo contém espaços. Recomendado: usar hífens ou underscores.",
        variant: "default",
      })
    }

    // Validar imagem (dimensões, aspect ratio, etc)
    const validationResult = await validateImage(file)
    setValidation(validationResult)

    // Avisar se houver problemas críticos
    if (!validationResult.dimensions.valid || !validationResult.aspectRatio.valid) {
      toast({
        title: "Aviso sobre dimensões",
        description: "A imagem não está no tamanho recomendado. Pode afetar a qualidade visual.",
        variant: "default",
      })
    }

    if (!validationResult.fileSize.valid) {
      toast({
        title: "Aviso sobre tamanho",
        description: "A imagem está muito grande. Recomendado comprimir antes de fazer upload.",
        variant: "default",
      })
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      // Enviar título se disponível (para usar em caso de nome duplicado)
      if (title) {
        formData.append("title", title)
      }

      const response = await fetch("/admin/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json().catch(() => ({} as { error?: string }))

      if (response.ok) {
        setPreview(data.url)
        onChange(data.url)
        toast({
          title: "Upload realizado!",
          description: "A imagem foi enviada com sucesso.",
        })
      } else {
        throw new Error(data.error || `Erro ao fazer upload (${response.status})`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível fazer upload da imagem."
      toast({
        title: "Erro no upload",
        description: message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label>{label}</Label>
        <div className="text-xs text-muted-foreground">
          <span className="hidden sm:inline">Recomendado: </span>
          <span className="font-medium">{recommendation.dimensions}</span>
          <span className="hidden md:inline">, max {recommendation.maxSize}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md border border-border/50">
        <p className="font-medium mb-2 flex items-center gap-1">
          <span>📐</span>
          <span>Tamanho recomendado:</span>
        </p>
        <ul className="space-y-1 ml-5 list-disc">
          <li>Dimensões: <span className="font-medium text-foreground">{recommendation.dimensions}</span></li>
          <li>Tamanho máximo do arquivo: <span className="font-medium text-foreground">{recommendation.maxSize}</span></li>
          <li>Formato: <span className="font-medium text-foreground">{recommendation.format}</span></li>
        </ul>
        <p className="mt-2 text-[10px] opacity-75 flex items-center gap-1">
          <span>💡</span>
          <span>Dica: Comprima a imagem antes de fazer upload para melhor performance do site</span>
        </p>
      </div>
      {preview ? (
        <div className="relative w-full aspect-video max-h-[300px] sm:max-h-[350px] border rounded-lg overflow-hidden">
          <ImageWithWatermark 
            src={preview} 
            alt="Preview" 
            fill 
            className="object-cover"
            showWatermark={true}
            watermarkPosition="bottom-right"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-20"
            onClick={() => {
              setPreview("")
              onChange("")
              setValidation(null)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">Clique para fazer upload ou arraste uma imagem</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Selecionar Imagem"
            )}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
      {!preview && (
        <Input
          type="url"
          placeholder="Ou cole uma URL de imagem"
          onChange={(e) => {
            setPreview(e.target.value)
            onChange(e.target.value)
            setValidation(null)
          }}
        />
      )}

      {/* Validações */}
      {validation && (
        <div className="space-y-2 mt-3">
          <div className="text-xs font-medium text-foreground mb-2">Validações da imagem:</div>
          <div className="space-y-1.5">
            <div className={`flex items-start gap-2 text-xs ${validation.dimensions.valid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {validation.dimensions.valid ? (
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              )}
              <span>{validation.dimensions.message}</span>
            </div>
            <div className={`flex items-start gap-2 text-xs ${validation.fileSize.valid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {validation.fileSize.valid ? (
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              )}
              <span>{validation.fileSize.message}</span>
            </div>
            <div className={`flex items-start gap-2 text-xs ${validation.aspectRatio.valid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {validation.aspectRatio.valid ? (
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              )}
              <span>{validation.aspectRatio.message}</span>
            </div>
            <div className={`flex items-start gap-2 text-xs ${validation.format.valid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {validation.format.valid ? (
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              )}
              <span>{validation.format.message}</span>
            </div>
            <div className={`flex items-start gap-2 text-xs ${validation.fileName.valid ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {validation.fileName.valid ? (
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              )}
              <span>{validation.fileName.message}</span>
            </div>
          </div>
          {validation.dimensions.valid && validation.fileSize.valid && validation.aspectRatio.valid && validation.format.valid && validation.fileName.valid && (
            <Alert className="mt-2 border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                Imagem otimizada! Todas as validações passaram. Pode fazer upload com confiança.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  )
}

