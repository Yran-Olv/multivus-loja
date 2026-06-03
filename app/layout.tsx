import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MULTIVUS - Assistência Técnica e Venda de Computadores",
  description:
    "Assistência técnica especializada, venda de equipamentos e suporte em TI. Mais de 5 anos de experiência em Santa Juliana MG.",
  generator: "multivus.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`font-sans antialiased`} suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
