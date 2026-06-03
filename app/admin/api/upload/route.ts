import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/middleware"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import {
  sanitizeFilename,
  isSafePath,
  validateMagicBytes,
  validatePayloadSize,
  getClientIP,
  logSecurityEvent,
  addSecurityHeaders,
} from "@/lib/security"

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const timestamp = new Date().toISOString()
  const url = request.url
  
  try {
    console.log(`[UPLOAD] Iniciando upload - IP: ${clientIP}, URL: ${url}, Timestamp: ${timestamp}`)
    
    // Rate limiting
    const identifier = getClientIdentifier(request)
    const limit = rateLimit(identifier, { windowMs: 60000, maxRequests: 10 }) // 10 uploads por minuto

    if (!limit.allowed) {
      const errorMsg = `[UPLOAD] Rate limit excedido - IP: ${clientIP}, URL: ${url}, Timestamp: ${timestamp}`
      console.error(errorMsg)
      logSecurityEvent("rate_limit", clientIP, { endpoint: "/admin/api/upload", url, timestamp })
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em alguns instantes." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(limit.resetTime).toISOString(),
          },
        }
      )
    }

    // Verificar autenticação
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      const errorMsg = `[UPLOAD] Não autenticado - IP: ${clientIP}, URL: ${url}, Timestamp: ${timestamp}`
      console.error(errorMsg)
      logSecurityEvent("suspicious", clientIP, { reason: "unauthorized_upload_attempt", url, timestamp })
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    
    console.log(`[UPLOAD] Autenticação OK - User ID: ${auth.userId}, IP: ${clientIP}`)

    // Validar tamanho do conteúdo da requisição
    const contentLength = request.headers.get("content-length")
    const contentLengthNum = contentLength ? parseInt(contentLength) : 0
    console.log(`[UPLOAD] Content-Length: ${contentLengthNum} bytes (${(contentLengthNum / 1024 / 1024).toFixed(2)} MB)`)
    
    if (contentLength && contentLengthNum > 10 * 1024 * 1024) {
      const errorMsg = `[UPLOAD] Requisição muito grande - Size: ${contentLengthNum} bytes, IP: ${clientIP}`
      console.error(errorMsg)
      return NextResponse.json({ error: "Requisição muito grande (máximo 10MB)" }, { status: 413 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string | null // Título do contexto (ex: nome do produto)

    if (!file) {
      const errorMsg = `[UPLOAD] Nenhum arquivo enviado - IP: ${clientIP}, URL: ${url}`
      console.error(errorMsg)
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }
    
    console.log(`[UPLOAD] Arquivo recebido - Nome: ${file.name}, Tipo: ${file.type}, Tamanho: ${file.size} bytes${title ? `, Título: ${title}` : ""}`)

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      logSecurityEvent("suspicious", getClientIP(request), {
        reason: "invalid_file_type",
        fileType: file.type,
        fileName: file.name,
      })
      return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 })
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máximo 5MB)" }, { status: 400 })
    }

    // Validar tamanho mínimo (prevenir arquivos vazios)
    if (file.size === 0) {
      return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validar magic bytes (verificar tipo real do arquivo)
    if (!validateMagicBytes(buffer, file.type)) {
      logSecurityEvent("suspicious", getClientIP(request), {
        reason: "magic_bytes_mismatch",
        declaredType: file.type,
        fileName: file.name,
      })
      return NextResponse.json(
        { error: "Tipo de arquivo não corresponde ao conteúdo" },
        { status: 400 }
      )
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), "public", "uploads")
    console.log(`[UPLOAD] Diretório de upload: ${uploadDir}`)
    
    if (!existsSync(uploadDir)) {
      console.log(`[UPLOAD] Criando diretório: ${uploadDir}`)
      await mkdir(uploadDir, { recursive: true })
      console.log(`[UPLOAD] Diretório criado com sucesso`)
    } else {
      console.log(`[UPLOAD] Diretório já existe`)
    }

    // Extrair nome original e extensão do arquivo
    const originalExtension = file.name.split(".").pop()?.toLowerCase() || ""
    const safeExtension = sanitizeFilename(originalExtension) || "bin"
    
    // Validar extensão
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif"]
    if (!allowedExtensions.includes(safeExtension)) {
      return NextResponse.json({ error: "Extensão de arquivo não permitida" }, { status: 400 })
    }

    // Extrair nome base do arquivo (sem extensão)
    const originalNameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name
    // Sanitizar nome original
    let baseName = sanitizeFilename(originalNameWithoutExt)
    
    // Se o nome ficou vazio após sanitização, usar "imagem"
    if (!baseName || baseName.length === 0) {
      baseName = "imagem"
    }
    
    // Limitar tamanho do nome base (máximo 100 caracteres)
    if (baseName.length > 100) {
      baseName = baseName.substring(0, 100)
    }

    // Se houver título, sanitizar e usar como prefixo se necessário
    let finalBaseName = baseName
    if (title) {
      const sanitizedTitle = sanitizeFilename(title)
      if (sanitizedTitle && sanitizedTitle.length > 0) {
        // Limitar tamanho do título (máximo 50 caracteres)
        const shortTitle = sanitizedTitle.length > 50 ? sanitizedTitle.substring(0, 50) : sanitizedTitle
        finalBaseName = `${shortTitle}-${baseName}`
      }
    }

    // Gerar nome do arquivo final
    let filename = `${finalBaseName}.${safeExtension}`
    let filepath = join(uploadDir, filename)
    let counter = 1

    // Verificar se arquivo já existe e gerar nome único se necessário
    while (existsSync(filepath)) {
      console.log(`[UPLOAD] Arquivo já existe: ${filename}, tentando com sufixo numérico`)
      // Se já existe, adicionar sufixo numérico antes da extensão
      filename = `${finalBaseName}-${counter}.${safeExtension}`
      filepath = join(uploadDir, filename)
      counter++
      
      // Limite de segurança para evitar loop infinito
      if (counter > 1000) {
        // Se chegou ao limite, usar timestamp como fallback
        const fileTimestamp = Date.now()
        filename = `${finalBaseName}-${fileTimestamp}.${safeExtension}`
        filepath = join(uploadDir, filename)
        break
      }
    }
    
    console.log(`[UPLOAD] Nome final do arquivo: ${filename}`)

    // Verificar path traversal (segurança extra)
    if (!isSafePath(filepath, uploadDir)) {
      logSecurityEvent("suspicious", getClientIP(request), {
        reason: "path_traversal_attempt",
        fileName: file.name,
        attemptedPath: filepath,
      })
      return NextResponse.json({ error: "Caminho de arquivo inválido" }, { status: 400 })
    }

    // Salvar arquivo
    console.log(`[UPLOAD] Salvando arquivo: ${filepath}`)
    await writeFile(filepath, buffer)
    console.log(`[UPLOAD] Arquivo salvo com sucesso: ${filename}`)

    // Retornar URL (absoluta em produção, relativa em desenvolvimento)
    const isProduction = process.env.NODE_ENV === "production"
    const frontendDomain = process.env.FRONTEND_DOMAIN || process.env.NEXT_PUBLIC_DOMAIN || ""
    
    let fileUrl: string
    if (isProduction && frontendDomain) {
      // Em produção, usar URL absoluta com o domínio do frontend
      // Remover protocolo se presente e garantir HTTPS
      const cleanDomain = frontendDomain.replace(/^https?:\/\//, "")
      // Usar /uploads/ com barra final para corresponder à configuração do Nginx
      fileUrl = `https://${cleanDomain}/uploads/${filename}`
    } else {
      // Em desenvolvimento, usar URL relativa com barra final
      fileUrl = `/uploads/${filename}`
    }
    
    console.log(`[UPLOAD] Upload concluído - URL: ${fileUrl}, IP: ${clientIP}, Production: ${isProduction}`)

    const response = NextResponse.json({ url: fileUrl, filename })
    return addSecurityHeaders(response)
  } catch (error) {
    const errorDetails = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : { error: String(error) }
    
    const errorMsg = `[UPLOAD] Erro ao fazer upload - IP: ${clientIP}, URL: ${url}, Timestamp: ${timestamp}, Erro: ${JSON.stringify(errorDetails)}`
    console.error(errorMsg)
    console.error("[UPLOAD] Stack trace completo:", error)
    
    logSecurityEvent("suspicious", clientIP, { 
      reason: "upload_error", 
      error: String(error),
      errorDetails,
      url,
      timestamp
    })
    
    const errCode = error instanceof Error && "code" in error ? String((error as NodeJS.ErrnoException).code) : ""
    let userMessage = "Erro ao fazer upload"
    if (errCode === "EACCES" || errCode === "EPERM") {
      userMessage =
        "Sem permissão para gravar em public/uploads. Na VPS: sudo chown -R 1001:1001 public/uploads && bash scripts/update.sh"
    } else if (error instanceof Error && error.message) {
      userMessage = error.message
    }

    return NextResponse.json(
      {
        error: userMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 },
    )
  }
}

