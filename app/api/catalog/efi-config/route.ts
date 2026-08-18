import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { sql } from "@/lib/db"
import { getCatalogSyncApiKey } from "@/lib/catalog-sync"
import { resolveEfiCertificatePath } from "@/lib/efi/certificate-path"

export const dynamic = "force-dynamic"

const unauthorized = () =>
  NextResponse.json({ error: "Não autorizado" }, { status: 401 })

export async function GET(request: NextRequest) {
  const apiKey = await getCatalogSyncApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chave de sincronização não configurada" },
      { status: 503 }
    )
  }

  const providedKey =
    request.headers.get("x-catalog-sync-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""

  if (providedKey !== apiKey) {
    return unauthorized()
  }

  if (!sql) {
    return NextResponse.json({ error: "Banco indisponível" }, { status: 503 })
  }

  const rows = (await sql!`
    SELECT
      client_id, client_secret, environment, pix_key,
      certificate_path, certificate_passphrase, webhook_url
    FROM efi_config
    WHERE is_active = true
    ORDER BY id DESC
    LIMIT 1
  `) as Array<{
    client_id: string
    client_secret: string
    environment: string
    pix_key: string
    certificate_path: string | null
    certificate_passphrase: string | null
    webhook_url: string | null
  }>

  if (!rows.length) {
    return NextResponse.json({ configured: false })
  }

  const row = rows[0]
  const certPath = resolveEfiCertificatePath(row.certificate_path)
  let certificateBase64: string | null = null
  let certificateFileName: string | null = null

  if (certPath) {
    try {
      const buf = await readFile(certPath)
      certificateBase64 = buf.toString("base64")
      certificateFileName = path.basename(certPath)
    } catch {
      /* certificado ausente no disco */
    }
  }

  return NextResponse.json({
    configured: Boolean(
      row.client_id && row.client_secret && row.pix_key && certificateBase64
    ),
    clientId: row.client_id,
    clientSecret: row.client_secret,
    pixKey: row.pix_key,
    sandbox: row.environment !== "production",
    webhookUrl: row.webhook_url,
    certificateFileName,
    certificateBase64,
    certificatePassword: row.certificate_passphrase || null,
  })
}
