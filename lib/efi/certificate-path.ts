import fs from "node:fs"
import path from "node:path"

/** Caminho dentro do container (volume ./certs/efi → /app/certs/efi) */
export const EFI_CERTS_CONTAINER_DIR = "/app/certs/efi"

/**
 * Caminho canônico para gravar no banco (sempre dentro do container).
 */
export function normalizeEfiCertificatePath(configured: string | null | undefined): string | null {
  const raw = configured?.trim()
  if (!raw) return null
  const base = path.basename(raw)
  return `${EFI_CERTS_CONTAINER_DIR}/${base}`
}

/**
 * Resolve o .p12 no disco (aceita caminho antigo da VPS ou só o nome do arquivo).
 */
export function resolveEfiCertificatePath(configured: string | null | undefined): string | null {
  const raw = configured?.trim()
  if (!raw) return null

  const base = path.basename(raw)
  const candidates = new Set<string>([
    raw,
    `${EFI_CERTS_CONTAINER_DIR}/${base}`,
    path.join(process.cwd(), "certs", "efi", base),
  ])

  const fromHost = raw.match(/certs\/efi\/([^/]+\.p12)$/i)
  if (fromHost) {
    candidates.add(`${EFI_CERTS_CONTAINER_DIR}/${fromHost[1]}`)
    candidates.add(path.join(process.cwd(), "certs", "efi", fromHost[1]))
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }

  return normalizeEfiCertificatePath(raw)
}

export function efiCertificateMissingMessage(configured: string | null | undefined): string {
  const normalized = normalizeEfiCertificatePath(configured)
  return (
    `Certificado Efí não encontrado. Copie o .p12 para certs/efi/ na VPS e use no painel: ${normalized}. ` +
    `No Docker o caminho é /app/certs/efi/ (não use /var/www/...).`
  )
}
