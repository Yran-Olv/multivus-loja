import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key-min-32-chars")

export async function verifyAuth(request: NextRequest): Promise<{ isValid: boolean; userId?: number }> {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return { isValid: false }
    }

    const { payload } = await jwtVerify(token, secret)
    return { isValid: true, userId: payload.id as number }
  } catch (error) {
    return { isValid: false }
  }
}

export function requireAuth(handler: (request: NextRequest, userId: number) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const auth = await verifyAuth(request)

    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    return handler(request, auth.userId)
  }
}

