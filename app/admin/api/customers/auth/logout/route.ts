import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })

  response.cookies.delete("customer-token")

  return response
}

