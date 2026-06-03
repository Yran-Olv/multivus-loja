import { NextRequest, NextResponse } from "next/server"
import { getUserById } from "@/lib/auth"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-min-32-chars")

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      // Retornar 401 silenciosamente - é esperado quando não há autenticação
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { payload } = await jwtVerify(token, secret)
    const userId = payload.id as number

    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name } })
  } catch (error) {
    // Token inválido ou expirado - retornar 401 silenciosamente
    return NextResponse.json({ error: "Token inválido" }, { status: 401 })
  }
}

