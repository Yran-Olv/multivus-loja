import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/middleware"
import { unblockIP, unblockAllIPs, getBlockedIPs, getClientIP } from "@/lib/security"

/**
 * GET /admin/api/security/unblock
 * Lista IPs bloqueados
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const blockedIPs = getBlockedIPs()
    
    return NextResponse.json({
      success: true,
      blockedIPs,
      count: blockedIPs.length,
    })
  } catch (error: any) {
    console.error("[Security] Error listing blocked IPs:", error)
    return NextResponse.json(
      { error: "Erro ao listar IPs bloqueados", details: error?.message },
      { status: 500 }
    )
  }
}

/**
 * POST /admin/api/security/unblock
 * Desbloqueia um IP específico ou todos os IPs
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { ip, unblockAll } = body

    if (unblockAll) {
      // Desbloquear todos os IPs
      const count = unblockAllIPs()
      return NextResponse.json({
        success: true,
        message: `Todos os IPs foram desbloqueados (${count} IPs)`,
        unblockedCount: count,
      })
    }

    if (!ip) {
      return NextResponse.json(
        { error: "IP é obrigatório ou use unblockAll: true" },
        { status: 400 }
      )
    }

    // Desbloquear IP específico
    unblockIP(ip)
    
    return NextResponse.json({
      success: true,
      message: `IP ${ip} foi desbloqueado`,
      ip,
    })
  } catch (error: any) {
    console.error("[Security] Error unblocking IP:", error)
    return NextResponse.json(
      { error: "Erro ao desbloquear IP", details: error?.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /admin/api/security/unblock?ip=xxx
 * Desbloqueia um IP específico via query parameter
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const ip = searchParams.get("ip")

    if (!ip) {
      return NextResponse.json(
        { error: "Parâmetro 'ip' é obrigatório" },
        { status: 400 }
      )
    }

    unblockIP(ip)
    
    return NextResponse.json({
      success: true,
      message: `IP ${ip} foi desbloqueado`,
      ip,
    })
  } catch (error: any) {
    console.error("[Security] Error unblocking IP:", error)
    return NextResponse.json(
      { error: "Erro ao desbloquear IP", details: error?.message },
      { status: 500 }
    )
  }
}

