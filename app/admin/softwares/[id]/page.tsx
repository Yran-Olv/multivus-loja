import { sql, type Software } from "@/lib/db"
import { SoftwareForm } from "@/components/software-form"
import { getSoftwareLinkStats, getSoftwareAvailableLinkRows } from "@/app/actions/softwares"
import { buildActivationShortUrl } from "@/lib/activation-short-url"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"

export default async function EditSoftwarePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!sql) {
    notFound()
  }

  const softwares = (await sql!`SELECT * FROM softwares WHERE id = ${id}`) as unknown as Software[]

  if (softwares.length === 0) {
    notFound()
  }

  const software = softwares[0]
  const linkStats = await getSoftwareLinkStats(Number(id))
  const availableLinkRows = await getSoftwareAvailableLinkRows(Number(id))
  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    "https://multivus.shop"
  const availableLinksForForm = availableLinkRows.map(row => ({
    ...row,
    shortUrl: row.shortCode ? buildActivationShortUrl(row.shortCode, siteBase) : null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Editar Software</h1>
        <p className="text-muted-foreground">Atualize as informações do software</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Software</CardTitle>
        </CardHeader>
        <CardContent>
          <SoftwareForm
            linkStats={linkStats}
            availableLinkRows={availableLinksForForm}
            software={{
              id: software.id,
              name: software.name,
              description: software.description,
              short_description: software.short_description,
              version: software.version,
              price: software.price?.toString() || "0",
              category: software.category || "",
              image_url: software.icon || "",
              features: software.features || [],
              system_requirements: software.system_requirements || {},
              is_featured: software.is_featured,
              activation_url: software.activation_url || "",
              activation_message_template: software.activation_message_template || "",
              order_id_prefix: software.order_id_prefix || "LNK",
              link_validity_days: software.link_validity_days ?? 7,
              sold_out_message: software.sold_out_message || "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
