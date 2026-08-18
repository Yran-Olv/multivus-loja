import { type NextRequest, NextResponse } from "next/server"
import { readdir, writeFile, mkdir, stat } from "fs/promises"
import path from "path"
import { verifyAuth } from "@/lib/middleware"
import {
  EFI_CERTS_CONTAINER_DIR,
  normalizeEfiCertificatePath,
  resolveEfiCertificatePath,
} from "@/lib/efi/certificate-path"

const HOST_CERTS_DIR = path.join(process.cwd(), "certs", "efi")
const MAX_CERT_BYTES = 512 * 1024

async function listCertificateFiles() {
  await mkdir(HOST_CERTS_DIR, { recursive: true })
  const entries = await readdir(HOST_CERTS_DIR, { withFileTypes: true })
  const files: Array<{ fileName: string; path: string; size: number }> = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const lower = entry.name.toLowerCase()
    if (!lower.endsWith(".p12") && !lower.endsWith(".pfx")) continue
    const full = path.join(HOST_CERTS_DIR, entry.name)
    const info = await stat(full)
    files.push({
      fileName: entry.name,
      path: normalizeEfiCertificatePath(entry.name) || `${EFI_CERTS_CONTAINER_DIR}/${entry.name}`,
      size: info.size,
    })
  }

  return files.sort((a, b) => a.fileName.localeCompare(b.fileName))
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const certificates = await listCertificateFiles()
    return NextResponse.json({ certificates })
  } catch (error) {
    console.error("[Efí Cert] GET:", error)
    return NextResponse.json({ error: "Erro ao listar certificados" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.isValid) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  try {
    const form = await request.formData()
    const file = form.get("certificate")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Envie o arquivo .p12 ou .pfx" }, { status: 400 })
    }

    const original = file.name.trim()
    const ext = path.extname(original).toLowerCase()
    if (ext !== ".p12" && ext !== ".pfx") {
      return NextResponse.json(
        { error: "Formato inválido. Use apenas .p12 ou .pfx" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!buffer.length || buffer.length > MAX_CERT_BYTES) {
      return NextResponse.json({ error: "Certificado inválido ou muito grande" }, { status: 400 })
    }

    const safeBase = path
      .basename(original, ext)
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64)

    const fileName = `${safeBase || "efi-cert"}${ext}`
    await mkdir(HOST_CERTS_DIR, { recursive: true })
    const dest = path.join(HOST_CERTS_DIR, fileName)
    await writeFile(dest, buffer, { mode: 0o600 })

    const certPath = normalizeEfiCertificatePath(fileName)

    return NextResponse.json({
      success: true,
      fileName,
      path: certPath,
      message: "Certificado enviado com sucesso",
    })
  } catch (error) {
    console.error("[Efí Cert] POST:", error)
    return NextResponse.json({ error: "Erro ao enviar certificado" }, { status: 500 })
  }
}

/** Valida se o caminho configurado existe no disco */
export async function HEAD(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth.isValid) {
    return new NextResponse(null, { status: 401 })
  }

  const configured = request.nextUrl.searchParams.get("path")
  const resolved = resolveEfiCertificatePath(configured)
  return new NextResponse(null, { status: resolved ? 200 : 404 })
}
