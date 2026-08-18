import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export const dynamic = "force-dynamic"

type RouteParams = { params: Promise<{ code: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { code } = await params
  const shortCode = String(code || "").trim().toUpperCase()

  if (!shortCode || !/^[A-Z0-9]{6,12}$/.test(shortCode)) {
    return new NextResponse("Link inválido", { status: 404 })
  }

  if (!sql) {
    return new NextResponse("Serviço indisponível", { status: 503 })
  }

  const rows = (await sql!`
    SELECT activation_url
    FROM software_activation_links
    WHERE short_code = ${shortCode}
    LIMIT 1
  `) as Array<{ activation_url: string }>

  const target = rows[0]?.activation_url?.trim()
  if (!target || !/^https?:\/\//i.test(target)) {
    return new NextResponse("Link não encontrado", { status: 404 })
  }

  return NextResponse.redirect(target, 302)
}
