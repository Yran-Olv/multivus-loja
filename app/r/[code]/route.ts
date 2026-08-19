import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type RouteParams = { params: Promise<{ code: string }> }

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const htmlRedirect = (targetUrl: string): NextResponse => {
  const safeHref = escapeHtml(targetUrl)
  const jsUrl = JSON.stringify(targetUrl)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${safeHref}" />
  <title>Redirecionando…</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 2.5rem 1rem; }
    a { color: #1a73e8; word-break: break-all; }
  </style>
  <script>window.location.replace(${jsUrl});</script>
</head>
<body>
  <p>Redirecionando para ativação…</p>
  <p><a href="${safeHref}">Toque aqui se não abrir automaticamente</a></p>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  })
}

const htmlMessage = (title: string, message: string, status = 404): NextResponse => {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 2.5rem 1rem; color: #444; }
    h1 { font-size: 1.25rem; color: #111; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
</body>
</html>`

  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { code } = await params
  const shortCode = String(code || "").trim().toUpperCase()

  if (!shortCode || !/^[A-Z0-9]{6,12}$/.test(shortCode)) {
    return htmlMessage("Link inválido", "Este endereço curto não é válido.")
  }

  if (!sql) {
    return htmlMessage(
      "Serviço indisponível",
      "Tente novamente em alguns instantes.",
      503
    )
  }

  try {
    const rows = (await sql!`
      SELECT activation_url
      FROM software_activation_links
      WHERE short_code = ${shortCode}
      LIMIT 1
    `) as Array<{ activation_url: string }>

    const target = rows[0]?.activation_url?.trim()
    if (!target || !/^https?:\/\//i.test(target)) {
      return htmlMessage(
        "Link não encontrado",
        "Este link expirou, já foi usado ou não existe mais. Fale com o suporte."
      )
    }

    return htmlRedirect(target)
  } catch {
    return htmlMessage(
      "Erro temporário",
      "Não foi possível abrir o link agora. Tente de novo.",
      500
    )
  }
}
