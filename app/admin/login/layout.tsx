import type React from "react"

// Layout vazio para a página de login - não usa o layout do admin
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

