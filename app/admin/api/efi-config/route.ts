import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { normalizeEfiCertificatePath } from "@/lib/efi/certificate-path"
import { verifyAuth } from "@/lib/middleware"

const sanitizeCredential = (value: unknown): string =>
  String(value || "")
    .trim()
    .replace(/^>\s*/, "")

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const configs = await sql!`
      SELECT id, client_id, client_secret, environment, pix_key, certificate_path, webhook_url, is_active, created_at, updated_at
      FROM efi_config
      WHERE is_active = true
      ORDER BY id DESC
      LIMIT 1
    `

    if (configs.length === 0) {
      return NextResponse.json({ config: null })
    }

    return NextResponse.json({ config: configs[0] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[Efí Config] GET:", error)
    if (message.includes("does not exist") || message.includes("não existe")) {
      return NextResponse.json(
        { error: "Tabela efi_config não encontrada. Execute: bash scripts/update.sh" },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: "Erro ao buscar configuração" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      client_id,
      client_secret,
      environment,
      pix_key,
      certificate_path,
      certificate_passphrase,
      webhook_url,
    } = body

    if (!client_id || !environment || !pix_key) {
      return NextResponse.json(
        { error: "Client ID, Ambiente e Chave Pix são obrigatórios" },
        { status: 400 }
      )
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const certPath = certificate_path ? normalizeEfiCertificatePath(certificate_path) : null
    const cleanClientId = sanitizeCredential(client_id)
    const cleanClientSecret = client_secret ? sanitizeCredential(client_secret) : null
    const cleanPixKey = sanitizeCredential(pix_key)

    const existing = await sql!`SELECT id FROM efi_config WHERE is_active = true LIMIT 1`

    if (existing.length > 0) {
      if (cleanClientSecret) {
        await sql!`
          UPDATE efi_config
          SET client_id = ${cleanClientId},
              client_secret = ${cleanClientSecret},
              environment = ${environment},
              pix_key = ${cleanPixKey},
              certificate_path = ${certPath},
              certificate_passphrase = ${certificate_passphrase || null},
              webhook_url = ${webhook_url || null},
              updated_at = CURRENT_TIMESTAMP
          WHERE is_active = true
        `
      } else {
        await sql!`
          UPDATE efi_config
          SET client_id = ${cleanClientId},
              environment = ${environment},
              pix_key = ${cleanPixKey},
              certificate_path = ${certPath},
              certificate_passphrase = COALESCE(${certificate_passphrase || null}, certificate_passphrase),
              webhook_url = ${webhook_url || null},
              updated_at = CURRENT_TIMESTAMP
          WHERE is_active = true
        `
      }
    } else {
      if (!cleanClientSecret) {
        return NextResponse.json({ error: "Client Secret é obrigatório na primeira configuração" }, { status: 400 })
      }
      await sql!`UPDATE efi_config SET is_active = false WHERE is_active = true`
      await sql!`
        INSERT INTO efi_config (
          client_id, client_secret, environment, pix_key,
          certificate_path, certificate_passphrase, webhook_url, is_active
        )
        VALUES (
          ${cleanClientId}, ${cleanClientSecret}, ${environment}, ${cleanPixKey},
          ${certPath}, ${certificate_passphrase || null}, ${webhook_url || null}, true
        )
      `
    }

    return NextResponse.json({ success: true, message: "Configuração Efí salva com sucesso" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[Efí Config] POST:", error)
    if (message.includes("does not exist")) {
      return NextResponse.json(
        { error: "Tabela efi_config não encontrada. Execute migrations." },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 })
  }
}
