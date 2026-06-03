import { Metadata } from "next"

export function generateMetadata({
  title,
  description,
  image,
  url,
}: {
  title: string
  description: string
  image?: string
  url?: string
}): Metadata {
  const baseUrl = process.env.FRONTEND_DOMAIN || "http://localhost:3000"
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const ogImage = image || `${baseUrl}/placeholder.jpg`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: "MULTIVUS",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  }
}

