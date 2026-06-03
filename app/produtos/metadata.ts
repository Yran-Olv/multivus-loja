import { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"

export const metadata: Metadata = genMeta({
  title: "Produtos - MULTIVUS",
  description: "Confira nossa seleção completa de notebooks, desktops, periféricos e componentes de qualidade.",
  url: "/produtos",
})

